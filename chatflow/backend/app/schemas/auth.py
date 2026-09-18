from typing import Optional
from pydantic import BaseModel, EmailStr, Field, model_validator
from app.schemas.user import UserOut

class UserRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=6, max_length=128)
    confirm_password: str = Field(..., min_length=6, max_length=128)
    profile_image: Optional[str] = None

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self

class UserLogin(BaseModel):
    email: str  # Can be email or username
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=128)
    confirm_new_password: str = Field(..., min_length=6, max_length=128)

    @model_validator(mode="after")
    def new_passwords_match(self):
        if self.new_password != self.confirm_new_password:
            raise ValueError("New passwords do not match")
        return self
