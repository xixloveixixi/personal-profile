"""Learning Coach Agent - LangGraph Implementation."""

from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode

from app.config import get_settings
from app.tools.learning import ALL_TOOLS, READ_TOOLS

settings = get_settings()


class AgentState(TypedDict):
    """Agent state for LangGraph."""
    messages: Annotated[list[BaseMessage], add_messages]
    owner_id: int
    allow_write_tools: bool


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
- 诊断用户当前学习状态（已掌握、正在推进、卡点风险、目标差距）
- 根据学习目标生成详细的学习计划和任务建议
- 分析面试复盘，识别优缺点，调整学习方向
- 跟踪学习进度，生成周复盘报告

## 工作原则
1. 始终基于用户的真实数据（画像、目标、技能、计划、任务、进度）做分析，不凭空假设
2. 制定学习计划前，必须先完成当前状态诊断；不要只问画像和目标就直接生成通用计划
3. 计划要具体可执行，包含明确的时间、任务和产出
4. 任务拆解遵循 SMART 原则（具体、可衡量、可达成、相关、有时限）
5. 发现用户新的弱点、进步或数据缺口时，主动说明并建议更新画像或补充记录
6. 用中文回复，语气专业但友好

## 工具使用
在需要时调用工具获取数据，不要凭记忆回答关于用户数据的问题。
当用户询问学习情况、当前状态、画像、目标、技能、计划、进度，或要求制定学习计划时，优先调用 diagnose_current_state 获取聚合诊断上下文。
如果 diagnose_current_state 返回 missingContext，先说明缺失了哪些关键信息，并只追问最少必要问题；不要假装已经了解用户当前状况。
输出当前状态诊断时，优先按“数据依据 / 已掌握 / 正在推进 / 卡点风险 / 目标差距 / 下一步建议”组织。

## 写入边界
默认只做诊断、建议和草案，不要声称“已创建、已添加、已更新、已激活”。
当用户说“制定计划”“帮我规划”“看看学习计划”时，只输出可执行草案和下一步建议，不落库创建计划或任务。
只有用户明确要求“创建/保存/添加任务/记录进度/更新状态/激活计划”等写入动作时，才可以使用写入工具。
如果用户意图不清晰，先询问是否要保存到系统，而不是直接写入数据。
"""


def create_agent():
    """Create the Learning Coach Agent graph."""
    read_llm = get_llm().bind_tools(READ_TOOLS)
    write_llm = get_llm().bind_tools(ALL_TOOLS)

    # Define nodes
    def agent_node(state: AgentState):
        """Main agent reasoning node."""
        messages = state["messages"]
        full_messages = [SystemMessage(content=SYSTEM_PROMPT)] + list(messages)
        llm = write_llm if state.get("allow_write_tools", False) else read_llm
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
