from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from models.user import User
from core.security import hash_password, verify_password, create_access_token


def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def create_user(db: Session, user_data):
    username = user_data.username.strip().lower()
    password = user_data.password

    # 🔥 validar longitud de password (bcrypt limit: 72 bytes, no solo caracteres)
    if len(password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=400,
            detail="La contraseña es demasiado larga (max 72 bytes)"
        )

    # 🔍 verificar usuario existente
    if get_user_by_username(db, username):
        raise HTTPException(status_code=400, detail="Usuario ya existe")

    # 🔐 crear usuario
    new_user = User(
        username=username,
        password=hash_password(password)
    )

    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Usuario ya existe")

    db.refresh(new_user)

    return new_user


def login_user(db: Session, user_data):
    username = user_data.username.strip().lower()

    user = get_user_by_username(db, username)

    if not user:
        raise HTTPException(status_code=401, detail="Usuario incorrecto")

    if not verify_password(user_data.password, user.password):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    token = create_access_token({"sub": str(user.id)})

    return {
        "access_token": token,
        "token_type": "bearer"
    }
