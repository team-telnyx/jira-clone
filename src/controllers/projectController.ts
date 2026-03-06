import type { Request, Response, NextFunction } from 'express';
import * as ProjectModel from '../models/Project.js';
import * as IssueModel from '../models/Issue.js';
import { CreateProjectSchema } from '../validators/projectValidator.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import type { ApiResponse, ProjectWithIssueCount } from '../types/index.js';

export async function listProjects(
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  const projects = ProjectModel.getAllProjects();
  
  const projectsWithCounts: ProjectWithIssueCount[] = projects.map(project => ({
    ...project,
    issueCount: IssueModel.countIssuesByProject(project.id),
  }));
  
  const response: ApiResponse<ProjectWithIssueCount[]> = {
    success: true,
    data: projectsWithCounts,
  };
  
  res.status(200).json(response);
}

export async function getProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    
    const project = ProjectModel.findProjectById(id);
    if (!project) {
      throw new NotFoundError('Project', id);
    }
    
    const projectWithCount: ProjectWithIssueCount = {
      ...project,
      issueCount: IssueModel.countIssuesByProject(project.id),
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
    
    const project = ProjectModel.createProject({
      name: input.name,
      prefix: input.prefix,
      description: input.description,
    });
    
    const projectWithCount: ProjectWithIssueCount = {
      ...project,
      issueCount: 0, // New project has no issues
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
