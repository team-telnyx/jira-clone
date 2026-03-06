import { describe, it, expect, beforeEach } from 'vitest';
import * as ProjectModel from '../models/Project.js';
import * as IssueModel from '../models/Issue.js';

describe('Project Model', () => {
  describe('getAllProjects', () => {
    it('should return all projects including seed data', () => {
      const projects = ProjectModel.getAllProjects();
      expect(projects).toBeInstanceOf(Array);
      expect(projects.length).toBeGreaterThanOrEqual(2);
    });

    it('should return projects with correct structure', () => {
      const projects = ProjectModel.getAllProjects();
      const project = projects[0];

      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name');
      expect(project).toHaveProperty('prefix');
      expect(project).toHaveProperty('createdAt');
      expect(project).toHaveProperty('updatedAt');
    });
  });

  describe('createProject', () => {
    it('should create a project with required fields', () => {
      const project = ProjectModel.createProject({
        name: 'New Test Project',
        prefix: 'newtest',
      });

      expect(project).toHaveProperty('id');
      expect(project.name).toBe('New Test Project');
      expect(project.prefix).toBe('NEWTEST');
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a project with optional description', () => {
      const project = ProjectModel.createProject({
        name: 'Project With Description',
        prefix: 'pwd',
        description: 'This is a test description',
      });

      expect(project.description).toBe('This is a test description');
    });

    it('should convert prefix to uppercase', () => {
      const project = ProjectModel.createProject({
        name: 'Lowercase Prefix Test',
        prefix: 'lowercase',
      });

      expect(project.prefix).toBe('LOWERCASE');
    });

    it('should assign unique IDs to different projects', () => {
      const project1 = ProjectModel.createProject({
        name: 'Project 1',
        prefix: 'p1test',
      });
      const project2 = ProjectModel.createProject({
        name: 'Project 2',
        prefix: 'p2test',
      });

      expect(project1.id).not.toBe(project2.id);
    });
  });

  describe('findProjectById', () => {
    it('should find an existing project', () => {
      const created = ProjectModel.createProject({
        name: 'Findable Project',
        prefix: 'fptest',
      });

      const found = ProjectModel.findProjectById(created.id);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Findable Project');
    });

    it('should return null for non-existent project', () => {
      const found = ProjectModel.findProjectById('non-existent-id');
      expect(found).toBeNull();
    });

    it('should find seed project by ID', () => {
      const found = ProjectModel.findProjectById('proj-1');
      expect(found).not.toBeNull();
      expect(found?.prefix).toBe('TEST');
    });
  });
});

describe('Project with Issue Count', () => {
  beforeEach(() => {
    IssueModel.clearIssues();
  });

  it('should calculate issue count correctly for project with no issues', () => {
    const project = ProjectModel.createProject({
      name: 'Empty Project',
      prefix: 'eptest',
    });

    const result = IssueModel.listIssuesByProject(project.id);
    expect(result.total).toBe(0);
  });

  it('should calculate issue count correctly for project with multiple issues', () => {
    const project = ProjectModel.createProject({
      name: 'Project With Issues',
      prefix: 'pwitest',
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
    IssueModel.createIssue(project.id, project.prefix, {
      title: 'Issue 3',
      type: 'story',
      reporterId: 'user-1',
    });

    const result = IssueModel.listIssuesByProject(project.id);
    expect(result.total).toBe(3);
  });

  it('should not count deleted issues', () => {
    const project = ProjectModel.createProject({
      name: 'Project With Deleted',
      prefix: 'pwdtest',
    });

    const issue1 = IssueModel.createIssue(project.id, project.prefix, {
      title: 'Active Issue',
      type: 'bug',
      reporterId: 'user-1',
    });
    const issue2 = IssueModel.createIssue(project.id, project.prefix, {
      title: 'To Be Deleted',
      type: 'bug',
      reporterId: 'user-1',
    });

    IssueModel.softDeleteIssue(issue2.id);

    const result = IssueModel.listIssuesByProject(project.id);
    expect(result.total).toBe(1);
    expect(result.data[0].id).toBe(issue1.id);
  });

  it('should calculate issue count separately for different projects', () => {
    const project1 = ProjectModel.createProject({
      name: 'Project 1',
      prefix: 'p1cnt',
    });
    const project2 = ProjectModel.createProject({
      name: 'Project 2',
      prefix: 'p2cnt',
    });

    IssueModel.createIssue(project1.id, project1.prefix, {
      title: 'P1 Issue',
      type: 'bug',
      reporterId: 'user-1',
    });
    IssueModel.createIssue(project1.id, project1.prefix, {
      title: 'P1 Issue 2',
      type: 'task',
      reporterId: 'user-1',
    });
    IssueModel.createIssue(project2.id, project2.prefix, {
      title: 'P2 Issue',
      type: 'story',
      reporterId: 'user-1',
    });

    const result1 = IssueModel.listIssuesByProject(project1.id);
    const result2 = IssueModel.listIssuesByProject(project2.id);

    expect(result1.total).toBe(2);
    expect(result2.total).toBe(1);
  });
});
