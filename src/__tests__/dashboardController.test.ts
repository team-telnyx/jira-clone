import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as DashboardController from '../controllers/dashboardController.js';
import * as ProjectModel from '../models/Project.js';
import * as IssueModel from '../models/Issue.js';
import type { Request, Response, NextFunction } from 'express';

describe('Dashboard Controller', () => {
  beforeEach(() => {
    IssueModel.clearIssues();
    vi.clearAllMocks();
  });

  function createMockRequest(overrides = {}): Partial<Request> {
    return {
      params: {},
      query: {},
      body: {},
      ...overrides,
    };
  }

  function createMockResponse(): Response {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);
    return res as Response;
  }

  function createMockNext(): NextFunction {
    return vi.fn();
  }

  describe('getDashboardProjects', () => {
    it('should_return_200_with_projects_array', async () => {
      // Arrange
      const req = createMockRequest() as Request;
      const res = createMockResponse();
      const next = createMockNext();

      // Create some projects
      ProjectModel.createProject({
        name: 'Test Project',
        prefix: 'TEST',
        description: 'Test description',
      });

      // Act
      await DashboardController.getDashboardProjects(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      const responseArg = (res.json as any).mock.calls[0][0];
      expect(responseArg).toHaveProperty('success', true);
      expect(responseArg).toHaveProperty('data');
      expect(Array.isArray(responseArg.data)).toBe(true);
    });

    it('should_return_projects_with_correct_structure', async () => {
      // Arrange
      const req = createMockRequest() as Request;
      const res = createMockResponse();
      const next = createMockNext();

      // Create project with issues
      const project = ProjectModel.createProject({
        name: 'My Project',
        prefix: 'MYP',
        description: 'My project description',
      });

      IssueModel.createIssue(project.id, project.prefix, {
        title: 'Test Issue',
        type: 'bug',
        reporterId: 'user-1',
      });

      // Act
      await DashboardController.getDashboardProjects(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);

      const responseArg = (res.json as any).mock.calls[0][0];
      expect(responseArg.success).toBe(true);
      expect(Array.isArray(responseArg.data)).toBe(true);

      // Find our created project in the response
      const projectResponse = responseArg.data.find((p: any) => p.id === project.id);
      expect(projectResponse).toBeDefined();
      expect(projectResponse).toHaveProperty('name', 'My Project');
      expect(projectResponse).toHaveProperty('key', 'MYP');
      expect(projectResponse).toHaveProperty('description', 'My project description');
      expect(projectResponse).toHaveProperty('issueCount');
      expect(typeof projectResponse.issueCount).toBe('number');
    });

    it('should_return_empty_array_when_no_projects', async () => {
      // Arrange
      const req = createMockRequest() as Request;
      const res = createMockResponse();
      const next = createMockNext();

      // Act
      await DashboardController.getDashboardProjects(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);

      const responseArg = (res.json as any).mock.calls[0][0];
      expect(responseArg.success).toBe(true);
      expect(Array.isArray(responseArg.data)).toBe(true);
    });

    it('should_call_next_on_error', async () => {
      // Arrange
      const req = createMockRequest() as Request;
      const res = createMockResponse();
      const next = createMockNext();

      // Mock a failure scenario
      vi.spyOn(ProjectModel, 'getAllProjectsWithIssueCount').mockImplementation(() => {
        throw new Error('Database error');
      });

      // Act
      await DashboardController.getDashboardProjects(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect((next as any).mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });
});
