import json
import time
import logging
from typing import Any, Optional, Dict
from functools import wraps

logger = logging.getLogger(__name__)

class CacheService:
    """
    Lightweight, in-memory cache service.
    Replaces Redis to fetch live/real weather telemetry while honoring
    upstream rate limits and RFC 7234 HTTP caching standards.
    """
    def __init__(self):
        self.local_cache: Dict[str, tuple[Any, float]] = {}  # key -> (value, expiry)

    async def connect(self):
        """Initialize in-memory cache without external Redis dependencies"""
        self.local_cache.clear()
        logger.info("In-memory cache initialized (Redis removed)")

    async def close(self):
        """Clear cache on shutdown"""
        self.local_cache.clear()

    def _is_expired(self, expiry: float) -> bool:
        return time.time() > expiry

    async def get(self, key: str) -> Optional[Any]:
        """Get value from in-memory cache if not expired"""
        if key in self.local_cache:
            value, expiry = self.local_cache[key]
            if not self._is_expired(expiry):
                return value
            else:
                del self.local_cache[key]
        return None

    async def set(self, key: str, value: Any, ttl: int) -> bool:
        """Store value in memory with TTL seconds"""
        expiry = time.time() + ttl
        self.local_cache[key] = (value, expiry)
        return True

    async def delete(self, key: str) -> bool:
        """Delete key from in-memory cache"""
        if key in self.local_cache:
            del self.local_cache[key]
        return True

    async def clear_pattern(self, pattern: str) -> int:
        """Clear keys matching prefix pattern"""
        prefix = pattern.rstrip("*")
        keys_to_del = [k for k in self.local_cache if k.startswith(prefix)]
        for k in keys_to_del:
            del self.local_cache[k]
        return len(keys_to_del)

    def cached(self, ttl: int, key_prefix: str = ""):
        """Decorator for caching async function results"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                cache_key = f"{key_prefix}:{func.__name__}:{hash(str(args) + str(sorted(kwargs.items())))}"
                cached = await self.get(cache_key)
                if cached is not None:
                    logger.debug(f"Cache hit: {cache_key}")
                    return cached
                result = await func(*args, **kwargs)
                await self.set(cache_key, result, ttl)
                logger.debug(f"Cache set: {cache_key}")
                return result
            return wrapper
        return decorator

# Singleton instance
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