"""
Centralized error handling for FastAPI
Custom exceptions and error response formatting
"""
from typing import Optional, Dict, Any
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
import logging
import traceback
from datetime import datetime

logger = logging.getLogger(__name__)

# Optional: Sentry integration
try:
    import sentry_sdk
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False


class AppException(Exception):
    """Base exception for application errors"""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)


# Authentication and Authorization Errors
class AuthenticationError(AppException):
    """Authentication failed"""

    def __init__(self, message: str = "Authentication failed", details: Optional[Dict] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="AUTH_ERROR",
            details=details
        )


class InvalidTokenError(AuthenticationError):
    """Invalid or expired token"""

    def __init__(self, message: str = "Invalid or expired token"):
        super().__init__(
            message=message,
            details={"hint": "Please login again"}
        )


class UnauthorizedError(AppException):
    """User not authorized for this action"""

    def __init__(self, message: str = "Unauthorized", details: Optional[Dict] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="UNAUTHORIZED",
            details=details
        )


# Resource Errors
class ResourceNotFoundError(AppException):
    """Resource not found"""

    def __init__(
        self,
        resource_type: str,
        resource_id: str,
        message: Optional[str] = None
    ):
        super().__init__(
            message=message or f"{resource_type} not found",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="RESOURCE_NOT_FOUND",
            details={
                "resource_type": resource_type,
                "resource_id": resource_id
            }
        )


class ResourceAlreadyExistsError(AppException):
    """Resource already exists"""

    def __init__(
        self,
        resource_type: str,
        details: Optional[Dict] = None
    ):
        super().__init__(
            message=f"{resource_type} already exists",
            status_code=status.HTTP_409_CONFLICT,
            error_code="RESOURCE_EXISTS",
            details=details
        )


# Validation Errors
class ValidationError(AppException):
    """Validation error"""

    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        details: Optional[Dict] = None
    ):
        error_details = details or {}
        if field:
            error_details["field"] = field

        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            details=error_details
        )


class InvalidInputError(ValidationError):
    """Invalid input data"""

    def __init__(self, field: str, message: str):
        super().__init__(
            message=f"Invalid {field}: {message}",
            field=field
        )


# Business Logic Errors
class BusinessLogicError(AppException):
    """Business logic error"""

    def __init__(
        self,
        message: str,
        error_code: str = "BUSINESS_LOGIC_ERROR",
        details: Optional[Dict] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code=error_code,
            details=details
        )


class WorkoutValidationError(BusinessLogicError):
    """Workout validation error"""

    def __init__(self, message: str, details: Optional[Dict] = None):
        super().__init__(
            message=message,
            error_code="WORKOUT_VALIDATION_ERROR",
            details=details
        )


class SyncConflictError(BusinessLogicError):
    """Offline sync conflict"""

    def __init__(
        self,
        message: str = "Sync conflict detected",
        details: Optional[Dict] = None
    ):
        super().__init__(
            message=message,
            error_code="SYNC_CONFLICT",
            details=details
        )


# Database Errors
class DatabaseError(AppException):
    """Database error"""

    def __init__(
        self,
        message: str = "Database error occurred",
        details: Optional[Dict] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="DATABASE_ERROR",
            details=details
        )


# External Service Errors
class ExternalServiceError(AppException):
    """External service error"""

    def __init__(
        self,
        service_name: str,
        message: Optional[str] = None,
        details: Optional[Dict] = None
    ):
        super().__init__(
            message=message or f"{service_name} service error",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="EXTERNAL_SERVICE_ERROR",
            details={
                "service": service_name,
                **(details or {})
            }
        )


# Rate Limiting
class RateLimitError(AppException):
    """Rate limit exceeded"""

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        retry_after: Optional[int] = None
    ):
        details = {}
        if retry_after:
            details["retry_after_seconds"] = retry_after

        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code="RATE_LIMIT_EXCEEDED",
            details=details
        )


def format_error_response(
    error_code: str,
    message: str,
    status_code: int,
    details: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Format error response consistently

    Args:
        error_code: Error code identifier
        message: Human-readable error message
        status_code: HTTP status code
        details: Additional error details
        request_id: Request ID for tracking

    Returns:
        Formatted error response dictionary
    """
    response = {
        "error": {
            "code": error_code,
            "message": message,
            "status": status_code,
            "timestamp": datetime.utcnow().isoformat()
        }
    }

    if details:
        response["error"]["details"] = details

    if request_id:
        response["error"]["request_id"] = request_id

    return response


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """
    Handler for custom AppException

    Args:
        request: FastAPI request
        exc: AppException instance

    Returns:
        JSONResponse with formatted error
    """
    # Log error
    logger.error(
        f"AppException: {exc.error_code} - {exc.message}",
        extra={
            "error_code": exc.error_code,
            "status_code": exc.status_code,
            "details": exc.details,
            "path": request.url.path,
            "method": request.method
        }
    )

    # Report to Sentry if available
    if SENTRY_AVAILABLE and exc.status_code >= 500:
        sentry_sdk.capture_exception(exc)

    # Format response
    response = format_error_response(
        error_code=exc.error_code,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details,
        request_id=request.headers.get("X-Request-ID")
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=response
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Handler for FastAPI HTTPException

    Args:
        request: FastAPI request
        exc: HTTPException instance

    Returns:
        JSONResponse with formatted error
    """
    logger.warning(
        f"HTTPException: {exc.status_code} - {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "path": request.url.path,
            "method": request.method
        }
    )

    response = format_error_response(
        error_code="HTTP_ERROR",
        message=str(exc.detail),
        status_code=exc.status_code,
        request_id=request.headers.get("X-Request-ID")
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=response
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    """
    Handler for Pydantic validation errors

    Args:
        request: FastAPI request
        exc: RequestValidationError instance

    Returns:
        JSONResponse with formatted validation errors
    """
    logger.warning(
        f"Validation error: {exc.errors()}",
        extra={
            "path": request.url.path,
            "method": request.method
        }
    )

    # Format validation errors
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })

    response = format_error_response(
        error_code="VALIDATION_ERROR",
        message="Request validation failed",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        details={"errors": errors},
        request_id=request.headers.get("X-Request-ID")
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=response
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handler for unhandled exceptions

    Args:
        request: FastAPI request
        exc: Exception instance

    Returns:
        JSONResponse with generic error
    """
    # Log full traceback
    logger.error(
        f"Unhandled exception: {str(exc)}",
        exc_info=True,
        extra={
            "path": request.url.path,
            "method": request.method,
            "traceback": traceback.format_exc()
        }
    )

    # Report to Sentry if available
    if SENTRY_AVAILABLE:
        sentry_sdk.capture_exception(exc)

    # Don't expose internal error details in production
    response = format_error_response(
        error_code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        request_id=request.headers.get("X-Request-ID")
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=response
    )


def register_exception_handlers(app):
    """
    Register all exception handlers with FastAPI app

    Args:
        app: FastAPI application instance
    """
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    logger.info("Registered exception handlers")


# Context manager for error handling
class ErrorContext:
    """Context manager for consistent error handling"""

    def __init__(self, operation: str, reraise: bool = True):
        self.operation = operation
        self.reraise = reraise

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_val:
            logger.error(
                f"Error in {self.operation}: {str(exc_val)}",
                exc_info=True
            )

            if SENTRY_AVAILABLE:
                sentry_sdk.capture_exception(exc_val)

            if self.reraise:
                return False

            # Suppress exception
            return True

        return False


# Decorator for error handling
def handle_errors(operation: str):
    """
    Decorator for consistent error handling

    Args:
        operation: Operation name for logging
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except AppException:
                # Re-raise app exceptions
                raise
            except Exception as e:
                # Wrap unexpected exceptions
                logger.error(
                    f"Error in {operation}: {str(e)}",
                    exc_info=True
                )
                raise DatabaseError(
                    message=f"Error in {operation}",
                    details={"error": str(e)}
                )

        return wrapper
    return decorator
