import { adminFetch } from './admin'
import { ApiError } from './client'
import { readAdminAuthCookie, useAuthStore } from '../stores/auth'

const AGENT_BASE = process.env.NEXT_PUBLIC_AGENT_SERVICE_URL ?? 'http://localhost:8000'

function getAgentToken() {
  return useAuthStore.getState().token || readAdminAuthCookie() || ''
}

async function agentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAgentToken()
  const response = await fetch(`${AGENT_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: init?.cache ?? 'no-store',
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    const message =
      (payload && typeof payload.detail === 'string' && payload.detail) ||
      (payload && typeof payload.message === 'string' && payload.message) ||
      `HTTP ${response.status}`

    throw new ApiError(response.status, message)
  }

  return payload as T
}

export interface LearningProfile {
  id: number
  targetRole: string
  backgroundSummary: string
  skillSummary: string
  weaknessSummary: string
  learningPreference: string
  resumeSnapshot: string
}

export interface LearningGoal {
  id: number
  title: string
  description: string
  goalType: string
  priority: number
  deadline: string | null
  status: string
  progressPercent: number
}

export function getLearningProfile(): Promise<LearningProfile> {
  return adminFetch<LearningProfile>('/api/private/learning/profile', {
    cache: 'no-store',
  })
}

export function updateLearningProfile(data: Partial<LearningProfile>): Promise<LearningProfile> {
  return adminFetch<LearningProfile>('/api/private/learning/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function getLearningGoals(): Promise<LearningGoal[]> {
  return adminFetch<LearningGoal[]>('/api/private/learning/goals', {
    cache: 'no-store',
  })
}

export function createLearningGoal(data: Partial<LearningGoal>): Promise<LearningGoal> {
  return adminFetch<LearningGoal>('/api/private/learning/goals', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateLearningGoal(id: number, data: Partial<LearningGoal>): Promise<LearningGoal> {
  return adminFetch<LearningGoal>(`/api/private/learning/goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteLearningGoal(id: number): Promise<{ id: number }> {
  return adminFetch<{ id: number }>(`/api/private/learning/goals/${id}`, {
    method: 'DELETE',
  })
}

export interface LearningPlan {
  id: number
  goalId: number | null
  title: string
  description: string
  source: string
  status: string
  startDate: string | null
  endDate: string | null
  totalTasks: number
  completedTasks: number
}

export interface LearningTask {
  id: number
  planId: number
  title: string
  description: string
  taskType: string
  status: string
  priority: number
  estimatedMinutes: number
  actualMinutes: number
  dueDate: string | null
  completedAt: string | null
  sortOrder: number
}

export interface LearningProgress {
  id: number
  taskId: number
  minutesSpent: number
  note: string
  loggedAt: string
}

export interface GeneratedPlan {
  plan: {
    title: string
    description: string
    startDate: string
    endDate: string
  }
  tasks: {
    title: string
    description: string
    taskType: string
    estimatedMinutes: number
    sortOrder: number
  }[]
}

export function getLearningPlans(): Promise<LearningPlan[]> {
  return adminFetch<LearningPlan[]>('/api/private/learning/plans', {
    cache: 'no-store',
  })
}

export function createLearningPlan(data: Partial<LearningPlan>): Promise<LearningPlan> {
  return adminFetch<LearningPlan>('/api/private/learning/plans', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateLearningPlan(id: number, data: Partial<LearningPlan>): Promise<LearningPlan> {
  return adminFetch<LearningPlan>(`/api/private/learning/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteLearningPlan(id: number): Promise<{ id: number }> {
  return adminFetch<{ id: number }>(`/api/private/learning/plans/${id}`, {
    method: 'DELETE',
  })
}

export function generateLearningPlan(goalId: number, preferences?: string): Promise<GeneratedPlan> {
  return adminFetch<GeneratedPlan>('/api/private/learning/plans/generate', {
    method: 'POST',
    body: JSON.stringify({ goalId, preferences }),
  })
}

export function getPlanTasks(planId: number): Promise<LearningTask[]> {
  return adminFetch<LearningTask[]>(`/api/private/learning/plans/${planId}/tasks`, {
    cache: 'no-store',
  })
}

export function createTask(planId: number, data: Partial<LearningTask>): Promise<LearningTask> {
  return adminFetch<LearningTask>(`/api/private/learning/plans/${planId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateTask(id: number, data: Partial<LearningTask>): Promise<LearningTask> {
  return adminFetch<LearningTask>(`/api/private/learning/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteTask(id: number): Promise<{ id: number }> {
  return adminFetch<{ id: number }>(`/api/private/learning/tasks/${id}`, {
    method: 'DELETE',
  })
}

export function getTaskProgress(taskId: number): Promise<LearningProgress[]> {
  return adminFetch<LearningProgress[]>(`/api/private/learning/tasks/${taskId}/progress`, {
    cache: 'no-store',
  })
}

export function logTaskProgress(taskId: number, data: { minutesSpent: number; note?: string }): Promise<LearningProgress> {
  return adminFetch<LearningProgress>(`/api/private/learning/tasks/${taskId}/progress`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export interface AgentConversation {
  id: number
  title: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface AgentHistoryMessage {
  id: number
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolCalls?: Array<Record<string, unknown>> | null
  createdAt: string
}

export interface AgentHistoryResponse {
  messages: AgentHistoryMessage[]
  hasMore?: boolean
  nextBeforeId?: number | null
}

export function getAgentConversations(): Promise<AgentConversation[]> {
  return adminFetch<AgentConversation[]>('/api/private/agent/conversations', {
    cache: 'no-store',
  })
}

export function deleteAgentConversation(id: number): Promise<{ id: number }> {
  return adminFetch<{ id: number }>(`/api/private/agent/conversations/${id}`, {
    method: 'DELETE',
  })
}

export function getAgentConversationHistory(
  conversationId: number,
  params?: { limit?: number; beforeId?: number | null },
): Promise<AgentHistoryResponse> {
  const search = new URLSearchParams()

  if (params?.limit) {
    search.set('limit', String(params.limit))
  }

  if (params?.beforeId) {
    search.set('before_id', String(params.beforeId))
  }

  const query = search.toString()
  return agentFetch<AgentHistoryResponse>(
    `/api/chat/history/${conversationId}${query ? `?${query}` : ''}`,
  )
}
