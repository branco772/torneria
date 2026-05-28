from pydantic import BaseModel, Field, field_validator


def normalize_username(value: str) -> str:
    username = value.strip().lower()
    if not username:
        raise ValueError("El username es obligatorio")
    if " " in username:
        raise ValueError("El username no puede contener espacios")
    return username

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=72)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        return normalize_username(value)

class UserLogin(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        return normalize_username(value)

class UserResponse(BaseModel):
    id: int
    username: str

class Token(BaseModel):
    access_token: str
    token_type: str
