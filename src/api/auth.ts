// Auth API service

import { apiClient } from './client'
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth'

/**
 * Login user with email and password
 * @param credentials Login credentials
 * @returns AuthResponse with token and user
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
  return response.data
}

/**
 * Register a new user
 * @param data Registration data
 * @returns AuthResponse with token and user
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', data)
  return response.data
}

/**
 * Logout user (optional server-side cleanup)
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout')
  } catch {
    // Ignore logout API errors - we'll clear local state anyway
  }
}
