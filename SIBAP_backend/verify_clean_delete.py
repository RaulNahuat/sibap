
import sys
import os
from fastapi import Request, Response
from unittest.mock import MagicMock

# Add the project root to the python path
sys.path.append(os.getcwd())

from app.api.routers.user import delete_account
from app.schemas.user import UserDeleteRequest
from app.core.config import settings, COOKIE_NAME
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.usuario import Usuario
from app.models.documento import Documento
from app.core.security import hash_password

# Setup DB
DATABASE_URL = settings.DATABASE_URL
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

def verify_delete_cookie():
    email = "clean_delete@example.com"
    password = "Password123!"
    
    # Setup: Create user
    existing = db.query(Usuario).filter(Usuario.email == email).first()
    if existing:
        db.delete(existing)
        db.commit()
        
    user = Usuario(
        name="Clean",
        last_name="Delete",
        email=email,
        password_hash=hash_password(password),
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"User created: {user.id}")
    
    # Mock Data
    data = UserDeleteRequest(password=password)
    response = Response()
    
    print("Calling delete_account...")
    # Call endpoint directly
    deleted_user = delete_account(
        data=data, 
        response=response, 
        current_user=user, 
        db=db
    )
    
    print(f"User deleted: {deleted_user.id}")
    
    # Verify Cookie Deletion
    # When deleting a cookie, FastAPI/Starlette sets a cookie with max-age=0 or expires=past
    set_cookie = response.headers.get("set-cookie")
    print(f"Set-Cookie Header: {set_cookie}")
    
    if set_cookie and COOKIE_NAME in set_cookie and ('Max-Age=0' in set_cookie or 'Expires=' in set_cookie):
        print("SUCCESS: Cookie cleared in response.")
    else:
        print("FAILURE: Cookie NOT cleared properly.")

if __name__ == "__main__":
    try:
        verify_delete_cookie()
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()
