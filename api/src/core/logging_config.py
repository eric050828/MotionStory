"""
Logging configuration for MotionStory API
Structured logging with JSON format, log rotation, and performance monitoring
"""
import logging
import logging.handlers
import json
import sys
from typing import Any, Dict
from datetime import datetime
from pathlib import Path
import traceback

# Create logs directory
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)


class JSONFormatter(logging.Formatter):
    """
    Custom JSON formatter for structured logging
    """

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }

        # Add extra fields if present
        if hasattr(record, "extra_fields"):
            log_data.update(record.extra_fields)

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "traceback": traceback.format_exception(*record.exc_info)
            }

        # Add request context if available
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id

        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id

        if hasattr(record, "path"):
            log_data["path"] = record.path

        if hasattr(record, "method"):
            log_data["method"] = record.method

        # Add performance metrics if available
        if hasattr(record, "duration"):
            log_data["duration_ms"] = record.duration

        return json.dumps(log_data)


class ContextFilter(logging.Filter):
    """
    Add contextual information to log records
    """

    def __init__(self, request_id: str = None, user_id: str = None):
        super().__init__()
        self.request_id = request_id
        self.user_id = user_id

    def filter(self, record: logging.LogRecord) -> bool:
        if self.request_id:
            record.request_id = self.request_id
        if self.user_id:
            record.user_id = self.user_id
        return True


class PerformanceLogger:
    """
    Logger for performance metrics
    """

    def __init__(self, logger: logging.Logger):
        self.logger = logger

    def log_request(
        self,
        method: str,
        path: str,
        duration_ms: float,
        status_code: int,
        user_id: str = None
    ):
        """Log API request performance"""
        extra = {
            "extra_fields": {
                "type": "api_request",
                "method": method,
                "path": path,
                "duration_ms": duration_ms,
                "status_code": status_code
            }
        }

        if user_id:
            extra["extra_fields"]["user_id"] = user_id

        # Warn on slow requests (>500ms)
        if duration_ms > 500:
            self.logger.warning(
                f"Slow request: {method} {path} took {duration_ms:.2f}ms",
                extra=extra
            )
        else:
            self.logger.info(
                f"Request: {method} {path} ({duration_ms:.2f}ms)",
                extra=extra
            )

    def log_query(
        self,
        query_type: str,
        collection: str,
        duration_ms: float,
        result_count: int = None
    ):
        """Log database query performance"""
        extra = {
            "extra_fields": {
                "type": "database_query",
                "query_type": query_type,
                "collection": collection,
                "duration_ms": duration_ms
            }
        }

        if result_count is not None:
            extra["extra_fields"]["result_count"] = result_count

        # Warn on slow queries (>100ms)
        if duration_ms > 100:
            self.logger.warning(
                f"Slow query: {query_type} on {collection} took {duration_ms:.2f}ms",
                extra=extra
            )
        else:
            self.logger.debug(
                f"Query: {query_type} on {collection} ({duration_ms:.2f}ms)",
                extra=extra
            )

    def log_cache_operation(
        self,
        operation: str,
        key: str,
        hit: bool = None,
        duration_ms: float = None
    ):
        """Log cache operations"""
        extra = {
            "extra_fields": {
                "type": "cache_operation",
                "operation": operation,
                "key": key
            }
        }

        if hit is not None:
            extra["extra_fields"]["cache_hit"] = hit

        if duration_ms is not None:
            extra["extra_fields"]["duration_ms"] = duration_ms

        self.logger.debug(
            f"Cache {operation}: {key}",
            extra=extra
        )


def setup_logging(
    level: str = "INFO",
    log_file: str = "motionstory.log",
    json_format: bool = True,
    max_bytes: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5
) -> logging.Logger:
    """
    Setup logging configuration

    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Log file name
        json_format: Use JSON formatting
        max_bytes: Max size of log file before rotation
        backup_count: Number of backup files to keep

    Returns:
        Configured logger instance
    """
    # Create root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper()))

    # Clear existing handlers
    root_logger.handlers = []

    # Choose formatter
    if json_format:
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

    # Console handler (always human-readable)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(
        logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    )
    root_logger.addHandler(console_handler)

    # File handler with rotation
    file_handler = logging.handlers.RotatingFileHandler(
        LOGS_DIR / log_file,
        maxBytes=max_bytes,
        backupCount=backup_count
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)

    # Error file handler (errors only)
    error_handler = logging.handlers.RotatingFileHandler(
        LOGS_DIR / "errors.log",
        maxBytes=max_bytes,
        backupCount=backup_count
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    root_logger.addHandler(error_handler)

    # Performance log handler
    performance_handler = logging.handlers.RotatingFileHandler(
        LOGS_DIR / "performance.log",
        maxBytes=max_bytes,
        backupCount=backup_count
    )
    performance_handler.setLevel(logging.INFO)
    performance_handler.setFormatter(formatter)

    # Create performance logger
    perf_logger = logging.getLogger("performance")
    perf_logger.addHandler(performance_handler)
    perf_logger.setLevel(logging.INFO)

    root_logger.info(f"Logging configured: level={level}, format={'JSON' if json_format else 'TEXT'}")

    return root_logger


def get_logger(name: str) -> logging.Logger:
    """
    Get logger for specific module

    Args:
        name: Logger name (usually __name__)

    Returns:
        Logger instance
    """
    return logging.getLogger(name)


def get_performance_logger() -> PerformanceLogger:
    """
    Get performance logger instance

    Returns:
        PerformanceLogger instance
    """
    logger = logging.getLogger("performance")
    return PerformanceLogger(logger)


class RequestContextLogger:
    """
    Logger with request context
    """

    def __init__(self, logger: logging.Logger, request_id: str, user_id: str = None):
        self.logger = logger
        self.request_id = request_id
        self.user_id = user_id

    def _log(self, level: str, message: str, **kwargs):
        """Log with context"""
        extra = kwargs.get("extra", {})
        extra["request_id"] = self.request_id
        if self.user_id:
            extra["user_id"] = self.user_id

        kwargs["extra"] = extra
        getattr(self.logger, level)(message, **kwargs)

    def debug(self, message: str, **kwargs):
        self._log("debug", message, **kwargs)

    def info(self, message: str, **kwargs):
        self._log("info", message, **kwargs)

    def warning(self, message: str, **kwargs):
        self._log("warning", message, **kwargs)

    def error(self, message: str, **kwargs):
        self._log("error", message, **kwargs)

    def critical(self, message: str, **kwargs):
        self._log("critical", message, **kwargs)


# Middleware for request logging
async def logging_middleware(request, call_next):
    """
    Middleware to log all requests with performance metrics
    """
    import time
    import uuid

    # Generate request ID
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    request.state.request_id = request_id

    # Start timer
    start_time = time.time()

    # Get logger
    logger = get_logger(__name__)

    # Log request start
    logger.info(
        f"Request started: {request.method} {request.url.path}",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "client": request.client.host if request.client else None
        }
    )

    # Process request
    try:
        response = await call_next(request)

        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000

        # Log request completion
        perf_logger = get_performance_logger()
        perf_logger.log_request(
            method=request.method,
            path=request.url.path,
            duration_ms=duration_ms,
            status_code=response.status_code,
            user_id=getattr(request.state, "user_id", None)
        )

        # Add headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{duration_ms:.2f}ms"

        return response

    except Exception as e:
        # Log error
        logger.error(
            f"Request failed: {request.method} {request.url.path}",
            exc_info=True,
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "error": str(e)
            }
        )
        raise


# Log analysis utilities
def analyze_logs(log_file: str = "performance.log", days: int = 1):
    """
    Analyze performance logs

    Args:
        log_file: Log file to analyze
        days: Number of days to analyze

    Returns:
        Performance statistics
    """
    import json
    from datetime import timedelta

    log_path = LOGS_DIR / log_file
    if not log_path.exists():
        return {"error": "Log file not found"}

    cutoff_time = datetime.utcnow() - timedelta(days=days)

    requests = []
    queries = []

    with open(log_path, 'r') as f:
        for line in f:
            try:
                log_entry = json.loads(line)

                # Check timestamp
                timestamp = datetime.fromisoformat(log_entry["timestamp"])
                if timestamp < cutoff_time:
                    continue

                if "extra_fields" in log_entry:
                    fields = log_entry["extra_fields"]

                    if fields.get("type") == "api_request":
                        requests.append(fields)
                    elif fields.get("type") == "database_query":
                        queries.append(fields)

            except Exception:
                continue

    # Calculate statistics
    stats = {
        "period_days": days,
        "total_requests": len(requests),
        "total_queries": len(queries)
    }

    if requests:
        durations = [r["duration_ms"] for r in requests]
        stats["requests"] = {
            "avg_duration_ms": sum(durations) / len(durations),
            "max_duration_ms": max(durations),
            "min_duration_ms": min(durations),
            "slow_requests": len([d for d in durations if d > 500])
        }

    if queries:
        durations = [q["duration_ms"] for q in queries]
        stats["queries"] = {
            "avg_duration_ms": sum(durations) / len(durations),
            "max_duration_ms": max(durations),
            "min_duration_ms": min(durations),
            "slow_queries": len([d for d in durations if d > 100])
        }

    return stats
