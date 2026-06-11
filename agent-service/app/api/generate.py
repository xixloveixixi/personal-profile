"""Generate Plan API Router - Non-streaming plan generation."""

import json
from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import GeneratePlanRequest, GeneratePlanResponse, GeneratedPlan, GeneratedTask
from app.agents.learning_coach import get_llm
from app.auth import verify_token, get_token_from_request
from app.tools.learning import get_learning_profile, get_learning_goals, set_request_token
from datetime import date, timedelta

router = APIRouter()


PLAN_GENERATION_PROMPT = """基于以下信息生成学习计划：

## 学习画像
{profile}

## 学习目标
{goal}

## 用户偏好
{preferences}

请以严格的 JSON 格式返回（不要添加 markdown 代码块标记），格式如下：
{{
  "plan": {{
    "title": "计划标题",
    "description": "计划描述"
  }},
  "tasks": [
    {{
      "title": "任务标题",
      "description": "任务描述",
      "taskType": "learning|practice|review|project",
      "estimatedMinutes": 60,
      "sortOrder": 1
    }}
  ]
}}

任务类型说明：learning（学习）、practice（练习）、review（复习）、project（项目）
生成 3-6 个任务，总时长合理分配在 30 天内。
"""


@router.post("/generate/plan", response_model=GeneratePlanResponse)
async def generate_plan(request: Request, body: GeneratePlanRequest):
    """Generate learning plan using LLM."""
    if not body.goal_id:
        raise HTTPException(status_code=400, detail="goal_id is required")

    # Auth
    await verify_token(request)
    token = get_token_from_request(request)
    set_request_token(token)

    try:
        # Get context data
        profile = get_learning_profile.invoke({})
        goals = get_learning_goals.invoke({})

        # Find target goal
        goal_list = goals if isinstance(goals, list) else goals.get("data", goals) if isinstance(goals, dict) else []
        goal = next((g for g in goal_list if g.get("id") == body.goal_id), None)
        if not goal:
            raise HTTPException(status_code=400, detail=f"Goal {body.goal_id} not found")

        llm = get_llm()
        prompt = PLAN_GENERATION_PROMPT.format(
            profile=json.dumps(profile, ensure_ascii=False),
            goal=json.dumps(goal, ensure_ascii=False),
            preferences=body.preferences or "无特殊偏好",
        )

        response = llm.invoke(prompt)
        content = response.content.strip()

        # Strip markdown code fence if present
        if content.startswith("```"):
            content = content.split("\n", 1)[1]
            if content.endswith("```"):
                content = content[:-3].strip()

        parsed = json.loads(content)

        today = date.today()
        end_date = today + timedelta(days=30)

        plan_data = parsed.get("plan", {})
        tasks_data = parsed.get("tasks", [])

        return GeneratePlanResponse(
            plan=GeneratedPlan(
                title=plan_data.get("title", "AI 生成的学习计划"),
                description=plan_data.get("description", ""),
                startDate=today.isoformat(),
                endDate=end_date.isoformat(),
            ),
            tasks=[
                GeneratedTask(
                    title=t.get("title", ""),
                    description=t.get("description", ""),
                    taskType=t.get("taskType", "learning"),
                    estimatedMinutes=t.get("estimatedMinutes", 60),
                    sortOrder=t.get("sortOrder", i + 1),
                )
                for i, t in enumerate(tasks_data)
            ]
        )

    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="LLM returned invalid JSON")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM call failed: {str(e)}")
