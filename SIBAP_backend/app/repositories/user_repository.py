from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.usuario import Usuario

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[Usuario]:
        return self.db.query(Usuario).filter(Usuario.id == user_id).first()

    def get_active_by_id(self, user_id: int) -> Optional[Usuario]:
        return self.db.query(Usuario).filter(Usuario.id == user_id, Usuario.is_active == True).first()

    def get_by_email(self, email: str) -> Optional[Usuario]:
        return self.db.query(Usuario).filter(Usuario.email == email).first()

    def create(self, user: Usuario) -> Usuario:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: Usuario) -> Usuario:
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user: Usuario) -> None:
        self.db.delete(user)
        self.db.commit()
