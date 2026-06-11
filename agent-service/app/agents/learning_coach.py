"""Learning Coach Agent - LangGraph Implementation."""

from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode

from app.config import get_settings
from app.tools.learning import ALL_TOOLS

settings = get_settings()


class AgentState(TypedDict):
    """Agent state for LangGraph."""
    messages: Annotated[list[BaseMessage], add_messages]
    owner_id: int


def get_llm():
    """Get configured LLM instance."""
    return ChatOpenAI(
        api_key=settings.deepseek_api_key,
        base_url=settings.deepseek_base_url,
        model=settings.deepseek_model,
        temperature=0.7,
    )


SYSTEM_PROMPT = """你是一位专业的学习教练，帮助用户制定和执行个性化学习计划。

## 你的能力
- 分析用户的学习画像（背景、技能、弱点）
- 根据学习目标生成详细的学习计划和任务
- 分析面试复盘，识别优缺点，调整学习方向
- 跟踪学习进度，生成周复盘报告

## 工作原则
1. 始终基于用户的真实数据（画像、目标、进度）做分析，不凭空假设
2. 计划要具体可执行，包含明确的时间和产出
3. 任务拆解遵循 SMART 原则（具体、可衡量、可达成、相关、有时限）
4. 发现用户新的弱点或进步时，主动建议更新学习画像
5. 用中文回复，语气专业但友好

## 工具使用
在需要时调用工具获取或更新数据，不要凭记忆回答关于用户数据的问题。
当用户询问学习情况、画像、目标时，先调用对应工具获取真实数据再回答。
"""


def create_agent():
    """Create the Learning Coach Agent graph."""
    llm = get_llm().bind_tools(ALL_TOOLS)

    # Define nodes
    def agent_node(state: AgentState):
        """Main agent reasoning node."""
        messages = state["messages"]
        full_messages = [SystemMessage(content=SYSTEM_PROMPT)] + list(messages)
        response = llm.invoke(full_messages)
        return {"messages": [response]}

    def should_continue(state: AgentState):
        """Check if agent wants to call tools."""
        last_message = state["messages"][-1]
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"
        return END

    # Build graph
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", ToolNode(ALL_TOOLS))

    # Set entry point
    workflow.set_entry_point("agent")

    # Conditional edge: call tools or end
    workflow.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    workflow.add_edge("tools", "agent")

    # Compile with memory checkpoint
    checkpointer = MemorySaver()
    return workflow.compile(checkpointer=checkpointer)


# Global agent instance
_agent = None


def get_agent():
    """Get or create the agent instance."""
    global _agent
    if _agent is None:
        _agent = create_agent()
    return _agent
