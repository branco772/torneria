from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from core.config import settings
from core.deps import get_db
from models.user import User
from schemas.auth_schema import UserCreate, UserLogin, Token, UserResponse
from services.auth_service import create_user, login_user
from core.security import get_current_user

router = APIRouter()
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)


def is_admin_user(db: Session, user: User | None) -> bool:
    if user is None:
        return False

    first_user = db.query(User).order_by(User.id.asc()).first()
    return first_user is not None and user.id == first_user.id


def get_optional_current_user(
    token: str | None = Depends(optional_oauth2_scheme),
    db: Session = Depends(get_db)
):
    if token is None:
        return None

    credentials_exception = HTTPException(
        status_code=401,
        detail="No autorizado"
    )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user_id = int(user_id)

    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise credentials_exception

    return user


@router.get("/me")
def get_me(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "is_admin": is_admin_user(db, current_user)
    }

# 🔥 registro
@router.post("/register", response_model=UserResponse)
def register(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user)
):
    users_count = db.query(User).count()

    if users_count > 0 and current_user is None:
        raise HTTPException(status_code=401, detail="Solo un usuario autenticado puede crear otro usuario")

    if users_count > 0 and not is_admin_user(db, current_user):
        raise HTTPException(status_code=403, detail="Solo el admin puede crear usuarios")

    return create_user(db, user)


# 🔥 login
@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    return login_user(db, user)
