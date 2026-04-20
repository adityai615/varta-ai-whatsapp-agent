import os
from functools import lru_cache
from typing import List

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate

from app.services.llm import build_llm


DEFAULT_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "business.txt")
DEFAULT_CHROMA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "chroma_db")
DEFAULT_COLLECTION = "business_kb"


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


@lru_cache(maxsize=1)
def _vectorstore(data_path: str = DEFAULT_DATA_PATH):
    """
    Create/load a persistent Chroma vector store for the business KB.
    Cached in-process so webhook calls are fast.
    """
    from langchain_chroma import Chroma

    persist_directory = os.getenv("CHROMA_DIR", DEFAULT_CHROMA_DIR)
    collection_name = os.getenv("CHROMA_COLLECTION", DEFAULT_COLLECTION)

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


def build_retriever(data_path: str = DEFAULT_DATA_PATH):
    vs = _vectorstore(data_path=data_path)
    return vs.as_retriever(search_kwargs={"k": 4})


async def rag_answer(question: str, data_path: str = DEFAULT_DATA_PATH) -> str:
    """
    Retrieve relevant chunks and answer using ChatGroq.
    Answer is constrained to retrieved context only.
    """
    retriever = build_retriever(data_path=data_path)
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

