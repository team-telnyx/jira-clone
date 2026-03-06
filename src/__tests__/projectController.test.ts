import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import * as projectController from '../controllers/projectController.js';
import * as ProjectModel from '../models/Project.js';
import * as IssueModel from '../models/Issue.js';

describe('Project Controller', () => {
  beforeEach(() => {
    // Clear both projects and issues before each test
    ProjectModel.clearProjects();
    IssueModel.clearIssues();
    ProjectModel.seedProjects();
  });
  
  describe('listProjects (GET /api/projects)', () => {
    it('TC-11: should return all projects with issue counts', async () => {
      // Get seeded projects
      const projects = ProjectModel.getAllProjects();
      const project1 = projects[0];
      const project2 = projects[1];
      
      // Create some issues for project1
      IssueModel.createIssue(project1.id, project1.prefix, {
        title: 'Issue 1',
        type: 'bug',
        reporterId: 'user-1',
      });
      IssueModel.createIssue(project1.id, project1.prefix, {
        title: 'Issue 2',
        type: 'task',
        reporterId: 'user-1',
      });
      
      // Mock Express objects
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;
      
      await projectController.listProjects(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      
      const response = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
      
      // Check project with issues has correct count
      const proj1InResponse = response.data.find((p: { id: string }) => p.id === project1.id);
      expect(proj1InResponse.issueCount).toBe(2);
      
      // Check project without issues has count 0
      const proj2InResponse = response.data.find((p: { id: string }) => p.id === project2.id);
      expect(proj2InResponse.issueCount).toBe(0);
    });
    
    it('TC-12: should return empty array when no projects exist', async () => {
      // Clear all projects including seeded ones
      ProjectModel.clearProjects();
      
      const req = {} as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;
      
      await projectController.listProjects(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(200);
      
      const response = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data).toEqual([]);
    });
  });
  
  describe('getProject (GET /api/projects/:id)', () => {
    it('TC-13: should return single project with issue count', async () => {
      const projects = ProjectModel.getAllProjects();
      const project = projects[0];
      
      // Create issues
      IssueModel.createIssue(project.id, project.prefix, {
        title: 'Issue 1',
        type: 'bug',
        reporterId: 'user-1',
      });
      IssueModel.createIssue(project.id, project.prefix, {
        title: 'Issue 2',
        type: 'task',
        reporterId: 'user-1',
      });
      IssueModel.createIssue(project.id, project.prefix, {
        title: 'Issue 3',
        type: 'story',
        reporterId: 'user-1',
      });
      
      const req = { params: { id: project.id } } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;
      
      await projectController.getProject(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(200);
      
      const response = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.id).toBe(project.id);
      expect(response.data.name).toBe(project.name);
      expect(response.data.prefix).toBe(project.prefix);
      expect(response.data.issueCount).toBe(3);
    });
    
    it('TC-14: should return 404 when project not found', async () => {
      const req = { params: { id: 'non-existent-id' } } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;
      
      await projectController.getProject(req, res, next);
      
      expect(next).toHaveBeenCalled();
      const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
    
    it('TC-18: should return issue count of 0 for new project', async () => {
      const project = ProjectModel.createProject({
        name: 'Empty Project',
        prefix: 'EMPTY',
      });
      
      const req = { params: { id: project.id } } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;
      
      await projectController.getProject(req, res, next);
      
      const response = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(response.data.issueCount).toBe(0);
    });
  });
  
  describe('createProject (POST /api/projects)', () => {
    it('TC-15: should create new project with valid input', async () => {
      const req = {
        body: {
          name: 'New Project',
          prefix: 'NEW',
          description: 'A new project',
        },
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;
      
      await projectController.createProject(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(201);
      
      const response = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.data.name).toBe('New Project');
      expect(response.data.prefix).toBe('NEW');
      expect(response.data.description).toBe('A new project');
      expect(response.data.id).toBeDefined();
      expect(response.data.createdAt).toBeDefined();
      expect(response.data.updatedAt).toBeDefined();
    });
    
    it('TC-16: should return 201 status on successful creation', async () => {
      const req = {
        body: {
          name: 'Another Project',
          prefix: 'ANOTHER',
        },
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;
      
      await projectController.createProject(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(201);
    });
    
    it('should normalize prefix to uppercase', async () => {
      const req = {
        body: {
          name: 'Lowercase Prefix',
          prefix: 'lower',
        },
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;
      
      await projectController.createProject(req, res, next);
      
      const response = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(response.data.prefix).toBe('LOWER');
    });
    
    it('TC-19: should return error response format for invalid input', async () => {
      const req = {
        body: {
          name: '',  // Invalid: empty name
          prefix: 'T',  // Invalid: too short
        },
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;
      
      await projectController.createProject(req, res, next);
      
      expect(next).toHaveBeenCalled();
      const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details.errors).toBeDefined();
    });
    
    it('TC-21: should include issue count in project response structure', async () => {
      const req = {
        body: {
          name: 'Project with Count',
          prefix: 'CNT',
        },
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;
      
      await projectController.createProject(req, res, next);
      
      const response = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(response.data.issueCount).toBeDefined();
      expect(response.data.issueCount).toBe(0);
    });
  });
  
  describe('Error Response Format', () => {
    it('TC-20: should return error response format for not found', async () => {
      const req = { params: { id: 'invalid-id' } } as unknown as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;
      
      await projectController.getProject(req, res, next);
      
      expect(next).toHaveBeenCalled();
      const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
      
      // Verify error format matches existing pattern
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toContain('Project');
    });
    
    it('should return validation error with field details', async () => {
      const req = {
        body: { name: 'Invalid' },  // Missing prefix
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as Response;
      const next = vi.fn() as NextFunction;
      
      await projectController.createProject(req, res, next);
      
      expect(next).toHaveBeenCalled();
      const error = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toHaveProperty('errors');
    });
  });
});
