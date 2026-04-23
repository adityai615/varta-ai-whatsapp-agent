from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import BusinessCreate, BusinessDataOut, BusinessDataUpdate, BusinessOut
from app.services.business_kb import (
    build_faiss_index_for_business,
    has_business_kb,
    read_business_kb_text,
    save_business_kb_text_file,
    write_business_kb_text,
)
from app.services.business_service import create_business, get_business, list_businesses


router = APIRouter(prefix="/business", tags=["business"])


@router.post("", response_model=BusinessOut)
def create_business_api(payload: BusinessCreate, db: Session = Depends(get_db)):
    try:
        return create_business(db, name=payload.name, phone=payload.phone)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=list[BusinessOut])
def list_businesses_api(db: Session = Depends(get_db)):
    rows = list_businesses(db)
    out: list[BusinessOut] = []
    for b in rows:
        out.append(
            BusinessOut(
                id=b.id,
                name=b.name,
                phone=b.phone,
                created_at=b.created_at,
                has_data=has_business_kb(b.id),
            )
        )
    return out


@router.get("/{business_id}/data", response_model=BusinessDataOut)
def get_business_data(business_id: int, db: Session = Depends(get_db)):
    biz = get_business(db, business_id)
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    if not has_business_kb(business_id):
        raise HTTPException(status_code=404, detail="No data uploaded")
    return BusinessDataOut(business_id=business_id, text=read_business_kb_text(business_id))


@router.put("/{business_id}/data")
def update_business_data(payload: BusinessDataUpdate, business_id: int, db: Session = Depends(get_db)):
    biz = get_business(db, business_id)
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    path = write_business_kb_text(business_id, text)
    index_dir = build_faiss_index_for_business(business_id, path)
    return {"status": "ok", "business_id": business_id, "data_path": path, "faiss_dir": index_dir}


@router.post("/{business_id}/upload")
async def upload_business_data(
    business_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    biz = get_business(db, business_id)
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    if not file.filename.lower().endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt files are supported")

    content = await file.read()
    path = save_business_kb_text_file(business_id, "business.txt", content)
    index_dir = build_faiss_index_for_business(business_id, path)

    return {"status": "ok", "business_id": business_id, "data_path": path, "faiss_dir": index_dir}

