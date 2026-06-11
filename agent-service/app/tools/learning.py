"""Learning Coach Tools - Read/write learning data via Go backend API."""

import json
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


# All tools available to the agent
ALL_TOOLS = [
    get_learning_profile,
    get_learning_goals,
    get_learning_plans,
    create_learning_plan,
    create_learning_task,
    update_learning_progress,
]
