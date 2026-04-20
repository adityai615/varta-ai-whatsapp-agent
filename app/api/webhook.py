from fastapi import APIRouter, Request, Response
from html import escape

from app.services.agent import build_whatsapp_agent

router = APIRouter()
_agent = None


def _get_agent():
    global _agent
    if _agent is None:
        _agent = build_whatsapp_agent()
    return _agent


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
            result = await _get_agent().ainvoke({"input": message_body})
            ai_text = (result.get("output") or "").strip() or "How can I help you today?"
        except Exception:
            ai_text = "Sorry—I'm having trouble responding right now. Please try again in a moment."

    # TwiML must be valid XML; escape model output.
    safe_text = escape(ai_text, quote=False)

    twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>""" + safe_text + """</Message>
</Response>
"""

    return Response(content=twiml, media_type="application/xml")
