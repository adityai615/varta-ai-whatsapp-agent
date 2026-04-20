from langchain_core.prompts import ChatPromptTemplate

from app.services.llm import build_llm
from app.services.prompts import SYSTEM_PROMPT
from app.services.tools import booking_tool, faq_tool


def build_whatsapp_agent():
    """
    Returns an object that accepts {"input": str} and returns {"output": str}.
    Uses ChatGroq + tool calling without langchain.agents (compatible with LangChain v1+).
    """
    from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage

    llm = build_llm()
    tools = [faq_tool, booking_tool]
    llm_with_tools = llm.bind_tools(tools)
    tool_by_name = {t.name: t for t in tools}

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            ("human", "{input}"),
        ]
    )

    def _run_sync(user_input: str) -> str:
        messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=user_input)]
        for _ in range(8):
            ai = llm_with_tools.invoke(messages)
            messages.append(ai)

            tool_calls = getattr(ai, "tool_calls", None) or []
            if not tool_calls:
                return (ai.content or "").strip()

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

        return "Sorry—I’m having trouble completing that request right now. Please try again."

    async def _run_async(user_input: str) -> str:
        messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=user_input)]
        for _ in range(8):
            ai = await llm_with_tools.ainvoke(messages)
            messages.append(ai)

            tool_calls = getattr(ai, "tool_calls", None) or []
            if not tool_calls:
                return (ai.content or "").strip()

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

        return "Sorry—I’m having trouble completing that request right now. Please try again."

    class _Agent:
        def invoke(self, payload: dict) -> dict:
            return {"output": _run_sync((payload or {}).get("input", ""))}

        async def ainvoke(self, payload: dict) -> dict:
            return {"output": await _run_async((payload or {}).get("input", ""))}

    return _Agent()

