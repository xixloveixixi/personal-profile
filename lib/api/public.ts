import { apiFetch } from './client'

export interface PublicProfile {
  id: number
  displayName: string
  headline: string
  bio: string
  avatarUrl: string
  currentFocus: string
  location: string
  visibility: string
}

export interface PublicContact {
  id: number
  platform: string
  label: string
  url: string
  icon: string
  sortOrder: number
}

export interface PublicSkill {
  id: number
  name: string
  category: string
  proficiencyLevel: string
  description: string
  sortOrder: number
}

export interface SiteConfigItem {
  configKey: string
  configValue: string
  valueType: string
  description: string
}

export function getPublicProfile(): Promise<PublicProfile> {
  return apiFetch<PublicProfile>('/api/public/profile', {
    cache: 'no-store',
  })
}

export function getPublicContacts(): Promise<PublicContact[]> {
  return apiFetch<PublicContact[]>('/api/public/contacts', {
    cache: 'no-store',
  })
}

export function getPublicSkills(): Promise<PublicSkill[]> {
  return apiFetch<PublicSkill[]>('/api/public/skills', {
    cache: 'no-store',
  })
}

export function getSiteConfig(): Promise<SiteConfigItem[]> {
  return apiFetch<SiteConfigItem[]>('/api/public/site-config', {
    cache: 'no-store',
  })
}
