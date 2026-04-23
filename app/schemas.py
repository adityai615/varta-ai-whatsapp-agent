from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class BusinessCreate(BaseModel):
    name: str
    phone: str


class BusinessOut(BaseModel):
    id: int
    name: str
    phone: str
    created_at: datetime
    has_data: bool = False

    class Config:
        from_attributes = True


class BusinessDataOut(BaseModel):
    business_id: int
    text: str


class BusinessDataUpdate(BaseModel):
    text: str


class MessageOut(BaseModel):
    id: int
    business_id: int
    user: str
    message: str
    response: str
    created_at: datetime

    class Config:
        from_attributes = True

