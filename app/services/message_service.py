from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Message


def log_message(db: Session, *, business_id: int, user: str, message: str, response: str) -> Message:
    row = Message(
        business_id=business_id,
        user=(user or "").strip(),
        message=(message or "").strip(),
        response=(response or "").strip(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def list_messages(db: Session, *, business_id: int) -> list[Message]:
    return db.query(Message).filter(Message.business_id == business_id).order_by(Message.id.desc()).all()

