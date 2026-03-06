import type { Request, Response, NextFunction } from 'express';
import * as ProjectModel from '../models/Project.js';
import type { ApiResponse, ProjectWithIssueCount } from '../types/index.js';

export async function getDashboardProjects(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const projects = ProjectModel.getAllProjectsWithIssueCount();

    const response: ApiResponse<ProjectWithIssueCount[]> = {
      success: true,
      data: projects,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
