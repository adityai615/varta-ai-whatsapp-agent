from fastapi import APIRouter, Request, Response
from html import escape
import logging
import os

try:
    from dotenv import load_dotenv

    load_dotenv()
except Exception:
    pass

from app.services.agent import build_whatsapp_agent
from app.db import get_db_session
from app.services.business_service import get_business
from app.services.message_service import log_message

router = APIRouter()
_agent = None

FALLBACK_MESSAGE = "Sorry, something went wrong. Please try again."


def _get_agent():
    global _agent
    if _agent is None:
        _agent = build_whatsapp_agent()
    return _agent


logger = logging.getLogger("varta.webhook")

def _resolve_business_id(to_number: str | None) -> str:
    """
    Map Twilio 'To' (your WhatsApp business number) -> internal business_id folder name.
    Configure via env:
      BUSINESS_ID_BY_TO="whatsapp:+14155238886=gym,whatsapp:+14155230000=saloon"
    """
    raw_map = (os.getenv("BUSINESS_ID_BY_TO") or "").strip()
    if raw_map and ((raw_map[0] == raw_map[-1]) and raw_map[0] in ("'", '"')):
        raw_map = raw_map[1:-1].strip()
    if raw_map and to_number:
        for pair in raw_map.split(","):
            pair = pair.strip()
            if not pair or "=" not in pair:
                continue
            k, v = pair.split("=", 1)
            kk = k.strip().strip('"').strip("'")
            vv = v.strip().strip('"').strip("'")
            if kk == to_number:
                return vv
    return to_number or ""


@router.post("/webhook")
async def webhook(request: Request) -> Response:
    form = await request.form()

    message_body = (form.get("Body") or "").strip()
    from_number = form.get("From")
    to_number = form.get("To")
    business_id = _resolve_business_id(to_number)

    print(f"From: {from_number}")
    print(f"To: {to_number}")
    print(f"Body: {message_body}")

    if not message_body:
        ai_text = "How can I help you today?"
    else:
        try:
            result = await _get_agent().ainvoke(
                {"input": message_body, "user_id": from_number or "", "business_id": business_id}
            )
            ai_text = (result.get("output") or "").strip() or "How can I help you today?"
        except Exception:
            logger.exception("Agent failed for user=%r body=%r", from_number, message_body)
            ai_text = FALLBACK_MESSAGE
        finally:
            # Best-effort persistence of logs
            try:
                db = get_db_session()
                try:
                    biz = None
                    if business_id.isdigit():
                        biz = get_business(db, int(business_id))
                    if biz:
                        log_message(
                            db,
                            business_id=biz.id,
                            user=from_number or "",
                            message=message_body,
                            response=ai_text,
                        )
                finally:
                    db.close()
            except Exception:
                logger.exception("Failed to persist message log")

    # TwiML must be valid XML; escape model output.
    safe_text = escape(ai_text, quote=False)

    twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>""" + safe_text + """</Message>
</Response>
"""

    return Response(content=twiml, media_type="application/xml")
