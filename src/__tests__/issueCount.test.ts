import { describe, it, expect, beforeEach } from 'vitest';
import * as IssueModel from '../models/Issue.js';
import * as ProjectModel from '../models/Project.js';

describe('Issue Count', () => {
  beforeEach(() => {
    IssueModel.clearIssues();
    ProjectModel.clearProjects();
    ProjectModel.seedProjects();
  });
  
  describe('countIssuesByProject', () => {
    it('TC-28: should count issues by project id', () => {
      // Get seeded project
      const projects = ProjectModel.getAllProjects();
      const project = projects[0];
      
      // Create issues for the project
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
      
      const count = IssueModel.countIssuesByProject(project.id);
      expect(count).toBe(3);
    });
    
    it('TC-29: should return 0 for project with no issues', () => {
      const project = ProjectModel.createProject({
        name: 'Empty Project',
        prefix: 'EMPTY',
      });
      
      const count = IssueModel.countIssuesByProject(project.id);
      expect(count).toBe(0);
    });
    
    it('TC-30: should not count soft-deleted issues', () => {
      const project = ProjectModel.createProject({
        name: 'Project With Deleted Issues',
        prefix: 'DELETE',
      });
      
      // Create issues
      const issue1 = IssueModel.createIssue(project.id, project.prefix, {
        title: 'Issue 1',
        type: 'bug',
        reporterId: 'user-1',
      });
      IssueModel.createIssue(project.id, project.prefix, {
        title: 'Issue 2',
        type: 'task',
        reporterId: 'user-1',
      });
      
      // Delete one issue
      IssueModel.softDeleteIssue(issue1.id);
      
      const count = IssueModel.countIssuesByProject(project.id);
      expect(count).toBe(1);
    });
    
    it('TC-31: should only count issues for specified project', () => {
      const project1 = ProjectModel.createProject({
        name: 'Project 1',
        prefix: 'PJ',
      });
      const project2 = ProjectModel.createProject({
        name: 'Project 2',
        prefix: 'PJT',
      });
      
      // Create 3 issues for project1
      IssueModel.createIssue(project1.id, project1.prefix, {
        title: 'P1 Issue 1',
        type: 'bug',
        reporterId: 'user-1',
      });
      IssueModel.createIssue(project1.id, project1.prefix, {
        title: 'P1 Issue 2',
        type: 'task',
        reporterId: 'user-1',
      });
      IssueModel.createIssue(project1.id, project1.prefix, {
        title: 'P1 Issue 3',
        type: 'story',
        reporterId: 'user-1',
      });
      
      // Create 2 issues for project2
      IssueModel.createIssue(project2.id, project2.prefix, {
        title: 'P2 Issue 1',
        type: 'bug',
        reporterId: 'user-1',
      });
      IssueModel.createIssue(project2.id, project2.prefix, {
        title: 'P2 Issue 2',
        type: 'task',
        reporterId: 'user-1',
      });
      
      expect(IssueModel.countIssuesByProject(project1.id)).toBe(3);
      expect(IssueModel.countIssuesByProject(project2.id)).toBe(2);
    });
    
    it('should return 0 for non-existent project', () => {
      const count = IssueModel.countIssuesByProject('non-existent-project-id');
      expect(count).toBe(0);
    });
  });
});
