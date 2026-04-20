from fastapi import APIRouter, Request, Response
from html import escape
import logging

from app.services.agent import build_whatsapp_agent

router = APIRouter()
_agent = None

FALLBACK_MESSAGE = "Sorry, something went wrong. Please try again."


def _get_agent():
    global _agent
    if _agent is None:
        _agent = build_whatsapp_agent()
    return _agent


logger = logging.getLogger("samvaad.webhook")


@router.post("/webhook")
async def webhook(request: Request) -> Response:
    form = await request.form()

    message_body = (form.get("Body") or "").strip()
    from_number = form.get("From")

    print(f"From: {from_number}")
    print(f"Body: {message_body}")

    if not message_body:
        ai_text = "How can I help you today?"
    else:
        try:
            result = await _get_agent().ainvoke({"input": message_body, "user_id": from_number or ""})
            ai_text = (result.get("output") or "").strip() or "How can I help you today?"
        except Exception:
            logger.exception("Agent failed for user=%r body=%r", from_number, message_body)
            ai_text = FALLBACK_MESSAGE

    # TwiML must be valid XML; escape model output.
    safe_text = escape(ai_text, quote=False)

    twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>""" + safe_text + """</Message>
</Response>
"""

    return Response(content=twiml, media_type="application/xml")
