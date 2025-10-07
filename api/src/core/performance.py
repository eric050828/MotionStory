"""
Performance optimization utilities for API
Includes caching, compression, and query profiling
"""
from functools import wraps
from typing import Optional, Callable, Any
import time
import hashlib
import json
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import gzip
import logging

logger = logging.getLogger(__name__)

# Redis cache (optional - can be replaced with in-memory cache)
try:
    import redis
    redis_client = redis.Redis(
        host='localhost',
        port=6379,
        db=0,
        decode_responses=True
    )
    REDIS_AVAILABLE = True
except:
    REDIS_AVAILABLE = False
    logger.warning("Redis not available, using in-memory cache")

# In-memory cache fallback
_memory_cache = {}


class CacheManager:
    """Unified cache manager with Redis or in-memory fallback"""

    @staticmethod
    def get(key: str) -> Optional[str]:
        """Get cached value"""
        if REDIS_AVAILABLE:
            try:
                return redis_client.get(key)
            except Exception as e:
                logger.error(f"Redis get error: {e}")
                return _memory_cache.get(key)
        return _memory_cache.get(key)

    @staticmethod
    def set(key: str, value: str, ttl: int = 300):
        """Set cached value with TTL (seconds)"""
        if REDIS_AVAILABLE:
            try:
                redis_client.setex(key, ttl, value)
            except Exception as e:
                logger.error(f"Redis set error: {e}")
                _memory_cache[key] = value
        else:
            _memory_cache[key] = value

    @staticmethod
    def delete(key: str):
        """Delete cached value"""
        if REDIS_AVAILABLE:
            try:
                redis_client.delete(key)
            except Exception as e:
                logger.error(f"Redis delete error: {e}")
                _memory_cache.pop(key, None)
        else:
            _memory_cache.pop(key, None)

    @staticmethod
    def clear_pattern(pattern: str):
        """Clear all keys matching pattern"""
        if REDIS_AVAILABLE:
            try:
                keys = redis_client.keys(pattern)
                if keys:
                    redis_client.delete(*keys)
            except Exception as e:
                logger.error(f"Redis clear pattern error: {e}")
        else:
            # Clear matching keys from memory cache
            keys_to_delete = [k for k in _memory_cache.keys() if pattern.replace('*', '') in k]
            for key in keys_to_delete:
                _memory_cache.pop(key, None)


def cache_response(ttl: int = 300, key_prefix: str = "api"):
    """
    Decorator for caching API responses

    Args:
        ttl: Time to live in seconds (default 5 minutes)
        key_prefix: Prefix for cache keys
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            key_parts = [key_prefix, func.__name__]

            # Add user_id if available in kwargs
            if 'user_id' in kwargs:
                key_parts.append(f"user:{kwargs['user_id']}")

            # Add other relevant kwargs
            for k, v in sorted(kwargs.items()):
                if k not in ['request', 'db', 'current_user']:
                    key_parts.append(f"{k}:{v}")

            cache_key = ":".join(key_parts)

            # Try to get from cache
            cached = CacheManager.get(cache_key)
            if cached:
                logger.debug(f"Cache hit: {cache_key}")
                return json.loads(cached)

            # Execute function
            result = await func(*args, **kwargs)

            # Cache result
            try:
                CacheManager.set(cache_key, json.dumps(result), ttl)
                logger.debug(f"Cached result: {cache_key}")
            except Exception as e:
                logger.error(f"Cache set error: {e}")

            return result

        return wrapper
    return decorator


def invalidate_cache(pattern: str):
    """
    Invalidate cache entries matching pattern

    Args:
        pattern: Pattern to match cache keys (e.g., "api:workouts:user:123:*")
    """
    CacheManager.clear_pattern(pattern)
    logger.info(f"Invalidated cache pattern: {pattern}")


class QueryProfiler:
    """Profile database queries for optimization"""

    def __init__(self):
        self.queries = []

    def profile(self, query_name: str):
        """Decorator for profiling queries"""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def wrapper(*args, **kwargs):
                start_time = time.time()
                result = await func(*args, **kwargs)
                execution_time = time.time() - start_time

                # Log slow queries (>100ms)
                if execution_time > 0.1:
                    logger.warning(
                        f"Slow query detected: {query_name} "
                        f"took {execution_time:.3f}s"
                    )

                self.queries.append({
                    'name': query_name,
                    'execution_time': execution_time,
                    'timestamp': time.time()
                })

                return result

            return wrapper
        return decorator

    def get_stats(self):
        """Get query profiling statistics"""
        if not self.queries:
            return {}

        total_time = sum(q['execution_time'] for q in self.queries)
        avg_time = total_time / len(self.queries)
        max_time = max(q['execution_time'] for q in self.queries)

        return {
            'total_queries': len(self.queries),
            'total_time': total_time,
            'avg_time': avg_time,
            'max_time': max_time,
            'slow_queries': [
                q for q in self.queries if q['execution_time'] > 0.1
            ]
        }


# Global profiler instance
query_profiler = QueryProfiler()


async def compression_middleware(request: Request, call_next):
    """
    Middleware for response compression
    Compresses responses > 1KB using gzip
    """
    response = await call_next(request)

    # Only compress if client accepts gzip
    accept_encoding = request.headers.get('accept-encoding', '')
    if 'gzip' not in accept_encoding.lower():
        return response

    # Only compress JSON responses
    content_type = response.headers.get('content-type', '')
    if 'application/json' not in content_type:
        return response

    # Get response body
    body = b''
    async for chunk in response.body_iterator:
        body += chunk

    # Only compress if body > 1KB
    if len(body) < 1024:
        return Response(
            content=body,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type
        )

    # Compress
    compressed = gzip.compress(body)

    # Update headers
    headers = dict(response.headers)
    headers['Content-Encoding'] = 'gzip'
    headers['Content-Length'] = str(len(compressed))

    logger.debug(
        f"Compressed response: {len(body)} -> {len(compressed)} bytes "
        f"({len(compressed) / len(body) * 100:.1f}%)"
    )

    return Response(
        content=compressed,
        status_code=response.status_code,
        headers=headers,
        media_type=response.media_type
    )


async def performance_middleware(request: Request, call_next):
    """
    Middleware for tracking API performance
    """
    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time
    response.headers['X-Process-Time'] = str(process_time)

    # Log slow requests (>500ms)
    if process_time > 0.5:
        logger.warning(
            f"Slow request: {request.method} {request.url.path} "
            f"took {process_time:.3f}s"
        )

    return response


def optimize_mongodb_query(collection: str, query: dict) -> dict:
    """
    Optimize MongoDB query with best practices

    Args:
        collection: Collection name
        query: Original query

    Returns:
        Optimized query
    """
    optimized = query.copy()

    # Add hints for common patterns
    if collection == 'workouts':
        # Use compound index for user_id + date queries
        if 'user_id' in optimized and 'date' in optimized:
            optimized['hint'] = 'user_id_1_date_-1'

    elif collection == 'achievements':
        # Use index for user_id + earned_at queries
        if 'user_id' in optimized and 'earned_at' in optimized:
            optimized['hint'] = 'user_id_1_earned_at_-1'

    # Limit fields to return (projection)
    if 'projection' not in optimized:
        # Default: exclude large fields
        optimized['projection'] = {'_id': 0}

    return optimized


class PerformanceMonitor:
    """Monitor and report performance metrics"""

    def __init__(self):
        self.metrics = {
            'requests': [],
            'cache_hits': 0,
            'cache_misses': 0,
            'slow_queries': [],
            'errors': []
        }

    def record_request(self, path: str, method: str, duration: float):
        """Record API request metrics"""
        self.metrics['requests'].append({
            'path': path,
            'method': method,
            'duration': duration,
            'timestamp': time.time()
        })

    def record_cache_hit(self):
        """Record cache hit"""
        self.metrics['cache_hits'] += 1

    def record_cache_miss(self):
        """Record cache miss"""
        self.metrics['cache_misses'] += 1

    def get_report(self) -> dict:
        """Get performance report"""
        if not self.metrics['requests']:
            return {'message': 'No metrics available'}

        durations = [r['duration'] for r in self.metrics['requests']]

        cache_total = self.metrics['cache_hits'] + self.metrics['cache_misses']
        cache_hit_rate = (
            self.metrics['cache_hits'] / cache_total * 100
            if cache_total > 0 else 0
        )

        return {
            'total_requests': len(self.metrics['requests']),
            'avg_response_time': sum(durations) / len(durations),
            'max_response_time': max(durations),
            'min_response_time': min(durations),
            'cache_hit_rate': f"{cache_hit_rate:.1f}%",
            'slow_requests': [
                r for r in self.metrics['requests'] if r['duration'] > 0.5
            ]
        }


# Global performance monitor
performance_monitor = PerformanceMonitor()
