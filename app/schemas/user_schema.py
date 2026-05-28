from pydantic import BaseModel, Field, field_validator

from schemas.auth_schema import normalize_username


class UserUpdate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        return normalize_username(value)


class PasswordChange(BaseModel):
    current: str
    new: str = Field(..., min_length=8, max_length=72)


class DeleteAccount(BaseModel):
    password: str
