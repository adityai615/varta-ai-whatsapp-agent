from langchain_core.prompts import ChatPromptTemplate

from app.services.llm import build_llm
from app.services.prompts import SYSTEM_PROMPT
from app.services.tools import booking_tool, faq_tool, rag_tool


def build_whatsapp_agent():
    """
    Returns an object that accepts {"input": str, "user_id": str} and returns {"output": str}.
    Uses ChatGroq + tool calling without langchain.agents (compatible with LangChain v1+).
    Adds per-user ConversationBufferMemory keyed by user_id (e.g., phone number).
    """
    from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
    try:
        from langchain.memory import ConversationBufferMemory  # type: ignore
    except Exception:
        from langchain_classic.memory import ConversationBufferMemory  # type: ignore

    llm = build_llm()
    tools = [faq_tool, rag_tool, booking_tool]
    llm_with_tools = llm.bind_tools(tools)
    tool_by_name = {t.name: t for t in tools}

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            ("human", "{input}"),
        ]
    )

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

    def _run_sync(user_id: str, user_input: str) -> str:
        mem, messages = _base_messages(user_id, user_input)
        for _ in range(8):
            ai = llm_with_tools.invoke(messages)
            messages.append(ai)

            tool_calls = getattr(ai, "tool_calls", None) or []
            if not tool_calls:
                final = (ai.content or "").strip()
                mem.save_context({"input": user_input}, {"output": final})
                return final

            for call in tool_calls:
                name = call.get("name")
                args = call.get("args") or {}
                call_id = call.get("id")

                tool = tool_by_name.get(name)
                if tool is None:
                    result = f"Unknown tool: {name}"
                else:
                    result = tool.invoke(args)

                messages.append(ToolMessage(content=str(result), tool_call_id=call_id))

        final = "Sorry, I'm having trouble completing that request right now. Please try again."
        mem.save_context({"input": user_input}, {"output": final})
        return final

    async def _run_async(user_id: str, user_input: str) -> str:
        mem, messages = _base_messages(user_id, user_input)
        for _ in range(8):
            ai = await llm_with_tools.ainvoke(messages)
            messages.append(ai)

            tool_calls = getattr(ai, "tool_calls", None) or []
            if not tool_calls:
                final = (ai.content or "").strip()
                mem.save_context({"input": user_input}, {"output": final})
                return final

            for call in tool_calls:
                name = call.get("name")
                args = call.get("args") or {}
                call_id = call.get("id")

                tool = tool_by_name.get(name)
                if tool is None:
                    result = f"Unknown tool: {name}"
                else:
                    result = tool.invoke(args)

                messages.append(ToolMessage(content=str(result), tool_call_id=call_id))

        final = "Sorry, I'm having trouble completing that request right now. Please try again."
        mem.save_context({"input": user_input}, {"output": final})
        return final

    class _Agent:
        def invoke(self, payload: dict) -> dict:
            p = payload or {}
            return {"output": _run_sync(p.get("user_id", ""), p.get("input", ""))}

        async def ainvoke(self, payload: dict) -> dict:
            p = payload or {}
            return {"output": await _run_async(p.get("user_id", ""), p.get("input", ""))}

    return _Agent()

