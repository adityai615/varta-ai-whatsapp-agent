from app.services.prompts import SYSTEM_PROMPT
from app.services.tools import booking_tool, faq_tool, rag_tool
from app.services.request_context import current_business_id, current_user_id


def build_whatsapp_agent():
    """
    Returns an object that accepts {"input": str, "user_id": str, "business_id": str} and returns {"output": str}.
    Uses ChatGroq + tool calling without langchain.agents (compatible with LangChain v1+).
    Adds per-user ConversationBufferMemory keyed by user_id (e.g., phone number).
    """
    from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
    try:
        from langchain.memory import ConversationBufferMemory  # type: ignore
    except Exception:
        from langchain_classic.memory import ConversationBufferMemory  # type: ignore

    async def _call_tool_async(tool, args: dict):
        return await tool.ainvoke(args)

    def _call_tool_sync(tool, args: dict):
        """
        Supports sync tools, and best-effort support for async tools
        when the agent is invoked synchronously (e.g., CLI tests).
        """
        try:
            return tool.invoke(args)
        except NotImplementedError:
            import asyncio

            return asyncio.run(tool.ainvoke(args))

    def _select_tool(user_input: str):
        """
        Lightweight, scalable routing.
        Avoids LLM tool-calling (Groq may emit invalid tool-call syntax).
        """
        text = (user_input or "").strip().lower()
        if not text:
            return None

        # Greetings / small talk -> respond normally (no tool)
        if any(x in text for x in ["hi", "hii", "hello", "hey", "namaste", "hlo"]):
            if len(text) <= 20:
                return None

        # Booking intent
        if any(k in text for k in ["book", "booking", "appointment", "slot", "schedule", "reschedule"]):
            return booking_tool

        # FAQ intent
        if any(k in text for k in ["price", "pricing", "cost", "charges", "fee", "fees", "timing", "hours", "open", "close", "address", "location"]):
            return faq_tool

        # Default: use business KB (RAG)
        return rag_tool

    memories: dict[str, ConversationBufferMemory] = {}

    def _get_memory(user_id: str) -> ConversationBufferMemory:
        uid = (user_id or "").strip() or "anonymous"
        mem = memories.get(uid)
        if mem is None:
            mem = ConversationBufferMemory(return_messages=True)
            memories[uid] = mem
        return mem

    def _base_messages(user_id: str, user_input: str):
        mem = _get_memory(user_id)
        history = list(mem.chat_memory.messages)
        return mem, [SystemMessage(content=SYSTEM_PROMPT), *history, HumanMessage(content=user_input)]

    def _run_sync(user_id: str, business_id: str, user_input: str) -> str:
        user_tok = current_user_id.set(user_id or "")
        biz_tok = current_business_id.set(business_id or "")
        try:
            mem, _messages = _base_messages(user_id, user_input)
            tool = _select_tool(user_input)
            if tool is None:
                final = "Hi! How can I help you today?"
                mem.save_context({"input": user_input}, {"output": final})
                return final

            # Tools are defined as StructuredTool; they expect a dict payload.
            result = _call_tool_sync(tool, {"question": user_input} if tool.name in ["faq_tool", "rag_tool"] else {"details": user_input})
            final = (str(result) or "").strip() or "How can I help you today?"
            mem.save_context({"input": user_input}, {"output": final})
            return final
        finally:
            current_user_id.reset(user_tok)
            current_business_id.reset(biz_tok)

    async def _run_async(user_id: str, business_id: str, user_input: str) -> str:
        user_tok = current_user_id.set(user_id or "")
        biz_tok = current_business_id.set(business_id or "")
        try:
            mem, _messages = _base_messages(user_id, user_input)
            tool = _select_tool(user_input)
            if tool is None:
                final = "Hi! How can I help you today?"
                mem.save_context({"input": user_input}, {"output": final})
                return final

            payload = {"question": user_input} if tool.name in ["faq_tool", "rag_tool"] else {"details": user_input}
            result = await _call_tool_async(tool, payload)
            final = (str(result) or "").strip() or "How can I help you today?"
            mem.save_context({"input": user_input}, {"output": final})
            return final
        finally:
            current_user_id.reset(user_tok)
            current_business_id.reset(biz_tok)

    class _Agent:
        def invoke(self, payload: dict) -> dict:
            p = payload or {}
            return {"output": _run_sync(p.get("user_id", ""), p.get("business_id", ""), p.get("input", ""))}

        async def ainvoke(self, payload: dict) -> dict:
            p = payload or {}
            return {"output": await _run_async(p.get("user_id", ""), p.get("business_id", ""), p.get("input", ""))}

    return _Agent()

