from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import MessageOut
from app.services.business_service import get_business
from app.services.message_service import list_messages


router = APIRouter(prefix="/messages", tags=["messages"])


@router.get("/{business_id}", response_model=list[MessageOut])
def get_messages(business_id: int, db: Session = Depends(get_db)):
    biz = get_business(db, business_id)
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return list_messages(db, business_id=business_id)

