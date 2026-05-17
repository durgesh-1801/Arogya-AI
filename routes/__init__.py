"""API route modules."""

from routes.patients import router as patients_router
from routes.trends import router as trends_router
from routes.upload import router as upload_router

__all__ = ["upload_router", "patients_router", "trends_router"]
