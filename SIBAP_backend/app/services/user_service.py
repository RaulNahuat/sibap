from sqlalchemy.orm import Session
from app.models.usuario import Usuario
from app.core.security import verify_password, hash_password
from app.repositories.user_repository import UserRepository

def get_active_user(db: Session, user_id: int) -> Usuario | None:
    repo = UserRepository(db)
    return repo.get_active_by_id(user_id)


def get_user_profile(db: Session, user_id: int) -> Usuario | None:
    return get_active_user(db, user_id)


def update_user_profile(db: Session, user_id: int, name: str, last_name: str) -> Usuario | None:
    repo = UserRepository(db)
    user = get_active_user(db, user_id)
    if not user:
        return None

    if name is not None:
        user.name = name
    if last_name is not None:
        user.last_name = last_name

    return repo.update(user)


def update_user_password(db: Session, user_id: int, current_password: str, new_password: str) -> Usuario | None:
    repo = UserRepository(db)
    user = get_active_user(db, user_id)
    if not user:
        return None

    if not verify_password(current_password, user.password_hash):
        return None

    user.password_hash = hash_password(new_password)
    return repo.update(user)


def request_account_deletion(db: Session, user_id: int, password: str) -> Usuario | None:
    repo = UserRepository(db)
    user = get_active_user(db, user_id)
    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    repo.delete(user)
    return user
