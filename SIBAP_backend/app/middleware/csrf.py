from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import ENVIRONMENT

class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            # Exclude login and register from CSRF check as they are initial entry points
            # In a full implementation, we would send a CSRF token on the initial page load or via a separate endpoint
            # For this basic implementation as requested, we will check for a custom header presence
            # which prevents simple form-based CSRF attacks from browsers.
            
            # Allow public auth endpoints
            if request.url.path in [
                "/auth/login", 
                "/auth/register", 
                "/auth/logout"
            ]:
                return await call_next(request)

            # Check for strict header presence
            # Browsers do not allow setting custom headers in cross-origin requests 
            # without CORS preflight, providing a layer of protection.
            csrf_header = request.headers.get("X-CSRF-Token")
            
            # In a stricter implementation, we would validate this against a server-side secret/token
            # For now, ensuring the header exists and has a value acts as a "Double Submit Cookie" variant
            # if we also required it to match a cookie, but here we use the custom header requirement
            # as a primary defense for this iteration.
            if not csrf_header:
                 raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="CSRF protection: Missing X-CSRF-Token header"
                )
                
        response = await call_next(request)
        return response
