const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080'

export class ApiError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface ApiResponse<T> {
  code: number
  message: string
  data: T
  traceId: string
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`

  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const json: ApiResponse<T> = await response.json()

  if (json.code !== 0) {
    throw new ApiError(json.code, json.message)
  }

  return json.data
}
