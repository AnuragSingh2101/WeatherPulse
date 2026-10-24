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
KAFKA_TOPIC = os.getenv("KAFKA_TOPIC", "weather-events")
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
    from pyspark.sql.functions import coalesce, lit

    # Unified schema supporting normalized weather-events and legacy fields
    schema = StructType(
        [
            StructField("event_id", StringType(), True),
            StructField("station_id", StringType(), True),
            StructField("forecast_time", StringType(), True),
            StructField("timestamp", StringType(), True),
            StructField(
                "location",
                StructType(
                    [
                        StructField("name", StringType(), True),
                        StructField("city", StringType(), True),
                        StructField("country", StringType(), True),
                        StructField("latitude", FloatType(), True),
                        StructField("longitude", FloatType(), True),
                    ]
                ),
            ),
            StructField(
                "weather",
                StructType(
                    [
                        StructField("temperature_c", FloatType(), True),
                        StructField("relative_humidity_percent", IntegerType(), True),
                        StructField("air_pressure_hpa", FloatType(), True),
                        StructField("wind_speed_mps", FloatType(), True),
                        StructField("wind_direction_degrees", FloatType(), True),
                        StructField("precipitation_mm", FloatType(), True),
                        StructField("symbol_code", StringType(), True),
                        StructField("condition", StringType(), True),
                    ]
                ),
            ),
            # Legacy direct fields
            StructField("temperature", FloatType(), True),
            StructField("humidity", IntegerType(), True),
            StructField("pressure", FloatType(), True),
            StructField("wind_speed", FloatType(), True),
            StructField("wind_direction", StringType(), True),
            StructField("precipitation", FloatType(), True),
            StructField("weather_condition", StringType(), True),
        ]
    )

    parsed_df = spark_df.selectExpr("CAST(value AS STRING)").select(
        from_json(col("value"), schema).alias("data")
    )

    flattened_df = parsed_df.select(
        coalesce(col("data.event_id"), col("data.station_id"), lit("METNO-STATION")).alias("station_id"),
        coalesce(col("data.forecast_time"), col("data.timestamp")).alias("timestamp"),
        coalesce(col("data.location.name"), col("data.location.city"), lit("Unknown")).alias("city"),
        coalesce(col("data.location.country"), lit("Global")).alias("country"),
        col("data.location.latitude").alias("latitude"),
        col("data.location.longitude").alias("longitude"),
        coalesce(col("data.weather.temperature_c"), col("data.temperature")).alias("temperature"),
        coalesce(col("data.weather.relative_humidity_percent"), col("data.humidity")).alias("humidity"),
        coalesce(col("data.weather.air_pressure_hpa"), col("data.pressure")).alias("pressure"),
        coalesce(col("data.weather.wind_speed_mps"), col("data.wind_speed")).alias("wind_speed"),
        coalesce(col("data.weather.condition"), col("data.wind_direction"), lit("N/A")).alias("wind_direction"),
        coalesce(col("data.weather.precipitation_mm"), col("data.precipitation")).alias("precipitation"),
        coalesce(col("data.weather.condition"), col("data.weather_condition"), lit("Fair")).alias("weather_condition"),
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
