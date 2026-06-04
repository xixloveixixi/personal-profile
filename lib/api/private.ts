import { adminFetch } from './admin'

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
