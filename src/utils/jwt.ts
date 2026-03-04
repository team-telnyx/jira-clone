// JWT utility functions

interface JWTPayload {
  exp?: number
  [key: string]: unknown
}

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USER_KEY = 'auth_user'

/**
 * Decode a JWT token and extract the payload
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    const payload = parts[1]
    const decoded = atob(payload)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Check if a JWT token is expired
 * @param token JWT token string
 * @returns true if token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload || !payload.exp) {
    return true
  }
  const currentTime = Math.floor(Date.now() / 1000)
  return payload.exp < currentTime
}

/**
 * Validate JWT format (header.payload.signature)
 * @param token JWT token string
 * @returns true if valid format, false otherwise
 */
export function isValidJWTFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }
  const parts = token.split('.')
  return parts.length === 3 && parts.every((part) => part.length > 0)
}

/**
 * Get the stored auth token from localStorage
 * @returns Token string or null
 */
export function getStoredToken(): string | null {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (token && isValidJWTFormat(token) && !isTokenExpired(token)) {
      return token
    }
    // Clear invalid/expired token
    if (token) {
      clearStoredAuth()
    }
    return null
  } catch {
    return null
  }
}

/**
 * Get the stored user from localStorage
 * @returns User object or null
 */
export function getStoredUser<T>(): T | null {
  try {
    const userStr = localStorage.getItem(AUTH_USER_KEY)
    if (userStr) {
      return JSON.parse(userStr) as T
    }
    return null
  } catch {
    return null
  }
}

/**
 * Store auth token in localStorage
 * @param token JWT token string
 */
export function storeToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

/**
 * Store user in localStorage
 * @param user User object
 */
export function storeUser<T>(user: T): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

/**
 * Clear all auth data from localStorage
 */
export function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export { AUTH_TOKEN_KEY, AUTH_USER_KEY }
