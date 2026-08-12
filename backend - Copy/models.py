from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import date as date_type


class AttendanceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    roll_number: str = Field(..., min_length=1, max_length=50)
    session: Literal["Morning", "Evening"]
    timing: str  # HH:MM, editable by member
    date: str  # YYYY-MM-DD, editable by member (defaults to today on frontend)


class AttendanceOut(AttendanceCreate):
    id: str
    created_at: str


class OwnerLogin(BaseModel):
    email: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
