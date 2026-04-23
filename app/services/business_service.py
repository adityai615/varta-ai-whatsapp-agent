from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import Business


def create_business(db: Session, *, name: str, phone: str) -> Business:
    biz = Business(name=name.strip(), phone=phone.strip())
    db.add(biz)
    db.commit()
    db.refresh(biz)
    return biz


def list_businesses(db: Session) -> list[Business]:
    return db.query(Business).order_by(Business.id.desc()).all()


def get_business(db: Session, business_id: int) -> Business | None:
    return db.query(Business).filter(Business.id == business_id).first()

