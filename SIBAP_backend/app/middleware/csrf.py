from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import ENVIRONMENT

class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            if request.url.path in [
                "/auth/login", 
                "/auth/register", 
                "/auth/logout",
                "/api/documents/from-drive"
            ]:
                return await call_next(request)

            csrf_header = request.headers.get("X-CSRF-Token")
            
            if not csrf_header:
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="CSRF protection: Missing X-CSRF-Token header"
                )
                
        response = await call_next(request)
        return response
