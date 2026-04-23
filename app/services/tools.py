import re
from datetime import datetime, timedelta
from uuid import uuid4

from langchain_core.tools import tool

from app.services.rag import rag_answer
from app.services.request_context import get_business_id


@tool("faq_tool")
def faq_tool(question: str) -> str:
    """Answer common business FAQ questions like pricing, timing, and address."""
    q = (question or "").lower()

    if any(k in q for k in ["price", "pricing", "cost", "charges", "fee", "fees"]):
        return (
            "Our standard service starts at ₹499. Final pricing depends on your exact needs. "
            "Tell me what you're looking for and I'll share the best option."
        )

    if any(k in q for k in ["timing", "hours", "open", "close", "working hours", "business hours"]):
        return "We're open Monday to Saturday, 10:00 AM to 7:00 PM. We're closed on Sundays."

    if any(k in q for k in ["address", "location", "where are you", "where r you"]):
        return "We're based in India and currently operate by appointment. Share your city and I'll guide you."

    return "I can help with pricing, timings, and booking. What would you like to know: price or timing?"


@tool("rag_tool")
async def rag_tool(question: str) -> str:
    """Answer questions using retrieved context from business knowledge base."""
    return await rag_answer(question, business_id=get_business_id())


@tool("booking_tool")
def booking_tool(details: str) -> str:
    """Simulate booking a slot based on user details/time preference."""
    text = (details or "").strip()
    booking_id = str(uuid4())[:8]

    m = re.search(r"\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b", text.lower())
    if m:
        hour = int(m.group(1))
        minute = int(m.group(2) or "00")
        ampm = m.group(3)
        if ampm == "pm" and hour < 12:
            hour += 12
        if ampm == "am" and hour == 12:
            hour = 0
        slot = f"{hour:02d}:{minute:02d}"
        return f"Booked. Your slot is reserved for {slot}. Booking ID: {booking_id}."

    proposed = (datetime.now() + timedelta(days=1)).replace(hour=11, minute=0, second=0, microsecond=0)
    return (
        f"I can book a slot for you. Next available is {proposed.strftime('%a %d %b, %I:%M %p')}. "
        f"Reply with a preferred time (e.g. \"3pm\") to confirm. Booking ref: {booking_id}."
    )

