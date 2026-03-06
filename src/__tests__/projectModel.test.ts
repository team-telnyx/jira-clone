import { describe, it, expect, beforeEach } from 'vitest';
import * as ProjectModel from '../models/Project.js';

describe('Project Model', () => {
  beforeEach(() => {
    // Clear all projects before each test
    ProjectModel.clearProjects();
    // Re-seed default projects for consistent test state
    ProjectModel.seedProjects();
  });
  
  describe('getAllProjects', () => {
    it('TC-22: should return all projects', () => {
      const projects = ProjectModel.getAllProjects();
      
      // Seeded projects should exist based on the model
      expect(projects).toBeInstanceOf(Array);
      expect(projects.length).toBeGreaterThanOrEqual(2); // At least seeded projects
      
      // Check expected structure
      projects.forEach(project => {
        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('prefix');
        expect(project).toHaveProperty('createdAt');
        expect(project).toHaveProperty('updatedAt');
      });
    });
    
    it('should return array with correct project structure', () => {
      const projects = ProjectModel.getAllProjects();
      
      if (projects.length > 0) {
        const firstProject = projects[0];
        expect(typeof firstProject.id).toBe('string');
        expect(typeof firstProject.name).toBe('string');
        expect(typeof firstProject.prefix).toBe('string');
        expect(firstProject.createdAt).toBeInstanceOf(Date);
        expect(firstProject.updatedAt).toBeInstanceOf(Date);
      }
    });
  });
  
  describe('findProjectById', () => {
    it('TC-23: should find project by id', () => {
      const projects = ProjectModel.getAllProjects();
      expect(projects.length).toBeGreaterThan(0);
      
      const firstProject = projects[0];
      const found = ProjectModel.findProjectById(firstProject.id);
      
      expect(found).not.toBeNull();
      expect(found?.id).toBe(firstProject.id);
      expect(found?.name).toBe(firstProject.name);
      expect(found?.prefix).toBe(firstProject.prefix);
    });
    
    it('TC-27: should return null for non-existent project', () => {
      const found = ProjectModel.findProjectById('non-existent-id');
      expect(found).toBeNull();
    });
    
    it('should return null for empty id', () => {
      const found = ProjectModel.findProjectById('');
      expect(found).toBeNull();
    });
  });
  
  describe('createProject', () => {
    it('TC-24: should create project with auto-generated id', () => {
      const project = ProjectModel.createProject({
        name: 'Test Creation',
        prefix: 'CR8',
        description: 'Testing project creation',
      });
      
      expect(project).toHaveProperty('id');
      expect(typeof project.id).toBe('string');
      expect(project.id.length).toBeGreaterThan(0);
      expect(project.name).toBe('Test Creation');
      expect(project.prefix).toBe('CR8');
      expect(project.description).toBe('Testing project creation');
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });
    
    it('TC-25: should normalize prefix to uppercase', () => {
      const project = ProjectModel.createProject({
        name: 'Lowercase',
        prefix: 'lower',
      });
      
      expect(project.prefix).toBe('LOWER');
    });
    
    it('should work with uppercase prefix', () => {
      const project = ProjectModel.createProject({
        name: 'Uppercase',
        prefix: 'UPPER',
      });
      
      expect(project.prefix).toBe('UPPER');
    });
    
    it('should create project without description', () => {
      const project = ProjectModel.createProject({
        name: 'No Description',
        prefix: 'NODESC',
      });
      
      expect(project.description).toBeUndefined();
    });
    
    it('should return project in getAllProjects after creation', () => {
      const beforeCount = ProjectModel.getAllProjects().length;
      
      ProjectModel.createProject({
        name: 'New Project',
        prefix: 'NEW',
      });
      
      const afterCount = ProjectModel.getAllProjects().length;
      expect(afterCount).toBe(beforeCount + 1);
    });
  });
  
  describe('Project Members', () => {
    it('TC-26: should add project members entry on creation', () => {
      const project = ProjectModel.createProject({
        name: 'Members Test',
        prefix: 'MEM',
      });
      
      // Check if project members functionality exists
      const members = ProjectModel.getProjectMembers(project.id);
      expect(members).toBeInstanceOf(Array);
      expect(members).toHaveLength(0);
      
      // Project should exist in the model
      const found = ProjectModel.findProjectById(project.id);
      expect(found).not.toBeNull();
    });
    
    it('should add and check project membership', () => {
      const project = ProjectModel.createProject({
        name: 'Membership',
        prefix: 'MEMB',
      });
      
      ProjectModel.addProjectMember(project.id, 'user-1');
      
      const isMember = ProjectModel.isProjectMember(project.id, 'user-1');
      expect(isMember).toBe(true);
      
      const isNotMember = ProjectModel.isProjectMember(project.id, 'user-99');
      expect(isNotMember).toBe(false);
    });
  });
  
  describe('Seeded Data', () => {
    it('should have seeded projects on module load', () => {
      const projects = ProjectModel.getAllProjects();
      
      // Check if Test Project exists (seeded in model)
      const testProject = projects.find(p => p.name === 'Test Project');
      expect(testProject).toBeDefined();
      expect(testProject?.prefix).toBe('TEST');
      
      // Check if Backend API project exists (seeded in model)
      const backendProject = projects.find(p => p.name === 'Backend API');
      expect(backendProject).toBeDefined();
      expect(backendProject?.prefix).toBe('API');
    });
  });
});
