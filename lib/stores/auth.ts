import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  username: string
  role: string
}

interface AuthState {
  token: string
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
}

export const ADMIN_AUTH_COOKIE = 'admin-token'
export const ADMIN_AUTH_STORAGE_KEY = 'admin-auth'

export function setAdminAuthCookie(token: string, maxAge: number) {
  document.cookie = `${ADMIN_AUTH_COOKIE}=${token}; path=/; max-age=${maxAge}; sameSite=lax`
}

export function clearAdminAuthCookie() {
  document.cookie = `${ADMIN_AUTH_COOKIE}=; path=/; max-age=0; sameSite=lax`
}

export function readAdminAuthCookie() {
  return document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${ADMIN_AUTH_COOKIE}=`))
    ?.split('=')[1]
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: '',
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: '', user: null }),
    }),
    { name: ADMIN_AUTH_STORAGE_KEY },
  ),
)