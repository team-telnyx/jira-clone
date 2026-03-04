import { describe, it, expect, beforeEach } from 'vitest';
import * as IssueModel from '../models/Issue.js';

describe('Issue Model', () => {
  beforeEach(() => {
    IssueModel.clearIssues();
  });
  
  describe('generateIssueKey', () => {
    it('should generate sequential keys for a project', () => {
      const key1 = IssueModel.generateIssueKey('proj-1', 'TEST');
      const key2 = IssueModel.generateIssueKey('proj-1', 'TEST');
      const key3 = IssueModel.generateIssueKey('proj-1', 'TEST');
      
      expect(key1).toBe('TEST-1');
      expect(key2).toBe('TEST-2');
      expect(key3).toBe('TEST-3');
    });
    
    it('should generate independent keys per project', () => {
      const key1Proj1 = IssueModel.generateIssueKey('proj-1', 'PROJ1');
      const key1Proj2 = IssueModel.generateIssueKey('proj-2', 'PROJ2');
      const key2Proj1 = IssueModel.generateIssueKey('proj-1', 'PROJ1');
      
      expect(key1Proj1).toBe('PROJ1-1');
      expect(key1Proj2).toBe('PROJ2-1');
      expect(key2Proj1).toBe('PROJ1-2');
    });
  });
  
  describe('createIssue', () => {
    it('should create an issue with auto-generated key', () => {
      const issue = IssueModel.createIssue('proj-1', 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: 'user-1',
      });
      
      expect(issue.issueKey).toBe('TEST-1');
      expect(issue.title).toBe('Test Issue');
      expect(issue.status).toBe('backlog');
      expect(issue.priority).toBe('medium');
    });
    
    it('should use default values for optional fields', () => {
      const issue = IssueModel.createIssue('proj-1', 'TEST', {
        title: 'Test Issue',
        type: 'task',
        reporterId: 'user-1',
      });
      
      expect(issue.status).toBe('backlog');
      expect(issue.priority).toBe('medium');
      expect(issue.assigneeId).toBeUndefined();
      expect(issue.description).toBeUndefined();
    });
    
    it('should respect provided values', () => {
      const issue = IssueModel.createIssue('proj-1', 'TEST', {
        title: 'Test Issue',
        description: 'A description',
        type: 'story',
        status: 'in_progress',
        priority: 'high',
        reporterId: 'user-1',
        assigneeId: 'user-2',
      });
      
      expect(issue.status).toBe('in_progress');
      expect(issue.priority).toBe('high');
      expect(issue.type).toBe('story');
      expect(issue.description).toBe('A description');
      expect(issue.assigneeId).toBe('user-2');
    });
  });
  
  describe('findIssueById', () => {
    it('should find an existing issue', () => {
      const created = IssueModel.createIssue('proj-1', 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: 'user-1',
      });
      
      const found = IssueModel.findIssueById(created.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
    });
    
    it('should return null for non-existent issue', () => {
      const found = IssueModel.findIssueById('non-existent');
      expect(found).toBeNull();
    });
    
    it('should not find soft-deleted issues', () => {
      const created = IssueModel.createIssue('proj-1', 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: 'user-1',
      });
      
      IssueModel.softDeleteIssue(created.id);
      
      const found = IssueModel.findIssueById(created.id);
      expect(found).toBeNull();
    });
  });
  
  describe('findIssueByKey', () => {
    it('should find an issue by key', () => {
      const created = IssueModel.createIssue('proj-1', 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: 'user-1',
      });
      
      const found = IssueModel.findIssueByKey('proj-1', 'TEST-1');
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
    });
    
    it('should return null for wrong project', () => {
      IssueModel.createIssue('proj-1', 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: 'user-1',
      });
      
      const found = IssueModel.findIssueByKey('proj-2', 'TEST-1');
      expect(found).toBeNull();
    });
  });
  
  describe('findIssueByIdOrKey', () => {
    it('should find by UUID first', () => {
      const created = IssueModel.createIssue('proj-1', 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: 'user-1',
      });
      
      const found = IssueModel.findIssueByIdOrKey('proj-1', created.id);
      expect(found?.id).toBe(created.id);
    });
    
    it('should fall back to issue key', () => {
      IssueModel.createIssue('proj-1', 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: 'user-1',
      });
      
      const found = IssueModel.findIssueByIdOrKey('proj-1', 'TEST-1');
      expect(found?.issueKey).toBe('TEST-1');
    });
  });
  
  describe('updateIssue', () => {
    it('should perform partial update', () => {
      const created = IssueModel.createIssue('proj-1', 'TEST', {
        title: 'Original Title',
        type: 'bug',
        reporterId: 'user-1',
      });
      
      const updated = IssueModel.updateIssue(created.id, { status: 'in_progress' });
      
      expect(updated?.status).toBe('in_progress');
      expect(updated?.title).toBe('Original Title');
    });
    
    it('should update updatedAt timestamp', async () => {
      const created = IssueModel.createIssue('proj-1', 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: 'user-1',
      });
      
      const originalUpdatedAt = created.updatedAt;
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updated = IssueModel.updateIssue(created.id, { status: 'done' });
      
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
    
    it('should allow setting assigneeId to undefined (unassign)', () => {
      const created = IssueModel.createIssue('proj-1', 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: 'user-1',
        assigneeId: 'user-2',
      });
      
      const updated = IssueModel.updateIssue(created.id, { assigneeId: null });
      
      expect(updated?.assigneeId).toBeUndefined();
    });
    
    it('should return null for non-existent issue', () => {
      const updated = IssueModel.updateIssue('non-existent', { status: 'done' });
      expect(updated).toBeNull();
    });
  });
  
  describe('softDeleteIssue', () => {
    it('should soft delete an issue', () => {
      const created = IssueModel.createIssue('proj-1', 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: 'user-1',
      });
      
      const deleted = IssueModel.softDeleteIssue(created.id);
      expect(deleted).toBe(true);
      
      const found = IssueModel.findIssueById(created.id);
      expect(found).toBeNull();
    });
    
    it('should return false for non-existent issue', () => {
      const deleted = IssueModel.softDeleteIssue('non-existent');
      expect(deleted).toBe(false);
    });
    
    it('should return false for already deleted issue', () => {
      const created = IssueModel.createIssue('proj-1', 'TEST', {
        title: 'Test Issue',
        type: 'bug',
        reporterId: 'user-1',
      });
      
      IssueModel.softDeleteIssue(created.id);
      const secondDelete = IssueModel.softDeleteIssue(created.id);
      
      expect(secondDelete).toBe(false);
    });
  });
  
  describe('listIssuesByProject', () => {
    beforeEach(() => {
      IssueModel.createIssue('proj-1', 'TEST', {
        title: 'Issue 1',
        type: 'bug',
        status: 'backlog',
        priority: 'high',
        reporterId: 'user-1',
      });
      IssueModel.createIssue('proj-1', 'TEST', {
        title: 'Issue 2',
        type: 'task',
        status: 'in_progress',
        priority: 'low',
        reporterId: 'user-1',
        assigneeId: 'user-2',
      });
      IssueModel.createIssue('proj-1', 'TEST', {
        title: 'Search Term Issue',
        type: 'story',
        status: 'done',
        priority: 'medium',
        reporterId: 'user-1',
      });
      IssueModel.createIssue('proj-2', 'OTHER', {
        title: 'Other Project Issue',
        type: 'bug',
        reporterId: 'user-1',
      });
    });
    
    it('should list issues for a specific project', () => {
      const result = IssueModel.listIssuesByProject('proj-1');
      expect(result.data.length).toBe(3);
      expect(result.total).toBe(3);
    });
    
    it('should support pagination', () => {
      const result = IssueModel.listIssuesByProject('proj-1', {}, { page: 1, limit: 2 });
      expect(result.data.length).toBe(2);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(2);
    });
    
    it('should filter by status', () => {
      const result = IssueModel.listIssuesByProject('proj-1', { status: 'in_progress' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].status).toBe('in_progress');
    });
    
    it('should filter by priority', () => {
      const result = IssueModel.listIssuesByProject('proj-1', { priority: 'high' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].priority).toBe('high');
    });
    
    it('should filter by type', () => {
      const result = IssueModel.listIssuesByProject('proj-1', { type: 'bug' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].type).toBe('bug');
    });
    
    it('should filter by assignee', () => {
      const result = IssueModel.listIssuesByProject('proj-1', { assigneeId: 'user-2' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].assigneeId).toBe('user-2');
    });
    
    it('should search by title', () => {
      const result = IssueModel.listIssuesByProject('proj-1', { q: 'Search Term' });
      expect(result.data.length).toBe(1);
      expect(result.data[0].title).toContain('Search Term');
    });
    
    it('should sort by priority', () => {
      const resultDesc = IssueModel.listIssuesByProject(
        'proj-1',
        {},
        { page: 1, limit: 10 },
        { sortBy: 'priority', sortOrder: 'desc' }
      );
      expect(resultDesc.data[0].priority).toBe('high');
      
      const resultAsc = IssueModel.listIssuesByProject(
        'proj-1',
        {},
        { page: 1, limit: 10 },
        { sortBy: 'priority', sortOrder: 'asc' }
      );
      expect(resultAsc.data[0].priority).toBe('low');
    });
    
    it('should exclude soft-deleted issues', () => {
      const issues = IssueModel.listIssuesByProject('proj-1');
      const issueToDelete = issues.data[0];
      
      IssueModel.softDeleteIssue(issueToDelete.id);
      
      const afterDelete = IssueModel.listIssuesByProject('proj-1');
      expect(afterDelete.total).toBe(2);
    });
  });
});
