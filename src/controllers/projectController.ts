import type { Request, Response, NextFunction } from 'express';
import * as ProjectModel from '../models/Project.js';
import * as IssueModel from '../models/Issue.js';
import { CreateProjectSchema } from '../validators/projectValidator.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';
import type { ApiResponse, Project } from '../types/index.js';

export interface ProjectWithIssueCount extends Project {
  issueCount: number;
}

function getIssueCountForProject(projectId: string): number {
  const result = IssueModel.listIssuesByProject(projectId, {}, { page: 1, limit: 1 });
  return result.total;
}

export async function listProjects(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projects = ProjectModel.getAllProjects();
    
    const projectsWithCount: ProjectWithIssueCount[] = projects.map(project => ({
      ...project,
      issueCount: getIssueCountForProject(project.id),
    }));
    
    const response: ApiResponse<ProjectWithIssueCount[]> = {
      success: true,
      data: projectsWithCount,
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function getProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId } = req.params;
    
    const project = ProjectModel.findProjectById(projectId);
    if (!project) {
      throw new NotFoundError('Project', projectId);
    }
    
    const projectWithCount: ProjectWithIssueCount = {
      ...project,
      issueCount: getIssueCountForProject(project.id),
    };
    
    const response: ApiResponse<ProjectWithIssueCount> = {
      success: true,
      data: projectWithCount,
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function createProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validationResult = CreateProjectSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Validation failed', { errors });
    }
    
    const input = validationResult.data;
    
    // Check for unique prefix
    const existingProjects = ProjectModel.getAllProjects();
    const prefixExists = existingProjects.some(p => p.prefix === input.prefix);
    if (prefixExists) {
      throw new ConflictError(`Project with prefix '${input.prefix}' already exists`);
    }
    
    const project = ProjectModel.createProject(input);
    
    const projectWithCount: ProjectWithIssueCount = {
      ...project,
      issueCount: 0,
    };
    
    const response: ApiResponse<ProjectWithIssueCount> = {
      success: true,
      data: projectWithCount,
    };
    
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}
