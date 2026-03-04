import { Issue, IssueStatus } from '../types/issue';

export async function getIssues(): Promise<Issue[]> {
  const response = await fetch('/api/issues');
  if (!response.ok) {
    throw new Error('Failed to fetch issues');
  }
  return response.json();
}

export async function updateIssueStatus(
  issueId: string,
  status: IssueStatus
): Promise<Issue> {
  const response = await fetch(`/api/issues/${issueId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Failed to update issue status');
  }

  return response.json();
}
