import { v4 as uuidv4 } from 'uuid';
import type { Project } from '../types/index.js';

const projects: Map<string, Project> = new Map();
const projectMembers: Map<string, Set<string>> = new Map();

import { SEED_USER_1_ID, SEED_USER_2_ID } from './User.js';

export const SEED_PROJECT_1_ID = '00000000-0000-0000-0000-000000000011';
export const SEED_PROJECT_2_ID = '00000000-0000-0000-0000-000000000012';

export function seedProjects(): void {
  const defaultProjects: Project[] = [
    {
      id: SEED_PROJECT_1_ID,
      name: 'Test Project',
      prefix: 'TEST',
      description: 'A test project for development',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: SEED_PROJECT_2_ID,
      name: 'Backend API',
      prefix: 'API',
      description: 'Backend API development',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  
  defaultProjects.forEach(project => {
    projects.set(project.id, project);
    projectMembers.set(project.id, new Set([SEED_USER_1_ID, SEED_USER_2_ID]));
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

seedProjects();
