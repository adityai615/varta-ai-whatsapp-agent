import os
import re
from pathlib import Path
from functools import lru_cache
from typing import List

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate

from app.services.llm import build_llm


APP_DIR = Path(__file__).resolve().parents[1]  # app/
DEFAULT_DATA_PATH = str(APP_DIR / "data" / "business.txt")
DEFAULT_CHROMA_DIR = str(APP_DIR.parent / "chroma_db")
DEFAULT_COLLECTION_PREFIX = "business_kb"


RAG_SYSTEM_PROMPT = (
    "You are Samvaad AI. Answer the user's question using ONLY the provided context. "
    "If the answer is not in the context, say: \"I don't know based on the provided information.\" "
    "Keep the answer short and accurate."
)


def _load_text_file(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def _split_into_chunks(text: str) -> List[Document]:
    # Keep this dependency-light and deterministic.
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=80)
    chunks = splitter.split_text(text)
    return [Document(page_content=c) for c in chunks if c.strip()]


def _build_embeddings():
    # Local embeddings (no API key required).
    # Uses ONNX via fastembed (lighter than torch/sentence-transformers).
    from langchain_community.embeddings import FastEmbedEmbeddings

    return FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")


def _normalize_business_id(business_id: str) -> str:
    """
    Turn arbitrary identifiers (including WhatsApp numbers) into a safe key.
    Examples:
      - "whatsapp:+14155238886" -> "whatsapp_14155238886"
      - "+91 98765 43210" -> "919876543210"
      - "gym" -> "gym"
    """
    raw = (business_id or "").strip()
    if not raw:
        return "default"
    raw = raw.lower()
    raw = raw.replace("whatsapp:", "whatsapp_")
    raw = re.sub(r"\s+", "", raw)
    raw = re.sub(r"[^a-z0-9_+]", "_", raw)
    raw = raw.replace("+", "")
    raw = re.sub(r"_+", "_", raw).strip("_")
    return raw or "default"


def _business_data_path(business_id: str) -> str | None:
    key = _normalize_business_id(business_id)
    candidate = APP_DIR / "data" / key / "business.txt"
    if candidate.exists():
        return str(candidate)
    default = Path(DEFAULT_DATA_PATH)
    if default.exists():
        return str(default)
    return None


def _kb_fingerprint(path: str) -> str:
    """
    Fingerprint the KB file so updates create a fresh index automatically.
    Uses mtime_ns + size (fast, stable enough for this use-case).
    """
    p = Path(path)
    st = p.stat()
    return f"{st.st_mtime_ns:x}_{st.st_size:x}"


@lru_cache(maxsize=128)
def _vectorstore(business_key: str, data_path: str, kb_fp: str):
    """
    Create/load a persistent Chroma vector store for a business KB.
    Cached in-process so webhook calls are fast.
    """
    from langchain_chroma import Chroma

    base_dir = os.getenv("CHROMA_DIR", DEFAULT_CHROMA_DIR)
    persist_directory = str(Path(base_dir) / business_key / kb_fp)
    collection_name = os.getenv("CHROMA_COLLECTION", f"{DEFAULT_COLLECTION_PREFIX}_{business_key}_{kb_fp}")

    embeddings = _build_embeddings()
    vs = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=persist_directory,
    )

    # Idempotent-ish: only index if empty.
    try:
        existing = vs._collection.count()  # type: ignore[attr-defined]
    except Exception:
        existing = 0

    if existing == 0:
        raw = _load_text_file(data_path)
        docs = _split_into_chunks(raw)
        if docs:
            vs.add_documents(docs)

    return vs


def build_retriever(*, business_id: str = "", data_path: str | None = None):
    key = _normalize_business_id(business_id)
    resolved_path = data_path or _business_data_path(business_id)
    if not resolved_path:
        raise FileNotFoundError(
            f"No knowledge base found for business_id={business_id!r}. "
            f"Expected `app/data/{key}/business.txt` (or `app/data/business.txt`)."
        )
    fp = _kb_fingerprint(resolved_path)
    vs = _vectorstore(key, resolved_path, fp)
    return vs.as_retriever(search_kwargs={"k": 4})


async def rag_answer(question: str, *, business_id: str = "", data_path: str | None = None) -> str:
    """
    Retrieve relevant chunks and answer using ChatGroq.
    Answer is constrained to retrieved context only.
    """
    try:
        retriever = build_retriever(business_id=business_id, data_path=data_path)
    except FileNotFoundError:
        return "I don't know based on the provided information."
    docs = await retriever.ainvoke(question)
    if not docs:
        return "I don't know based on the provided information."
    context = "\n\n".join(d.page_content for d in docs)

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", RAG_SYSTEM_PROMPT),
            ("human", "Context:\n{context}\n\nQuestion:\n{question}"),
        ]
    )

    llm = build_llm()
    msg = await (prompt | llm).ainvoke({"context": context, "question": question})
    content = getattr(msg, "content", "") or ""
    return content.strip()

