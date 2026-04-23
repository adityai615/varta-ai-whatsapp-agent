from __future__ import annotations

from contextvars import ContextVar


current_user_id: ContextVar[str] = ContextVar("current_user_id", default="")
current_business_id: ContextVar[str] = ContextVar("current_business_id", default="")


def get_user_id() -> str:
    return (current_user_id.get() or "").strip()


def get_business_id() -> str:
    return (current_business_id.get() or "").strip()

