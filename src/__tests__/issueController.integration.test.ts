import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import issueRoutes from '../routes/issueRoutes.js';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';
import * as IssueModel from '../models/Issue.js';
import { SEEDED_USER_1_ID, SEEDED_USER_2_ID } from '../models/User.js';

function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use('/api/projects/:projectId/issues', issueRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

const app = createApp();

const PROJECT_ID = 'proj-1';
const NON_EXISTENT_PROJECT = 'non-existent-project';
const REPORTER_ID = SEEDED_USER_1_ID;
const ASSIGNEE_ID = SEEDED_USER_2_ID;

describe('Issues CRUD API Integration Tests', () => {
  beforeEach(() => {
    IssueModel.clearIssues();
  });

  describe('GET /api/projects/:projectId/issues', () => {
    it('should return empty list for project with no issues', async () => {
      const response = await request(app)
        .get(`/api/projects/${PROJECT_ID}/issues`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toEqual([]);
      expect(response.body.data.total).toBe(0);
      expect(response.body.data.page).toBe(1);
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get(`/api/projects/${NON_EXISTENT_PROJECT}/issues`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return paginated results', async () => {
      // Create 5 issues
      for (let i = 0; i < 5; i++) {
        IssueModel.createIssue(PROJECT_ID, 'TEST', {
          title: `Issue ${i + 1}`,
          type: 'task',
          reporterId: REPORTER_ID,
        });
      }

      const response = await request(app)
        .get(`/api/projects/${PROJECT_ID}/issues?page=1&limit=2`)
        .expect(200);

      expect(response.body.data.data.length).toBe(2);
      expect(response.body.data.total).toBe(5);
      expect(response.body.data.totalPages).toBe(3);
    });

    it('should filter by status', async () => {
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Backlog Issue',
        type: 'bug',
        status: 'backlog',
        reporterId: REPORTER_ID,
      });
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'In Progress Issue',
        type: 'bug',
        status: 'in_progress',
        reporterId: REPORTER_ID,
      });

      const response = await request(app)
        .get(`/api/projects/${PROJECT_ID}/issues?status=in_progress`)
        .expect(200);

      expect(response.body.data.data.length).toBe(1);
      expect(response.body.data.data[0].status).toBe('in_progress');
    });

    it('should filter by priority', async () => {
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'High Priority',
        type: 'bug',
        priority: 'high',
        reporterId: REPORTER_ID,
      });
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Low Priority',
        type: 'bug',
        priority: 'low',
        reporterId: REPORTER_ID,
      });

      const response = await request(app)
        .get(`/api/projects/${PROJECT_ID}/issues?priority=high`)
        .expect(200);

      expect(response.body.data.data.length).toBe(1);
      expect(response.body.data.data[0].priority).toBe('high');
    });

    it('should filter by type', async () => {
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Bug Issue',
        type: 'bug',
        reporterId: REPORTER_ID,
      });
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Story Issue',
        type: 'story',
        reporterId: REPORTER_ID,
      });

      const response = await request(app)
        .get(`/api/projects/${PROJECT_ID}/issues?type=bug`)
        .expect(200);

      expect(response.body.data.data.length).toBe(1);
      expect(response.body.data.data[0].type).toBe('bug');
    });

    it('should search by title', async () => {
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Authentication Bug',
        type: 'bug',
        reporterId: REPORTER_ID,
      });
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'UI Enhancement',
        type: 'story',
        reporterId: REPORTER_ID,
      });

      const response = await request(app)
        .get(`/api/projects/${PROJECT_ID}/issues?q=Authentication`)
        .expect(200);

      expect(response.body.data.data.length).toBe(1);
      expect(response.body.data.data[0].title).toContain('Authentication');
    });

    it('should sort by priority descending', async () => {
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Low Priority',
        type: 'bug',
        priority: 'low',
        reporterId: REPORTER_ID,
      });
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'High Priority',
        type: 'bug',
        priority: 'high',
        reporterId: REPORTER_ID,
      });

      const response = await request(app)
        .get(`/api/projects/${PROJECT_ID}/issues?sortBy=priority&sortOrder=desc`)
        .expect(200);

      expect(response.body.data.data[0].priority).toBe('high');
    });
  });

  describe('POST /api/projects/:projectId/issues', () => {
    it('should create issue with required fields', async () => {
      const response = await request(app)
        .post(`/api/projects/${PROJECT_ID}/issues`)
        .send({
          title: 'New Bug',
          type: 'bug',
          reporterId: REPORTER_ID,
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Bug');
      expect(response.body.data.issueKey).toBe('TEST-1');
      expect(response.body.data.status).toBe('backlog');
      expect(response.body.data.priority).toBe('medium');
    });

    it('should auto-generate sequential issue keys', async () => {
      await request(app)
        .post(`/api/projects/${PROJECT_ID}/issues`)
        .send({ title: 'First', type: 'task', reporterId: REPORTER_ID })
        .expect(201);

      const response = await request(app)
        .post(`/api/projects/${PROJECT_ID}/issues`)
        .send({ title: 'Second', type: 'task', reporterId: REPORTER_ID })
        .expect(201);

      expect(response.body.data.issueKey).toBe('TEST-2');
    });

    it('should create issue with all fields', async () => {
      const response = await request(app)
        .post(`/api/projects/${PROJECT_ID}/issues`)
        .send({
          title: 'Complete Issue',
          description: 'Full description',
          type: 'story',
          status: 'in_progress',
          priority: 'high',
          reporterId: REPORTER_ID,
          assigneeId: ASSIGNEE_ID,
        })
        .expect(201);

      expect(response.body.data.description).toBe('Full description');
      expect(response.body.data.status).toBe('in_progress');
      expect(response.body.data.priority).toBe('high');
      expect(response.body.data.assigneeId).toBe(ASSIGNEE_ID);
    });

    it('should return 400 for missing title', async () => {
      const response = await request(app)
        .post(`/api/projects/${PROJECT_ID}/issues`)
        .send({
          type: 'bug',
          reporterId: REPORTER_ID,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid type', async () => {
      const response = await request(app)
        .post(`/api/projects/${PROJECT_ID}/issues`)
        .send({
          title: 'Test',
          type: 'invalid_type',
          reporterId: REPORTER_ID,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid reporterId format', async () => {
      const response = await request(app)
        .post(`/api/projects/${PROJECT_ID}/issues`)
        .send({
          title: 'Test',
          type: 'bug',
          reporterId: 'not-a-uuid',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for title exceeding 255 characters', async () => {
      const response = await request(app)
        .post(`/api/projects/${PROJECT_ID}/issues`)
        .send({
          title: 'a'.repeat(256),
          type: 'bug',
          reporterId: REPORTER_ID,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .post(`/api/projects/${NON_EXISTENT_PROJECT}/issues`)
        .send({
          title: 'Test',
          type: 'bug',
          reporterId: REPORTER_ID,
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/projects/:projectId/issues/:issueId', () => {
    it('should get issue by ID', async () => {
      const issue = IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: REPORTER_ID,
      });

      const response = await request(app)
        .get(`/api/projects/${PROJECT_ID}/issues/${issue.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(issue.id);
      expect(response.body.data.title).toBe('Test Issue');
    });

    it('should get issue by issue key', async () => {
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: REPORTER_ID,
      });

      const response = await request(app)
        .get(`/api/projects/${PROJECT_ID}/issues/TEST-1`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.issueKey).toBe('TEST-1');
    });

    it('should return 404 for non-existent issue', async () => {
      const response = await request(app)
        .get(`/api/projects/${PROJECT_ID}/issues/non-existent-id`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get(`/api/projects/${NON_EXISTENT_PROJECT}/issues/TEST-1`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/projects/:projectId/issues/:issueId', () => {
    it('should update issue status', async () => {
      const issue = IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: REPORTER_ID,
      });

      const response = await request(app)
        .put(`/api/projects/${PROJECT_ID}/issues/${issue.id}`)
        .send({ status: 'in_progress' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('in_progress');
    });

    it('should update issue by issue key', async () => {
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: REPORTER_ID,
      });

      const response = await request(app)
        .put(`/api/projects/${PROJECT_ID}/issues/TEST-1`)
        .send({ priority: 'high' })
        .expect(200);

      expect(response.body.data.priority).toBe('high');
    });

    it('should update multiple fields', async () => {
      const issue = IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Original Title',
        type: 'bug',
        reporterId: REPORTER_ID,
      });

      const response = await request(app)
        .put(`/api/projects/${PROJECT_ID}/issues/${issue.id}`)
        .send({
          title: 'Updated Title',
          description: 'New description',
          status: 'done',
          priority: 'highest',
        })
        .expect(200);

      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.description).toBe('New description');
      expect(response.body.data.status).toBe('done');
      expect(response.body.data.priority).toBe('highest');
    });

    it('should unassign issue by setting assigneeId to null', async () => {
      const issue = IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: REPORTER_ID,
        assigneeId: ASSIGNEE_ID,
      });

      const response = await request(app)
        .put(`/api/projects/${PROJECT_ID}/issues/${issue.id}`)
        .send({ assigneeId: null })
        .expect(200);

      expect(response.body.data.assigneeId).toBeUndefined();
    });

    it('should return 400 for invalid update data', async () => {
      const issue = IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: REPORTER_ID,
      });

      const response = await request(app)
        .put(`/api/projects/${PROJECT_ID}/issues/${issue.id}`)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for unknown fields (strict schema)', async () => {
      const issue = IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: REPORTER_ID,
      });

      const response = await request(app)
        .put(`/api/projects/${PROJECT_ID}/issues/${issue.id}`)
        .send({ unknownField: 'value' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent issue', async () => {
      const response = await request(app)
        .put(`/api/projects/${PROJECT_ID}/issues/non-existent-id`)
        .send({ status: 'done' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/projects/:projectId/issues/:issueId', () => {
    it('should soft delete issue and return 204', async () => {
      const issue = IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: REPORTER_ID,
      });

      await request(app)
        .delete(`/api/projects/${PROJECT_ID}/issues/${issue.id}`)
        .expect(204);

      // Verify issue is not findable
      const deletedIssue = IssueModel.findIssueById(issue.id);
      expect(deletedIssue).toBeNull();
    });

    it('should delete issue by issue key', async () => {
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: REPORTER_ID,
      });

      await request(app)
        .delete(`/api/projects/${PROJECT_ID}/issues/TEST-1`)
        .expect(204);
    });

    it('should exclude soft-deleted issues from list', async () => {
      const issue = IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'To Be Deleted',
        type: 'bug',
        reporterId: REPORTER_ID,
      });
      IssueModel.createIssue(PROJECT_ID, 'TEST', {
        title: 'Keep This',
        type: 'task',
        reporterId: REPORTER_ID,
      });

      await request(app)
        .delete(`/api/projects/${PROJECT_ID}/issues/${issue.id}`)
        .expect(204);

      const response = await request(app)
        .get(`/api/projects/${PROJECT_ID}/issues`)
        .expect(200);

      expect(response.body.data.total).toBe(1);
      expect(response.body.data.data[0].title).toBe('Keep This');
    });

    it('should return 404 for non-existent issue', async () => {
      const response = await request(app)
        .delete(`/api/projects/${PROJECT_ID}/issues/non-existent-id`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .delete(`/api/projects/${NON_EXISTENT_PROJECT}/issues/TEST-1`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
