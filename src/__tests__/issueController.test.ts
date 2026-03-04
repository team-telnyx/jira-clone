import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import * as IssueModel from '../models/Issue.js';
import * as ProjectModel from '../models/Project.js';
import { SEED_PROJECT_1_ID } from '../models/Project.js';
import * as UserModel from '../models/User.js';
import { SEED_USER_1_ID, SEED_USER_2_ID } from '../models/User.js';

const BASE_URL = '/api/projects';
const PROJECT_ID = SEED_PROJECT_1_ID;
const USER_1_ID = SEED_USER_1_ID;
const USER_2_ID = SEED_USER_2_ID;

describe('Issue Controller Integration Tests', () => {
  beforeEach(() => {
    IssueModel.clearIssues();
  });

  describe('GET /api/projects/:projectId/issues - List Issues', () => {
    it('TC-1: should return paginated list of issues', async () => {
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Issue 1',
        type: 'bug',
        reporterId: USER_1_ID,
      });
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Issue 2',
        type: 'task',
        reporterId: USER_1_ID,
      });

      const response = await request(app)
        .get(`${BASE_URL}/${PROJECT_ID}/issues`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.totalPages).toBe(1);
    });

    it('TC-2: should filter issues by status', async () => {
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Backlog Issue',
        type: 'bug',
        status: 'backlog',
        reporterId: USER_1_ID,
      });
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'In Progress Issue',
        type: 'task',
        status: 'in_progress',
        reporterId: USER_1_ID,
      });

      const response = await request(app)
        .get(`${BASE_URL}/${PROJECT_ID}/issues?status=in_progress`)
        .expect(200);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].status).toBe('in_progress');
    });

    it('TC-3: should filter issues by priority', async () => {
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'High Priority',
        type: 'bug',
        priority: 'high',
        reporterId: USER_1_ID,
      });
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Low Priority',
        type: 'task',
        priority: 'low',
        reporterId: USER_1_ID,
      });

      const response = await request(app)
        .get(`${BASE_URL}/${PROJECT_ID}/issues?priority=high`)
        .expect(200);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].priority).toBe('high');
    });

    it('TC-4: should filter by type and assignee', async () => {
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Bug by user-2',
        type: 'bug',
        reporterId: USER_1_ID,
        assigneeId: USER_2_ID,
      });
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Story by user-1',
        type: 'story',
        reporterId: USER_1_ID,
        assigneeId: USER_1_ID,
      });

      const typeResponse = await request(app)
        .get(`${BASE_URL}/${PROJECT_ID}/issues?type=bug`)
        .expect(200);
      expect(typeResponse.body.data.data).toHaveLength(1);
      expect(typeResponse.body.data.data[0].type).toBe('bug');

      const assigneeResponse = await request(app)
        .get(`${BASE_URL}/${PROJECT_ID}/issues?assigneeId=${USER_2_ID}`)
        .expect(200);
      expect(assigneeResponse.body.data.data).toHaveLength(1);
      expect(assigneeResponse.body.data.data[0].assigneeId).toBe(USER_2_ID);
    });

    it('TC-5: should search issues by query parameter', async () => {
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Critical login bug',
        type: 'bug',
        reporterId: USER_1_ID,
      });
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Database optimization',
        type: 'task',
        description: 'Fix login performance',
        reporterId: USER_1_ID,
      });
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Update documentation',
        type: 'story',
        reporterId: USER_1_ID,
      });

      const response = await request(app)
        .get(`${BASE_URL}/${PROJECT_ID}/issues?q=login`)
        .expect(200);

      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.data.some((i: { title: string }) => i.title.includes('login'))).toBe(true);
    });

    it('TC-6: should sort by priority ascending and descending', async () => {
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Low Priority',
        type: 'bug',
        priority: 'low',
        reporterId: USER_1_ID,
      });
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'High Priority',
        type: 'bug',
        priority: 'high',
        reporterId: USER_1_ID,
      });
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Medium Priority',
        type: 'bug',
        priority: 'medium',
        reporterId: USER_1_ID,
      });

      const descResponse = await request(app)
        .get(`${BASE_URL}/${PROJECT_ID}/issues?sortBy=priority&sortOrder=desc`)
        .expect(200);

      expect(descResponse.body.data.data[0].priority).toBe('high');
      expect(descResponse.body.data.data[2].priority).toBe('low');

      const ascResponse = await request(app)
        .get(`${BASE_URL}/${PROJECT_ID}/issues?sortBy=priority&sortOrder=asc`)
        .expect(200);

      expect(ascResponse.body.data.data[0].priority).toBe('low');
      expect(ascResponse.body.data.data[2].priority).toBe('high');
    });
  });

  describe('GET /api/projects/:projectId/issues/:issueId - Get Single Issue', () => {
    it('TC-7: should return single issue by UUID', async () => {
      const issue = IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: USER_1_ID,
      });

      const response = await request(app)
        .get(`${BASE_URL}/${PROJECT_ID}/issues/${issue.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(issue.id);
      expect(response.body.data.issueKey).toBe('TEST-1');
    });

    it('TC-8: should return issue by issue key format', async () => {
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: USER_1_ID,
      });

      const response = await request(app)
        .get(`${BASE_URL}/${PROJECT_ID}/issues/TEST-1`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.issueKey).toBe('TEST-1');
    });

    it('TC-9: should populate assignee and reporter user data', async () => {
      const issue = IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: USER_1_ID,
        assigneeId: USER_2_ID,
      });

      const response = await request(app)
        .get(`${BASE_URL}/${PROJECT_ID}/issues/${issue.id}`)
        .expect(200);

      expect(response.body.data.reporter).toBeDefined();
      expect(response.body.data.reporter.id).toBe(USER_1_ID);
      expect(response.body.data.reporter.name).toBe('John Doe');
      expect(response.body.data.assignee).toBeDefined();
      expect(response.body.data.assignee.id).toBe(USER_2_ID);
      expect(response.body.data.assignee.name).toBe('Jane Smith');
    });
  });

  describe('POST /api/projects/:projectId/issues - Create Issue', () => {
    it('TC-10: should create new issue with required fields', async () => {
      const payload = {
        title: 'New Bug',
        type: 'bug',
        reporterId: USER_1_ID,
      };

      const response = await request(app)
        .post(`${BASE_URL}/${PROJECT_ID}/issues`)
        .send(payload)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Bug');
      expect(response.body.data.type).toBe('bug');
      expect(response.body.data.status).toBe('backlog');
      expect(response.body.data.priority).toBe('medium');
    });

    it('TC-11: should auto-generate sequential issue key', async () => {
      const project2 = ProjectModel.createProject({ name: 'Another', prefix: 'NEW' });
      ProjectModel.addProjectMember(project2.id, USER_1_ID);

      const response1 = await request(app)
        .post(`${BASE_URL}/${PROJECT_ID}/issues`)
        .send({ title: 'Issue 1', type: 'bug', reporterId: USER_1_ID })
        .expect(201);

      const response2 = await request(app)
        .post(`${BASE_URL}/${PROJECT_ID}/issues`)
        .send({ title: 'Issue 2', type: 'bug', reporterId: USER_1_ID })
        .expect(201);

      const response3 = await request(app)
        .post(`${BASE_URL}/${project2.id}/issues`)
        .send({ title: 'New Proj Issue', type: 'bug', reporterId: USER_1_ID })
        .expect(201);

      expect(response1.body.data.issueKey).toBe('TEST-1');
      expect(response2.body.data.issueKey).toBe('TEST-2');
      expect(response3.body.data.issueKey).toBe('NEW-1');
    });

    it('TC-12: should validate reporter exists', async () => {
      const payload = {
        title: 'New Issue',
        type: 'bug',
        reporterId: '00000000-0000-0000-0000-000000000099',
      };

      const response = await request(app)
        .post(`${BASE_URL}/${PROJECT_ID}/issues`)
        .send(payload)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('TC-13: should allow any user to be reporter', async () => {
      const payload = {
        title: 'New Issue',
        type: 'bug',
        reporterId: USER_1_ID,
        assigneeId: USER_2_ID,
      };

      const response = await request(app)
        .post(`${BASE_URL}/${PROJECT_ID}/issues`)
        .send(payload)
        .expect(201);

      expect(response.body.data.reporterId).toBe(USER_1_ID);
      expect(response.body.data.assigneeId).toBe(USER_2_ID);
    });

    it('TC-14: should escape HTML in description to prevent XSS', async () => {
      const payload = {
        title: 'XSS Test',
        type: 'bug',
        description: '<script>alert("xss")</script>',
        reporterId: USER_1_ID,
      };

      const response = await request(app)
        .post(`${BASE_URL}/${PROJECT_ID}/issues`)
        .send(payload)
        .expect(201);

      expect(response.body.data.description).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });
  });

  describe('PUT /api/projects/:projectId/issues/:issueId - Update Issue', () => {
    it('TC-15: should update issue status', async () => {
      const issue = IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Original Title',
        type: 'bug',
        status: 'backlog',
        reporterId: USER_1_ID,
      });

      const response = await request(app)
        .put(`${BASE_URL}/${PROJECT_ID}/issues/${issue.id}`)
        .send({ status: 'in_progress' })
        .expect(200);

      expect(response.body.data.status).toBe('in_progress');
      expect(response.body.data.title).toBe('Original Title');
    });

    it('TC-16: should support partial updates', async () => {
      const issue = IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Original',
        type: 'bug',
        priority: 'low',
        reporterId: USER_1_ID,
      });

      const response = await request(app)
        .put(`${BASE_URL}/${PROJECT_ID}/issues/${issue.id}`)
        .send({ priority: 'high' })
        .expect(200);

      expect(response.body.data.priority).toBe('high');
      expect(response.body.data.title).toBe('Original');
      expect(response.body.data.type).toBe('bug');
    });

    it('TC-17: should allow unassign by setting assigneeId to null', async () => {
      const issue = IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Assigned Issue',
        type: 'bug',
        reporterId: USER_1_ID,
        assigneeId: USER_2_ID,
      });

      const response = await request(app)
        .put(`${BASE_URL}/${PROJECT_ID}/issues/${issue.id}`)
        .send({ assigneeId: null })
        .expect(200);

      expect(response.body.data.assigneeId).toBeUndefined();
    });

    it('TC-18: should validate assignee is project member on update', async () => {
      const issue = IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: USER_1_ID,
      });

      const newUser = UserModel.createUser({ email: 'new@example.com', name: 'New User' });

      const response = await request(app)
        .put(`${BASE_URL}/${PROJECT_ID}/issues/${issue.id}`)
        .send({ assigneeId: newUser.id })
        .expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toContain('project');
    });
  });

  describe('DELETE /api/projects/:projectId/issues/:issueId - Delete Issue', () => {
    it('TC-19: should soft delete issue and return 204', async () => {
      const issue = IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'To Delete',
        type: 'bug',
        reporterId: USER_1_ID,
      });

      await request(app)
        .delete(`${BASE_URL}/${PROJECT_ID}/issues/${issue.id}`)
        .expect(204);
    });

    it('TC-20: should not return deleted issue in subsequent GET', async () => {
      const issue = IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'To Delete',
        type: 'bug',
        reporterId: USER_1_ID,
      });

      await request(app)
        .delete(`${BASE_URL}/${PROJECT_ID}/issues/${issue.id}`);

      const response = await request(app)
        .get(`${BASE_URL}/${PROJECT_ID}/issues/${issue.id}`)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Error Handling - EC-1: Not Found Scenarios', () => {
    it('TC-21: should return 404 when project not found', async () => {
      const response = await request(app)
        .get(`${BASE_URL}/non-existent-project/issues`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('Project');
    });

    it('TC-22: should return 404 when issue not found', async () => {
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Existing Issue',
        type: 'bug',
        reporterId: USER_1_ID,
      });

      const response = await request(app)
        .get(`${BASE_URL}/${PROJECT_ID}/issues/NON-EXISTENT-ISSUE`)
        .expect(404);

      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('Issue');
    });
  });

  describe('Error Handling - EC-2: Validation Errors', () => {
    it('TC-23: should return 400 for missing required fields', async () => {
      const payload = {
        reporterId: USER_1_ID,
      };

      const response = await request(app)
        .post(`${BASE_URL}/${PROJECT_ID}/issues`)
        .send(payload)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.errors).toBeDefined();
    });

    it('TC-24: should return 400 for title exceeding 255 characters', async () => {
      const payload = {
        title: 'a'.repeat(256),
        type: 'bug',
        reporterId: USER_1_ID,
      };

      const response = await request(app)
        .post(`${BASE_URL}/${PROJECT_ID}/issues`)
        .send(payload)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('TC-25: should return 400 for description exceeding 5000 characters', async () => {
      const payload = {
        title: 'Valid Title',
        type: 'bug',
        description: 'a'.repeat(5001),
        reporterId: USER_1_ID,
      };

      const response = await request(app)
        .post(`${BASE_URL}/${PROJECT_ID}/issues`)
        .send(payload)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('TC-26: should return 400 for invalid UUID formats', async () => {
      const payload = {
        title: 'Test Issue',
        type: 'bug',
        reporterId: 'not-a-valid-uuid',
      };

      const response = await request(app)
        .post(`${BASE_URL}/${PROJECT_ID}/issues`)
        .send(payload)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('TC-27: should return 400 for invalid enum values', async () => {
      const payload = {
        title: 'Test Issue',
        type: 'invalid-type',
        reporterId: USER_1_ID,
      };

      const response = await request(app)
        .post(`${BASE_URL}/${PROJECT_ID}/issues`)
        .send(payload)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Error Handling - EC-3: Authorization & User Errors', () => {
    it('TC-28: should return 403 when assignee not project member', async () => {
      const newUser = UserModel.createUser({ email: 'external@example.com', name: 'External User' });
      
      const payload = {
        title: 'Test Issue',
        type: 'bug',
        reporterId: USER_1_ID,
        assigneeId: newUser.id,
      };

      const response = await request(app)
        .post(`${BASE_URL}/${PROJECT_ID}/issues`)
        .send(payload)
        .expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');
      expect(response.body.error.message).toContain('project');
    });

    it('TC-29: should return 400 when reporter not found', async () => {
      const payload = {
        title: 'Test Issue',
        type: 'bug',
        reporterId: '00000000-0000-0000-0000-000000000099',
      };

      const response = await request(app)
        .post(`${BASE_URL}/${PROJECT_ID}/issues`)
        .send(payload)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('TC-30: should return 400 when assignee not found on update', async () => {
      const issue = IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: USER_1_ID,
      });

      const response = await request(app)
        .put(`${BASE_URL}/${PROJECT_ID}/issues/${issue.id}`)
        .send({ assigneeId: '00000000-0000-0000-0000-000000000099' })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Edge Cases - EC-4: Pagination Limits', () => {
    it('TC-31: should cap limit at 100 maximum', async () => {
      for (let i = 0; i < 5; i++) {
        IssueModel.createIssue(PROJECT_ID, 'TEST', {
          title: `Issue ${i}`,
          type: 'bug',
          reporterId: USER_1_ID,
        });
      }

      const response = await request(app)
        .get(`${BASE_URL}/${PROJECT_ID}/issues?limit=500`)
        .expect(200);

      expect(response.body.data.data.length).toBeLessThanOrEqual(100);
    });

    it('should use default pagination when not provided', async () => {
      for (let i = 0; i < 15; i++) {
        IssueModel.createIssue(PROJECT_ID, 'TEST', {
          title: `Issue ${i}`,
          type: 'bug',
          reporterId: USER_1_ID,
        });
      }

      const response = await request(app)
        .get(`${BASE_URL}/${PROJECT_ID}/issues`)
        .expect(200);

      expect(response.body.data.page).toBe(1);
      expect(response.body.data.data.length).toBe(10);
      expect(response.body.data.totalPages).toBe(2);
    });
  });
});
