from __future__ import annotations

import os
from pathlib import Path

from langchain_core.documents import Document


DATA_DIR = Path(__file__).resolve().parents[1] / "data"
FAISS_DIR = Path(__file__).resolve().parents[2] / "faiss_db"
KB_FILENAME = "business.txt"


def _split(text: str) -> list[Document]:
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=120)
    return [Document(page_content=c) for c in splitter.split_text(text) if c.strip()]


def _embeddings():
    from langchain_community.embeddings import FastEmbedEmbeddings

    return FastEmbedEmbeddings(model_name=os.getenv("EMBEDDINGS_MODEL", "BAAI/bge-small-en-v1.5"))


def save_business_kb_text_file(business_id: int, filename: str, content: bytes) -> str:
    biz_dir = DATA_DIR / str(business_id)
    biz_dir.mkdir(parents=True, exist_ok=True)
    path = biz_dir / filename
    path.write_bytes(content)
    return str(path)


def business_kb_path(business_id: int) -> Path:
    return DATA_DIR / str(business_id) / KB_FILENAME


def has_business_kb(business_id: int) -> bool:
    return business_kb_path(business_id).exists()


def read_business_kb_text(business_id: int) -> str:
    path = business_kb_path(business_id)
    return path.read_text(encoding="utf-8")


def write_business_kb_text(business_id: int, text: str) -> str:
    path = DATA_DIR / str(business_id)
    path.mkdir(parents=True, exist_ok=True)
    file_path = path / KB_FILENAME
    file_path.write_text(text, encoding="utf-8")
    return str(file_path)


def build_faiss_index_for_business(business_id: int, text_path: str) -> str:
    """
    Build a FAISS index for a business and persist it locally.
    Returns the persisted directory path.
    """
    from langchain_community.vectorstores import FAISS

    raw = Path(text_path).read_text(encoding="utf-8")
    docs = _split(raw)

    vs = FAISS.from_documents(docs, _embeddings()) if docs else FAISS.from_texts([""], _embeddings())

    out_dir = FAISS_DIR / str(business_id)
    out_dir.mkdir(parents=True, exist_ok=True)
    vs.save_local(str(out_dir))
    return str(out_dir)

