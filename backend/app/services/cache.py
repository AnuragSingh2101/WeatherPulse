import json
import time
import logging
from typing import Any, Optional, Dict
from functools import wraps
import redis.asyncio as redis
from app.config import settings

logger = logging.getLogger(__name__)

class CacheService:
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.local_cache: Dict[str, tuple[Any, float]] = {}  # key -> (value, expiry)
        self.use_redis = False

    async def connect(self):
        """Try to connect to Redis, fall back to local cache"""
        try:
            self.redis_client = redis.from_url(settings.redis_url, decode_responses=True)
            await self.redis_client.ping()
            self.use_redis = True
            logger.info("Connected to Redis cache")
        except Exception as e:
            logger.warning(f"Redis not available, using local cache: {e}")
            self.use_redis = False
            self.redis_client = None

    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()

    def _is_expired(self, expiry: float) -> bool:
        return time.time() > expiry

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if self.use_redis and self.redis_client:
            try:
                value = await self.redis_client.get(key)
                if value:
                    return json.loads(value)
            except Exception as e:
                logger.warning(f"Redis get error: {e}")
        
        # Fallback to local cache
        if key in self.local_cache:
            value, expiry = self.local_cache[key]
            if not self._is_expired(expiry):
                return value
            else:
                del self.local_cache[key]
        return None

    async def set(self, key: str, value: Any, ttl: int) -> bool:
        """Set value in cache with TTL"""
        expiry = time.time() + ttl
        
        if self.use_redis and self.redis_client:
            try:
                await self.redis_client.setex(key, ttl, json.dumps(value, default=str))
                return True
            except Exception as e:
                logger.warning(f"Redis set error: {e}")
        
        # Fallback to local cache
        self.local_cache[key] = (value, expiry)
        return True

    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if self.use_redis and self.redis_client:
            try:
                await self.redis_client.delete(key)
            except Exception as e:
                logger.warning(f"Redis delete error: {e}")
        
        if key in self.local_cache:
            del self.local_cache[key]
        return True

    async def clear_pattern(self, pattern: str) -> int:
        """Clear keys matching pattern (Redis only)"""
        if self.use_redis and self.redis_client:
            try:
                keys = []
                async for key in self.redis_client.scan_iter(match=pattern):
                    keys.append(key)
                if keys:
                    return await self.redis_client.delete(*keys)
            except Exception as e:
                logger.warning(f"Redis clear pattern error: {e}")
        return 0

    def cached(self, ttl: int, key_prefix: str = ""):
        """Decorator for caching function results"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Create cache key from function name and arguments
                cache_key = f"{key_prefix}:{func.__name__}:{hash(str(args) + str(sorted(kwargs.items())))}"
                
                # Try to get from cache
                cached = await self.get(cache_key)
                if cached is not None:
                    logger.debug(f"Cache hit: {cache_key}")
                    return cached
                
                # Call function
                result = await func(*args, **kwargs)
                
                # Store in cache
                await self.set(cache_key, result, ttl)
                logger.debug(f"Cache set: {cache_key}")
                return result
            return wrapper
        return decorator

# Singleton
_cache_service: Optional[CacheService] = None

async def get_cache_service() -> CacheService:
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
        await _cache_service.connect()
    return _cache_service

async def close_cache_service():
    global _cache_service
    if _cache_service:
        await _cache_service.close()
        _cache_service = None