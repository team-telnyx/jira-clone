import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { updateIssueStatus } from '../api/issues';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('Issues API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('updateIssueStatus', () => {
    it('should successfully update issue status via API', async () => {
      const mockResponse = {
        id: 'ISSUE-1',
        title: 'Fix login',
        status: 'DONE',
        updatedAt: '2024-01-15T10:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await updateIssueStatus('ISSUE-1', 'DONE');

      expect(mockFetch).toHaveBeenCalledWith('/api/issues/ISSUE-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'DONE' }),
      });
      expect(result).toEqual(mockResponse);
      expect(result.status).toBe('DONE');
    });

    it('should reject with error on failed API call', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(updateIssueStatus('ISSUE-1', 'DONE')).rejects.toThrow(
        'Failed to update issue status'
      );
    });

    it('should reject with error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(updateIssueStatus('ISSUE-1', 'DONE')).rejects.toThrow(
        'Network error'
      );
    });

    it('should include correct request payload for different statuses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'ISSUE-1', status: 'TODO' }),
      });

      await updateIssueStatus('ISSUE-1', 'TODO');
      expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
        status: 'TODO',
      });

      await updateIssueStatus('ISSUE-1', 'IN_PROGRESS');
      expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toEqual({
        status: 'IN_PROGRESS',
      });

      await updateIssueStatus('ISSUE-1', 'DONE');
      expect(JSON.parse(mockFetch.mock.calls[2][1].body)).toEqual({
        status: 'DONE',
      });
    });
  });
});
