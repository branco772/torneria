from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from core.deps import get_db
from models.user import User
from core.security import create_access_token, get_current_user, hash_password, verify_password
from schemas.user_schema import DeleteAccount, PasswordChange, UserUpdate



router = APIRouter()


def is_admin_user(db: Session, user: User | None) -> bool:
    if user is None:
        return False

    first_user = db.query(User).order_by(User.id.asc()).first()
    return first_user is not None and user.id == first_user.id


@router.get("/users/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "is_admin": is_admin_user(db, current_user)
    }


@router.put("/users/me")
def update_me(data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    user = db.query(User).filter(User.id == current_user.id).first()
    new_username = data.username

    user_exists = (
        db.query(User)
        .filter(User.username == new_username, User.id != current_user.id)
        .first()
    )
    if user_exists:
        raise HTTPException(status_code=400, detail="Usuario ya existe")

    user.username = new_username

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Usuario ya existe")

    db.refresh(user)

    response = {
        "message": "Perfil actualizado",
        "user": {
            "id": user.id,
            "username": user.username,
            "is_admin": is_admin_user(db, user)
        }
    }

    response["access_token"] = create_access_token({"sub": str(user.id)})
    response["token_type"] = "bearer"

    return response



@router.put("/users/change-password")
def change_password(data: PasswordChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    user = db.query(User).filter(User.id == current_user.id).first()

    # validar password actual
    if not verify_password(data.current, user.password):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")

    if len(data.new.encode("utf-8")) > 72:
        raise HTTPException(status_code=400, detail="La contraseña es demasiado larga (max 72 bytes)")

    if len(data.new) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")

    # nueva password
    user.password = hash_password(data.new)

    db.commit()

    return {"message": "Contraseña actualizada"}


@router.delete("/users/me")
def delete_me(data: DeleteAccount, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):

    user = db.query(User).filter(User.id == current_user.id).first()

    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta")

    db.delete(user)
    db.commit()

    return {"message": "Cuenta eliminada"}
