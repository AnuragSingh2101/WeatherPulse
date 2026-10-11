import logging
import os
from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col
from pyspark.sql.types import (
    StructType,
    StructField,
    StringType,
    FloatType,
    IntegerType,
)

KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "broker:29092")
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "weather_data")
CASSANDRA_HOST = os.getenv("CASSANDRA_HOST", "cassandra")
CASSANDRA_KEYSPACE = os.getenv("CASSANDRA_KEYSPACE", "spark_streams")
CASSANDRA_TABLE = os.getenv("CASSANDRA_TABLE", "weather_data")


def create_keyspace(session):
    session.execute(
        f"""
        CREATE KEYSPACE IF NOT EXISTS {CASSANDRA_KEYSPACE}
        WITH replication = {{'class': 'SimpleStrategy', 'replication_factor': '1'}};
    """
    )
    print("Keyspace created successfully!")


def create_table(session):
    session.execute(
        f"""
    CREATE TABLE IF NOT EXISTS {CASSANDRA_KEYSPACE}.{CASSANDRA_TABLE} (
        station_id TEXT,
        timestamp TEXT,
        city TEXT,
        country TEXT,
        latitude FLOAT,
        longitude FLOAT,
        temperature FLOAT,
        humidity INT,
        pressure FLOAT,
        wind_speed FLOAT,
        wind_direction TEXT,
        precipitation FLOAT,
        weather_condition TEXT,
        PRIMARY KEY ((city), timestamp, station_id)
    ) WITH CLUSTERING ORDER BY (timestamp DESC, station_id ASC);
    """
    )
    print("Weather data table created successfully!")


def create_spark_connection():
    s_conn = None
    try:
        s_conn = (
            SparkSession.builder.appName("SparkDataStreaming")
            .config(
                "spark.jars.packages",
                "com.datastax.spark:spark-cassandra-connector_2.12:3.4.1,"
                "org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.1",
            )
            .config("spark.cassandra.connection.host", CASSANDRA_HOST)
            .getOrCreate()
        )
        s_conn.sparkContext.setLogLevel("WARN")
        logging.info("Spark connection created successfully!")
    except Exception as e:
        logging.error(f"Couldn't create the spark session due to exception {e}")

    return s_conn


def connect_to_kafka(spark_conn):
    spark_df = None
    try:
        spark_df = (
            spark_conn.readStream.format("kafka")
            .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP_SERVERS)
            .option("subscribe", KAFKA_TOPIC)
            .option("startingOffsets", "earliest")
            .load()
        )
        spark_df.printSchema()
        logging.info("Kafka DataFrame created successfully")
    except Exception as e:
        logging.warning(f"Kafka DataFrame could not be created because: {e}")

    return spark_df


def create_cassandra_connection():
    try:
        from cassandra.cluster import Cluster
        cluster = Cluster([CASSANDRA_HOST])
        cas_session = cluster.connect()
        return cas_session
    except Exception as e:
        logging.warning(f"Could not create direct Python Cassandra connection: {e}")
        return None


def create_selection_df_from_kafka(spark_df):
    # Define the schema for the nested weather data
    schema = StructType(
        [
            StructField("station_id", StringType(), False),
            StructField("timestamp", StringType(), False),
            StructField(
                "location",
                StructType(
                    [  # Nested JSON for location
                        StructField("city", StringType(), False),
                        StructField("country", StringType(), False),
                        StructField("latitude", FloatType(), False),
                        StructField("longitude", FloatType(), False),
                    ]
                ),
            ),
            StructField("temperature", FloatType(), False),
            StructField("humidity", IntegerType(), False),
            StructField("pressure", FloatType(), False),
            StructField("wind_speed", FloatType(), False),
            StructField("wind_direction", StringType(), False),
            StructField("precipitation", FloatType(), False),
            StructField("weather_condition", StringType(), False),
        ]
    )

    # Parse the Kafka value (JSON) according to the nested schema
    parsed_df = spark_df.selectExpr("CAST(value AS STRING)").select(
        from_json(col("value"), schema).alias("data")
    )

    # Flatten the nested "location" field
    flattened_df = parsed_df.select(
        col("data.station_id"),
        col("data.timestamp"),
        col("data.location.city").alias("city"),
        col("data.location.country").alias("country"),
        col("data.location.latitude").alias("latitude"),
        col("data.location.longitude").alias("longitude"),
        col("data.temperature"),
        col("data.humidity"),
        col("data.pressure"),
        col("data.wind_speed"),
        col("data.wind_direction"),
        col("data.precipitation"),
        col("data.weather_condition"),
    )

    return flattened_df


def start_spark_stream():
    # Create Cassandra keyspace and table if direct client is available
    session = create_cassandra_connection()
    if session is not None:
        try:
            create_keyspace(session)
            create_table(session)
            session.shutdown()
        except Exception as e:
            logging.warning(f"Could not initialize Cassandra schema: {e}")

    # Create spark connection
    spark_conn = create_spark_connection()

    if spark_conn is not None:
        # Connect to Kafka with spark connection
        spark_df = connect_to_kafka(spark_conn)
        if spark_df is not None:
            selection_df = create_selection_df_from_kafka(spark_df)

            print("Streaming is being started...")

            try:
                streaming_query = (
                    selection_df.writeStream.format("org.apache.spark.sql.cassandra")
                    .option("checkpointLocation", "/tmp/checkpoint")
                    .option("keyspace", CASSANDRA_KEYSPACE)
                    .option("table", CASSANDRA_TABLE)
                    .start()
                )
                logging.info("Streaming query started successfully!")
                streaming_query.awaitTermination()
            except Exception as e:
                logging.error(f"Streaming query failed due to: {e}")


if __name__ == "__main__":
    start_spark_stream()
