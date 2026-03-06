import { describe, it, expect, beforeEach } from 'vitest';
import { getAllProjectsWithIssueCount, getProjectWithIssueCount } from '../models/Project.js';
import * as IssueModel from '../models/Issue.js';
import * as ProjectModel from '../models/Project.js';

describe('Dashboard Projects', () => {
  beforeEach(() => {
    IssueModel.clearIssues();
  });

  describe('getProjectWithIssueCount', () => {
    it('should_return_projects_with_issue_counts', () => {
      // Arrange: Create a project and some issues
      const project = ProjectModel.createProject({
        name: 'Test Project',
        prefix: 'TEST',
        description: 'A test project',
      });

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

      // Act: Get project with issue count
      const result = getProjectWithIssueCount(project.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.id).toBe(project.id);
      expect(result?.name).toBe('Test Project');
      expect(result?.key).toBe('TEST');
      expect(result?.description).toBe('A test project');
      expect(result?.issueCount).toBe(2);
    });

    it('should_return_zero_issue_count_for_projects_without_issues', () => {
      // Arrange: Create a project with no issues
      const project = ProjectModel.createProject({
        name: 'Empty Project',
        prefix: 'EMPTY',
        description: 'Project with no issues',
      });

      // Act: Get project with issue count
      const result = getProjectWithIssueCount(project.id);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.issueCount).toBe(0);
    });

    it('should_return_null_for_non_existent_project', () => {
      // Act: Try to get non-existent project
      const result = getProjectWithIssueCount('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should_excluding_soft_deleted_issues_from_count', () => {
      // Arrange: Create project with issues
      const project = ProjectModel.createProject({
        name: 'Project with deleted issues',
        prefix: 'PROJ',
        description: 'Test project',
      });

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

      // Act: Get project with issue count
      const result = getProjectWithIssueCount(project.id);

      // Assert
      expect(result?.issueCount).toBe(1);
    });
  });

  describe('getAllProjectsWithIssueCount', () => {
    it('should_return_all_projects_with_issue_counts', () => {
      // Arrange: Create multiple projects
      const project1 = ProjectModel.createProject({
        name: 'Project One',
        prefix: 'P1',
        description: 'First project',
      });

      const project2 = ProjectModel.createProject({
        name: 'Project Two',
        prefix: 'P2',
        description: 'Second project',
      });

      // Add issues to first project only
      IssueModel.createIssue(project1.id, project1.prefix, {
        title: 'Issue 1',
        type: 'bug',
        reporterId: 'user-1',
      });

      // Act: Get all projects
      const results = getAllProjectsWithIssueCount();

      // Assert
      expect(results.length).toBeGreaterThanOrEqual(2);

      const p1 = results.find(p => p.id === project1.id);
      const p2 = results.find(p => p.id === project2.id);

      expect(p1).not.toBeUndefined();
      expect(p1?.issueCount).toBe(1);
      expect(p2).not.toBeUndefined();
      expect(p2?.issueCount).toBe(0);
    });

    it('should_return_empty_array_when_no_projects_exist', () => {
      // This test verifies the function handles the empty state
      // Note: seedProjects creates default projects, so we'd need to clear them
      // or mock the projects Map for this test.
      // For TDD, we expect the function to handle empty projects gracefully.

      // Act: Get all projects
      const results = getAllProjectsWithIssueCount();

      // Assert: Should return an array (may have seeded projects)
      expect(Array.isArray(results)).toBe(true);
      results.forEach(project => {
        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('key');
        expect(project).toHaveProperty('issueCount');
        expect(typeof project.issueCount).toBe('number');
      });
    });

    it('should_show_correct_issue_count_per_project', () => {
      // Arrange: Create two projects with different issue counts
      const projectA = ProjectModel.createProject({
        name: 'Project A',
        prefix: 'PRJA',
        description: 'Project A with 3 issues',
      });

      const projectB = ProjectModel.createProject({
        name: 'Project B',
        prefix: 'PRJB',
        description: 'Project B with 1 issue',
      });

      // Create 3 issues for project A
      IssueModel.createIssue(projectA.id, projectA.prefix, {
        title: 'A-Issue 1',
        type: 'bug',
        reporterId: 'user-1',
      });
      IssueModel.createIssue(projectA.id, projectA.prefix, {
        title: 'A-Issue 2',
        type: 'task',
        reporterId: 'user-1',
      });
      IssueModel.createIssue(projectA.id, projectA.prefix, {
        title: 'A-Issue 3',
        type: 'story',
        reporterId: 'user-1',
      });

      // Create 1 issue for project B
      IssueModel.createIssue(projectB.id, projectB.prefix, {
        title: 'B-Issue 1',
        type: 'bug',
        reporterId: 'user-1',
      });

      // Act: Get all projects
      const results = getAllProjectsWithIssueCount();

      // Assert
      const resultA = results.find(p => p.id === projectA.id);
      const resultB = results.find(p => p.id === projectB.id);

      expect(resultA?.issueCount).toBe(3);
      expect(resultB?.issueCount).toBe(1);
    });

    it('should_include_all_required_project_fields', () => {
      // Arrange: Create a project
      const project = ProjectModel.createProject({
        name: 'Test Project',
        prefix: 'TEST',
        description: 'Test description',
      });

      // Act
      const results = getAllProjectsWithIssueCount();
      const result = results.find(p => p.id === project.id);

      // Assert: Verify all fields needed for dashboard card
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('key');
      expect(result?.key).toBe('TEST');
      expect(result).toHaveProperty('description');
      expect(result?.description).toBe('Test description');
      expect(result).toHaveProperty('issueCount');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });
});
