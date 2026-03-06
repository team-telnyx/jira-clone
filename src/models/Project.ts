import { v4 as uuidv4 } from 'uuid';
import type { Project, ProjectWithIssueCount } from '../types/index.js';
import * as IssueModel from './Issue.js';

const projects: Map<string, Project> = new Map();
const projectMembers: Map<string, Set<string>> = new Map();

export function seedProjects(): void {
  const defaultProjects: Project[] = [
    {
      id: 'proj-1',
      name: 'Test Project',
      prefix: 'TEST',
      description: 'A test project for development',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'proj-2',
      name: 'Backend API',
      prefix: 'API',
      description: 'Backend API development',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  
  defaultProjects.forEach(project => {
    projects.set(project.id, project);
    projectMembers.set(project.id, new Set(['user-1', 'user-2']));
  });
}

export function findProjectById(id: string): Project | null {
  return projects.get(id) ?? null;
}

export function createProject(data: { name: string; prefix: string; description?: string }): Project {
  const project: Project = {
    id: uuidv4(),
    name: data.name,
    prefix: data.prefix.toUpperCase(),
    description: data.description,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  projects.set(project.id, project);
  projectMembers.set(project.id, new Set());
  return project;
}

export function getAllProjects(): Project[] {
  return Array.from(projects.values());
}

export function addProjectMember(projectId: string, userId: string): boolean {
  const members = projectMembers.get(projectId);
  if (!members) return false;
  members.add(userId);
  return true;
}

export function isProjectMember(projectId: string, userId: string): boolean {
  const members = projectMembers.get(projectId);
  return members?.has(userId) ?? false;
}

export function getProjectMembers(projectId: string): string[] {
  const members = projectMembers.get(projectId);
  return members ? Array.from(members) : [];
}

export function getProjectWithIssueCount(projectId: string): ProjectWithIssueCount | null {
  const project = projects.get(projectId);
  if (!project) return null;

  const issueResult = IssueModel.listIssuesByProject(projectId, {}, { page: 1, limit: 1 });
  
  return {
    id: project.id,
    name: project.name,
    key: project.prefix,
    description: project.description,
    issueCount: issueResult.total,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function getAllProjectsWithIssueCount(): ProjectWithIssueCount[] {
  const allProjects = Array.from(projects.values());
  
  return allProjects.map(project => {
    const issueResult = IssueModel.listIssuesByProject(project.id, {}, { page: 1, limit: 1 });
    
    return {
      id: project.id,
      name: project.name,
      key: project.prefix,
      description: project.description,
      issueCount: issueResult.total,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  });
}

seedProjects();
