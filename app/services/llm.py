import os

try:
    from dotenv import load_dotenv

    load_dotenv()
except Exception:
    pass


def build_llm():
    """
    ChatGroq-only LLM factory.
    Requires:
      - GROQ_API_KEY
    Optional:
      - GROQ_MODEL (default: llama-3.3-70b-versatile)
    """
    from langchain_groq import ChatGroq

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("Missing GROQ_API_KEY")

    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    return ChatGroq(model=model, api_key=api_key)

