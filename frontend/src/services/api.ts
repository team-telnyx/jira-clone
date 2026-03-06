import type { Issue, CreateIssueInput, UpdateIssueInput, ApiResponse, ApiError } from '../types';

const API_BASE_URL = '/api';

class ApiRequestError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  
  if (!response.ok) {
    const error = data as ApiError;
    throw new ApiRequestError(
      error.error?.message ?? 'An error occurred',
      error.error?.code ?? 'UNKNOWN_ERROR',
      error.error?.details
    );
  }
  
  return (data as ApiResponse<T>).data;
}

export async function createIssue(
  projectId: string,
  input: CreateIssueInput
): Promise<Issue> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/issues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  
  return handleResponse<Issue>(response);
}

export async function updateIssue(
  projectId: string,
  issueId: string,
  input: UpdateIssueInput
): Promise<Issue> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/issues/${issueId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  
  return handleResponse<Issue>(response);
}

export async function getIssue(projectId: string, issueId: string): Promise<Issue> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/issues/${issueId}`);
  return handleResponse<Issue>(response);
}
