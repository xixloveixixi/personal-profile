"""Learning Coach Tools - Read/write learning data via Go backend API."""

import json
from collections import Counter
from typing import Any

import httpx
from langchain_core.tools import tool

from app.config import get_settings

settings = get_settings()
BACKEND_URL = settings.backend_url

# Token to use for backend calls (set per-request by the chat handler)
_request_token: str = ""


def set_request_token(token: str):
    """Set the token for the current request (pass-through from user)."""
    global _request_token
    _request_token = token


def _get_token() -> str:
    """Get auth token - prefer pass-through token, fallback to service login."""
    if _request_token:
        return _request_token
    resp = httpx.post(
        f"{BACKEND_URL}/api/auth/login",
        json={"username": "owner", "password": "owner123"},
        timeout=10,
    )
    if resp.status_code != 200:
        return ""
    data = resp.json()
    return data.get("data", {}).get("accessToken", "")


# Cached fallback token
_cached_token: str = ""


def _ensure_token() -> str:
    global _cached_token
    if _request_token:
        return _request_token
    if not _cached_token:
        _cached_token = _get_token()
    return _cached_token


def _headers() -> dict:
    token = _ensure_token()
    return {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}


def _backend_get(path: str) -> dict:
    """Sync GET request to Go backend with auth."""
    resp = httpx.get(f"{BACKEND_URL}{path}", headers=_headers(), timeout=10)
    if resp.status_code == 401:
        global _cached_token
        _cached_token = ""
        resp = httpx.get(f"{BACKEND_URL}{path}", headers=_headers(), timeout=10)
    if resp.status_code != 200:
        return {"error": f"Backend returned {resp.status_code}: {resp.text}"}
    data = resp.json()
    return data.get("data", data)


def _backend_post(path: str, body: dict) -> dict:
    """Sync POST request to Go backend with auth."""
    resp = httpx.post(f"{BACKEND_URL}{path}", headers=_headers(), json=body, timeout=10)
    if resp.status_code == 401:
        global _cached_token
        _cached_token = ""
        resp = httpx.post(f"{BACKEND_URL}{path}", headers=_headers(), json=body, timeout=10)
    if resp.status_code not in (200, 201):
        return {"error": f"Backend returned {resp.status_code}: {resp.text}"}
    data = resp.json()
    return data.get("data", data)


def _is_error(value: Any) -> bool:
    return isinstance(value, dict) and "error" in value


def _as_list(value: Any) -> list:
    if isinstance(value, list):
        return value
    return []


def _nonnull_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _pick_active_goals(goals: list) -> list:
    active_statuses = {"active", "in_progress", "not_started", "pending"}
    active_goals = [goal for goal in goals if goal.get("status") in active_statuses]
    return sorted(active_goals or goals, key=lambda goal: (goal.get("priority", 0), goal.get("id", 0)))[:5]


def _summarize_tasks(tasks: list) -> dict:
    status_counts = Counter(task.get("status", "unknown") for task in tasks)
    type_counts = Counter(task.get("taskType", "unknown") for task in tasks)
    total_estimated = sum(int(task.get("estimatedMinutes") or 0) for task in tasks)
    total_actual = sum(int(task.get("actualMinutes") or 0) for task in tasks)
    active_tasks = [
        task for task in tasks
        if task.get("status") in {"pending", "in_progress", "active"}
    ]
    overdue_or_due_tasks = [task for task in active_tasks if task.get("dueDate")]
    return {
        "total": len(tasks),
        "statusCounts": dict(status_counts),
        "typeCounts": dict(type_counts),
        "estimatedMinutes": total_estimated,
        "actualMinutes": total_actual,
        "activeTasks": sorted(active_tasks, key=lambda task: (task.get("dueDate") or "9999-12-31", task.get("sortOrder", 0)))[:8],
        "datedActiveTasks": sorted(overdue_or_due_tasks, key=lambda task: (task.get("dueDate") or "9999-12-31", task.get("sortOrder", 0)))[:5],
    }


def _extract_recent_progress(tasks: list, limit: int = 8) -> list:
    progress_items = []
    for task in tasks:
        task_id = task.get("id")
        if not task_id:
            continue
        progress = _backend_get(f"/api/private/learning/tasks/{task_id}/progress")
        if _is_error(progress):
            continue
        for item in _as_list(progress):
            progress_items.append({
                "taskId": task_id,
                "taskTitle": task.get("title", ""),
                "minutesSpent": item.get("minutesSpent", 0),
                "note": item.get("note", ""),
                "loggedAt": item.get("loggedAt", ""),
            })
    return sorted(progress_items, key=lambda item: item.get("loggedAt", ""), reverse=True)[:limit]


@tool
def get_learning_profile() -> dict:
    """获取用户的学习画像，包含背景、技能水平、弱点领域等信息。"""
    return _backend_get("/api/private/learning/profile")


@tool
def get_learning_goals() -> dict:
    """获取用户的学习目标列表，包含每个目标的标题、优先级和状态。"""
    return _backend_get("/api/private/learning/goals")


@tool
def get_learning_plans() -> dict:
    """获取用户的学习计划列表。"""
    return _backend_get("/api/private/learning/plans")


@tool
def get_public_skills() -> dict:
    """获取用户公开技能列表，包含技能名称、分类、熟练度和描述。"""
    return _backend_get("/api/public/skills")


@tool
def diagnose_current_state() -> dict:
    """聚合画像、目标、技能、计划、任务和进度，诊断用户当前学习状态。"""
    profile = _backend_get("/api/private/learning/profile")
    goals = _backend_get("/api/private/learning/goals")
    plans = _backend_get("/api/private/learning/plans")
    skills = _backend_get("/api/public/skills")

    errors = {}
    for key, value in {
        "profile": profile,
        "goals": goals,
        "plans": plans,
        "skills": skills,
    }.items():
        if _is_error(value):
            errors[key] = value["error"]

    goal_list = _as_list(goals)
    plan_list = _as_list(plans)
    skill_list = _as_list(skills)
    active_goals = _pick_active_goals(goal_list)
    active_plans = [plan for plan in plan_list if plan.get("status") in {"active", "draft"}]

    all_tasks = []
    tasks_by_plan = []
    for plan in active_plans[:5]:
        plan_id = plan.get("id")
        if not plan_id:
            continue
        tasks = _backend_get(f"/api/private/learning/plans/{plan_id}/tasks")
        if _is_error(tasks):
            errors[f"plan:{plan_id}:tasks"] = tasks["error"]
            continue
        task_list = _as_list(tasks)
        all_tasks.extend(task_list)
        tasks_by_plan.append({
            "planId": plan_id,
            "planTitle": plan.get("title", ""),
            "planStatus": plan.get("status", ""),
            "taskSummary": _summarize_tasks(task_list),
        })

    skill_categories = Counter(_nonnull_text(skill.get("category")) or "uncategorized" for skill in skill_list)
    proficiency_counts = Counter(_nonnull_text(skill.get("proficiencyLevel")) or "unknown" for skill in skill_list)
    recent_progress = _extract_recent_progress(all_tasks)

    missing_context = []
    if _is_error(profile) or not profile:
        missing_context.append("learning_profile")
    else:
        for field in ["targetRole", "skillSummary", "weaknessSummary", "learningPreference"]:
            if not _nonnull_text(profile.get(field)):
                missing_context.append(f"learning_profile.{field}")
    if not goal_list:
        missing_context.append("learning_goals")
    if not skill_list:
        missing_context.append("public_skills")
    if not plan_list:
        missing_context.append("learning_plans")
    if plan_list and not all_tasks:
        missing_context.append("learning_tasks")
    if all_tasks and not recent_progress:
        missing_context.append("learning_progress")

    return {
        "profile": {} if _is_error(profile) else profile,
        "activeGoals": active_goals,
        "goalSummary": {
            "total": len(goal_list),
            "statusCounts": dict(Counter(goal.get("status", "unknown") for goal in goal_list)),
            "topGoals": active_goals,
        },
        "skillSummary": {
            "total": len(skill_list),
            "categoryCounts": dict(skill_categories),
            "proficiencyCounts": dict(proficiency_counts),
            "skills": skill_list[:20],
        },
        "planSummary": {
            "total": len(plan_list),
            "statusCounts": dict(Counter(plan.get("status", "unknown") for plan in plan_list)),
            "activePlans": active_plans[:5],
            "tasksByPlan": tasks_by_plan,
            "overallTaskSummary": _summarize_tasks(all_tasks),
            "recentProgress": recent_progress,
        },
        "missingContext": missing_context,
        "errors": errors,
        "diagnosisGuide": [
            "先说明你基于哪些真实数据完成诊断。",
            "按已掌握、正在推进、卡点风险、目标差距、下一步建议五段输出。",
            "如果 missingContext 不为空，先指出缺失数据并追问最少必要信息，不要假装已了解。",
            "制定计划前必须先完成当前状态诊断。",
        ],
    }


@tool
def create_learning_plan(title: str, description: str = "", goal_id: int = 0, start_date: str = "", end_date: str = "") -> dict:
    """创建新的学习计划。

    Args:
        title: 计划标题
        description: 计划描述
        goal_id: 关联的学习目标 ID（可选）
        start_date: 开始日期 YYYY-MM-DD（可选）
        end_date: 结束日期 YYYY-MM-DD（可选）
    """
    body = {"title": title, "description": description, "source": "ai_generated", "status": "draft"}
    if goal_id:
        body["goalId"] = goal_id
    if start_date:
        body["startDate"] = start_date
    if end_date:
        body["endDate"] = end_date
    return _backend_post("/api/private/learning/plans", body)


@tool
def create_learning_task(plan_id: int, title: str, description: str = "", task_type: str = "learning", estimated_minutes: int = 60, sort_order: int = 0) -> dict:
    """为学习计划创建新任务。

    Args:
        plan_id: 学习计划 ID
        title: 任务标题
        description: 任务描述
        task_type: 任务类型（learning/practice/review/project）
        estimated_minutes: 预估耗时（分钟）
        sort_order: 排序序号
    """
    body = {
        "title": title,
        "description": description,
        "taskType": task_type,
        "estimatedMinutes": estimated_minutes,
        "sortOrder": sort_order,
    }
    return _backend_post(f"/api/private/learning/plans/{plan_id}/tasks", body)


@tool
def update_learning_progress(task_id: int, minutes_spent: int, note: str = "") -> dict:
    """记录学习任务的进度。

    Args:
        task_id: 学习任务 ID
        minutes_spent: 本次花费时间（分钟）
        note: 学习笔记（可选）
    """
    body = {"minutesSpent": minutes_spent}
    if note:
        body["note"] = note
    return _backend_post(f"/api/private/learning/tasks/{task_id}/progress", body)


READ_TOOLS = [
    get_learning_profile,
    get_learning_goals,
    get_learning_plans,
    get_public_skills,
    diagnose_current_state,
]

WRITE_TOOLS = [
    create_learning_plan,
    create_learning_task,
    update_learning_progress,
]

# All tools available to the agent
ALL_TOOLS = READ_TOOLS + WRITE_TOOLS
