import { apiFetch } from './client'
import { readAdminAuthCookie, useAuthStore } from '../stores/auth'

interface LoginRequest {
  username: string
  password: string
}

interface LoginResponse {
  accessToken: string
  expiresIn: number
  user: {
    id: number
    username: string
    role: string
    displayName: string
  }
}

export type ProfileVisibility = 'public' | 'private' | 'hidden'

export interface AdminProfile {
  id?: number
  displayName: string
  headline?: string
  bio?: string
  avatarUrl?: string
  currentFocus?: string
  location?: string
  visibility?: ProfileVisibility
}

export type AdminProfilePayload = Omit<AdminProfile, 'id'>

export interface AdminContact {
  id: number
  platform: string
  label: string
  url: string
  icon: string
  isPublic: boolean
  sortOrder: number
}

export interface ContactPayload {
  platform: string
  label?: string
  url?: string
  icon?: string
  isPublic?: boolean
  sortOrder?: number
}

export interface AdminSkill {
  id: number
  name: string
  category: string
  proficiencyLevel: string
  description: string
  isPublic: boolean
  sortOrder: number
}

export interface AdminSkillPayload {
  name: string
  category?: string
  proficiencyLevel?: string
  description?: string
  isPublic?: boolean
  sortOrder?: number
}

export type AdminTimelineType = 'education' | 'work'

export interface AdminTimelineEntry {
  id: number
  entryId: string
  type: AdminTimelineType
  title: string
  organization: string
  location: string
  startDate: string
  endDate: string | null
  description: string
  achievements: string[]
  technologies: string[]
  isPublic: boolean
  sortOrder: number
}

export interface AdminTimelinePayload {
  entryId?: string
  type?: AdminTimelineType
  title?: string
  organization?: string
  location?: string
  startDate?: string
  endDate?: string
  description?: string
  achievements?: string[]
  technologies?: string[]
  isPublic?: boolean
  sortOrder?: number
}

export type SiteConfigValueType = 'string' | 'json' | 'boolean' | 'number'

export interface SiteConfigItem {
  key: string
  value: string
  valueType: SiteConfigValueType
  description: string
}

export interface UpsertSiteConfigPayload {
  value: string
  valueType?: SiteConfigValueType
  description?: string
}

function getAdminToken() {
  return useAuthStore.getState().token || readAdminAuthCookie() || ''
}

export function login(data: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAdminToken()
  return apiFetch<T>(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

export function getAdminProfile() {
  return adminFetch<AdminProfile>('/api/admin/profile', {
    cache: 'no-store',
  })
}

export function updateAdminProfile(payload: AdminProfilePayload) {
  return adminFetch<AdminProfile>('/api/admin/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function getAdminContacts(): Promise<AdminContact[]> {
  return adminFetch<AdminContact[]>('/api/admin/contacts', {
    cache: 'no-store',
  })
}

export function createAdminContact(payload: ContactPayload): Promise<AdminContact> {
  return adminFetch<AdminContact>('/api/admin/contacts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateAdminContact(
  id: number,
  payload: ContactPayload,
): Promise<AdminContact> {
  return adminFetch<AdminContact>(`/api/admin/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteAdminContact(id: number): Promise<{ id: number }> {
  return adminFetch<{ id: number }>(`/api/admin/contacts/${id}`, {
    method: 'DELETE',
  })
}

export function getAdminSkills(): Promise<AdminSkill[]> {
  return adminFetch<AdminSkill[]>('/api/admin/skills', {
    cache: 'no-store',
  })
}

export function createAdminSkill(payload: AdminSkillPayload): Promise<AdminSkill> {
  return adminFetch<AdminSkill>('/api/admin/skills', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateAdminSkill(
  id: number,
  payload: AdminSkillPayload,
): Promise<AdminSkill> {
  return adminFetch<AdminSkill>(`/api/admin/skills/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteAdminSkill(id: number): Promise<{ id: number }> {
  return adminFetch<{ id: number }>(`/api/admin/skills/${id}`, {
    method: 'DELETE',
  })
}

export function getAdminTimeline(): Promise<AdminTimelineEntry[]> {
  return adminFetch<AdminTimelineEntry[]>('/api/admin/about/timeline', {
    cache: 'no-store',
  })
}

export function createAdminTimeline(
  payload: AdminTimelinePayload,
): Promise<AdminTimelineEntry> {
  return adminFetch<AdminTimelineEntry>('/api/admin/about/timeline', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateAdminTimeline(
  id: number,
  payload: AdminTimelinePayload,
): Promise<AdminTimelineEntry> {
  return adminFetch<AdminTimelineEntry>(`/api/admin/about/timeline/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteAdminTimeline(id: number): Promise<{ id: number }> {
  return adminFetch<{ id: number }>(`/api/admin/about/timeline/${id}`, {
    method: 'DELETE',
  })
}

export function getAdminSiteConfig(): Promise<SiteConfigItem[]> {
  return adminFetch<SiteConfigItem[]>('/api/admin/site-config', {
    cache: 'no-store',
  })
}

export function upsertAdminSiteConfig(
  key: string,
  payload: UpsertSiteConfigPayload,
): Promise<SiteConfigItem> {
  return adminFetch<SiteConfigItem>(
    `/api/admin/site-config/${encodeURIComponent(key)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  )
}

// --- portfolio project ---

export interface AdminProject {
  id: number
  slug: string
  title: string
  shortDescription: string
  longDescription: string
  problem: string
  solution: string
  challenges: string
  results: string
  technologies: string[]
  githubUrl: string
  demoUrl: string
  featuredImage: string
  gallery: string[]
  publishedAt: string | null
  featured: boolean
  isPublic: boolean
  sortOrder: number
}

export interface AdminProjectPayload {
  slug?: string
  title?: string
  shortDescription?: string
  longDescription?: string
  problem?: string
  solution?: string
  challenges?: string
  results?: string
  technologies?: string[]
  githubUrl?: string
  demoUrl?: string
  featuredImage?: string
  gallery?: string[]
  publishedAt?: string
  featured?: boolean
  isPublic?: boolean
  sortOrder?: number
}

export function getAdminProjects(): Promise<AdminProject[]> {
  return adminFetch<AdminProject[]>('/api/admin/projects', {
    cache: 'no-store',
  })
}

export function createAdminProject(payload: AdminProjectPayload): Promise<AdminProject> {
  return adminFetch<AdminProject>('/api/admin/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateAdminProject(
  id: number,
  payload: AdminProjectPayload,
): Promise<AdminProject> {
  return adminFetch<AdminProject>(`/api/admin/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteAdminProject(id: number): Promise<{ id: number }> {
  return adminFetch<{ id: number }>(`/api/admin/projects/${id}`, {
    method: 'DELETE',
  })
}