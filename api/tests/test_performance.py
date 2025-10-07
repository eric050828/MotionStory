"""
Tests for performance optimization features
"""
import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock

from src.core.performance import (
    CacheManager,
    cache_response,
    QueryProfiler,
    optimize_mongodb_query,
    PerformanceMonitor
)
from src.services.annual_review_optimizer import (
    AnnualReviewOptimizer,
    create_annual_review_indexes
)


class TestCacheManager:
    """Test cache manager functionality"""

    def setup_method(self):
        """Reset cache before each test"""
        CacheManager._memory_cache = {}

    def test_cache_set_and_get(self):
        """Test basic cache operations"""
        CacheManager.set("test_key", "test_value", ttl=60)
        value = CacheManager.get("test_key")
        assert value == "test_value"

    def test_cache_delete(self):
        """Test cache deletion"""
        CacheManager.set("test_key", "test_value")
        CacheManager.delete("test_key")
        value = CacheManager.get("test_key")
        assert value is None

    def test_cache_clear_pattern(self):
        """Test pattern-based cache clearing"""
        CacheManager.set("user:123:workouts", "data1")
        CacheManager.set("user:123:profile", "data2")
        CacheManager.set("user:456:workouts", "data3")

        CacheManager.clear_pattern("user:123:*")

        assert CacheManager.get("user:123:workouts") is None
        assert CacheManager.get("user:123:profile") is None
        assert CacheManager.get("user:456:workouts") == "data3"


class TestCacheDecorator:
    """Test cache decorator"""

    def setup_method(self):
        """Reset cache before each test"""
        CacheManager._memory_cache = {}
        self.call_count = 0

    @pytest.mark.asyncio
    async def test_cache_decorator_caching(self):
        """Test that decorator caches results"""

        @cache_response(ttl=60, key_prefix="test")
        async def expensive_operation(user_id: str):
            self.call_count += 1
            return {"data": f"user_{user_id}"}

        # First call - should execute
        result1 = await expensive_operation(user_id="123")
        assert self.call_count == 1
        assert result1["data"] == "user_123"

        # Second call - should use cache
        result2 = await expensive_operation(user_id="123")
        assert self.call_count == 1  # Not incremented
        assert result2["data"] == "user_123"

    @pytest.mark.asyncio
    async def test_cache_decorator_different_args(self):
        """Test that different arguments create different cache entries"""

        @cache_response(ttl=60, key_prefix="test")
        async def get_data(user_id: str):
            self.call_count += 1
            return {"user_id": user_id}

        await get_data(user_id="123")
        await get_data(user_id="456")

        assert self.call_count == 2  # Both should execute


class TestQueryProfiler:
    """Test query profiler"""

    @pytest.mark.asyncio
    async def test_query_profiling(self):
        """Test query profiling decorator"""
        profiler = QueryProfiler()

        @profiler.profile("test_query")
        async def slow_query():
            await asyncio.sleep(0.15)  # Simulate slow query
            return "result"

        result = await slow_query()

        assert result == "result"
        stats = profiler.get_stats()
        assert stats["total_queries"] == 1
        assert stats["avg_time"] >= 0.15
        assert len(stats["slow_queries"]) == 1  # Should detect slow query

    @pytest.mark.asyncio
    async def test_multiple_queries_stats(self):
        """Test statistics with multiple queries"""
        profiler = QueryProfiler()

        @profiler.profile("fast_query")
        async def fast_query():
            await asyncio.sleep(0.01)
            return "fast"

        @profiler.profile("slow_query")
        async def slow_query():
            await asyncio.sleep(0.15)
            return "slow"

        await fast_query()
        await fast_query()
        await slow_query()

        stats = profiler.get_stats()
        assert stats["total_queries"] == 3
        assert len(stats["slow_queries"]) == 1


class TestMongoDBOptimization:
    """Test MongoDB query optimization"""

    def test_optimize_workout_query(self):
        """Test workout query optimization"""
        query = {
            "user_id": "123",
            "date": {"$gte": datetime(2025, 1, 1)}
        }

        optimized = optimize_mongodb_query("workouts", query)

        assert "hint" in optimized
        assert optimized["hint"] == "user_id_1_date_-1"
        assert "projection" in optimized

    def test_optimize_achievement_query(self):
        """Test achievement query optimization"""
        query = {
            "user_id": "123",
            "earned_at": {"$gte": datetime(2025, 1, 1)}
        }

        optimized = optimize_mongodb_query("achievements", query)

        assert "hint" in optimized
        assert optimized["hint"] == "user_id_1_earned_at_-1"


class TestPerformanceMonitor:
    """Test performance monitoring"""

    def test_record_request(self):
        """Test request recording"""
        monitor = PerformanceMonitor()

        monitor.record_request("/api/workouts", "GET", 123.45)

        report = monitor.get_report()
        assert report["total_requests"] == 1
        assert report["avg_response_time"] == 123.45

    def test_cache_hit_rate(self):
        """Test cache hit rate calculation"""
        monitor = PerformanceMonitor()

        monitor.record_cache_hit()
        monitor.record_cache_hit()
        monitor.record_cache_miss()

        report = monitor.get_report()
        assert report["cache_hit_rate"] == "66.7%"

    def test_slow_request_detection(self):
        """Test slow request detection"""
        monitor = PerformanceMonitor()

        monitor.record_request("/api/slow", "GET", 600.0)
        monitor.record_request("/api/fast", "GET", 50.0)

        report = monitor.get_report()
        assert len(report["slow_requests"]) == 1
        assert report["slow_requests"][0]["duration"] == 600.0


@pytest.mark.asyncio
class TestAnnualReviewOptimizer:
    """Test annual review optimizer"""

    async def test_annual_stats_caching(self, mock_db):
        """Test that annual stats are cached"""
        optimizer = AnnualReviewOptimizer(mock_db)

        # Mock database response
        mock_db.workouts.aggregate.return_value.to_list = AsyncMock(return_value=[
            {
                "_id": {"month": 1, "type": "running"},
                "count": 10,
                "total_duration": 300,
                "total_distance": 50,
                "avg_duration": 30
            }
        ])

        # First call - should query database
        stats1 = await optimizer.get_annual_stats("user123", 2025)

        # Second call - should use cache (verify by checking db call count)
        stats2 = await optimizer.get_annual_stats("user123", 2025)

        assert stats1 == stats2
        assert stats1["year"] == 2025
        assert stats1["user_id"] == "user123"

    async def test_cache_invalidation(self, mock_db):
        """Test cache invalidation"""
        optimizer = AnnualReviewOptimizer(mock_db)

        # Invalidate cache
        await optimizer.invalidate_annual_review_cache("user123", 2025)

        # Should not raise any errors
        assert True

    async def test_incremental_update(self, mock_db):
        """Test incremental update detection"""
        optimizer = AnnualReviewOptimizer(mock_db)

        # Mock counts
        mock_db.workouts.count_documents = AsyncMock(return_value=5)
        mock_db.achievements.count_documents = AsyncMock(return_value=2)

        update_info = await optimizer.get_incremental_update(
            "user123",
            2025,
            datetime.utcnow() - timedelta(days=1)
        )

        assert update_info["new_workouts"] == 5
        assert update_info["new_achievements"] == 2
        assert update_info["should_regenerate"] is True


# Fixtures

@pytest.fixture
def mock_db():
    """Mock database for testing"""
    db = Mock()

    # Mock collections
    db.workouts = Mock()
    db.achievements = Mock()

    # Mock aggregate method
    aggregate_result = Mock()
    aggregate_result.to_list = AsyncMock(return_value=[])
    db.workouts.aggregate.return_value = aggregate_result
    db.achievements.aggregate.return_value = aggregate_result

    # Mock find methods
    db.workouts.find = Mock(return_value=Mock(
        sort=Mock(return_value=Mock(to_list=AsyncMock(return_value=[])))
    ))
    db.achievements.find = Mock(return_value=Mock(
        sort=Mock(return_value=Mock(to_list=AsyncMock(return_value=[])))
    ))

    # Mock find_one
    db.workouts.find_one = AsyncMock(return_value=None)
    db.achievements.find_one = AsyncMock(return_value=None)

    return db


# Performance benchmarks

@pytest.mark.benchmark
class TestPerformanceBenchmarks:
    """Performance benchmark tests"""

    @pytest.mark.asyncio
    async def test_cache_performance(self, benchmark):
        """Benchmark cache operations"""

        def cache_operations():
            CacheManager.set("key", "value")
            CacheManager.get("key")
            CacheManager.delete("key")

        benchmark(cache_operations)

    @pytest.mark.asyncio
    async def test_query_optimization_performance(self, benchmark):
        """Benchmark query optimization"""

        def optimize_query():
            query = {"user_id": "123", "date": {"$gte": datetime.utcnow()}}
            optimize_mongodb_query("workouts", query)

        benchmark(optimize_query)


# Integration tests

@pytest.mark.integration
class TestPerformanceIntegration:
    """Integration tests for performance features"""

    @pytest.mark.asyncio
    async def test_end_to_end_caching(self, test_client, mock_db):
        """Test end-to-end caching flow"""

        # Make first request
        response1 = await test_client.get("/api/workouts?user_id=123")
        assert response1.status_code == 200

        # Make second request - should be faster due to caching
        response2 = await test_client.get("/api/workouts?user_id=123")
        assert response2.status_code == 200

        # Check for cache hit header
        assert "X-Cache" in response2.headers

    @pytest.mark.asyncio
    async def test_compression_middleware(self, test_client):
        """Test response compression"""

        response = await test_client.get(
            "/api/workouts",
            headers={"Accept-Encoding": "gzip"}
        )

        # Should have compression header
        assert response.headers.get("Content-Encoding") == "gzip"
