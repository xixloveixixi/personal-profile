"""Generate Plan API Router - Non-streaming plan generation."""

from fastapi import APIRouter, HTTPException
from datetime import date, timedelta

from app.models.schemas import GeneratePlanRequest, GeneratePlanResponse, GeneratedPlan, GeneratedTask
from app.agents.learning_coach import get_agent, get_llm

router = APIRouter()


PLAN_GENERATION_PROMPT = """基于以下信息生成学习计划：

## 学习目标
目标 ID: {goal_id}

## 用户偏好
{preferences}

请生成一个学习计划，包含：
1. 计划标题和描述
2. 任务列表（每个任务包含标题、描述、类型、预估时间、顺序）

任务类型：learning（学习）、practice（练习）、review（复习）、project（项目）

请以 JSON 格式返回结果。
"""


@router.post("/generate/plan", response_model=GeneratePlanResponse)
async def generate_plan(request: GeneratePlanRequest):
    """
    Generate learning plan using LLM.

    This endpoint is called by Go backend (proxy mode).
    """
    if not request.goal_id:
        raise HTTPException(status_code=400, detail="goal_id is required")

    try:
        llm = get_llm()

        # Build prompt
        preferences = request.preferences or "无特殊偏好"
        prompt = PLAN_GENERATION_PROMPT.format(
            goal_id=request.goal_id,
            preferences=preferences
        )

        # Call LLM
        response = llm.invoke(prompt)
        content = response.content

        # For MVP, return structured mock response
        # TODO: parse actual LLM response and validate structure
        today = date.today()
        end_date = today + timedelta(days=30)

        return GeneratePlanResponse(
            plan=GeneratedPlan(
                title="AI 生成的学习计划",
                description=content[:200] if len(content) > 200 else content,
                startDate=today.isoformat(),
                endDate=end_date.isoformat(),
            ),
            tasks=[
                GeneratedTask(
                    title="学习基础概念",
                    description="阅读官方文档，理解核心概念",
                    taskType="learning",
                    estimatedMinutes=60,
                    sortOrder=1,
                ),
                GeneratedTask(
                    title="动手实践",
                    description="完成一个小型练习项目",
                    taskType="practice",
                    estimatedMinutes=120,
                    sortOrder=2,
                ),
                GeneratedTask(
                    title="总结复盘",
                    description="整理学习笔记，巩固知识",
                    taskType="review",
                    estimatedMinutes=30,
                    sortOrder=3,
                ),
            ]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM call failed: {str(e)}")
