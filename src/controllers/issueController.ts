import type { Request, Response, NextFunction } from 'express';
import * as IssueModel from '../models/Issue.js';
import * as ProjectModel from '../models/Project.js';
import * as UserModel from '../models/User.js';
import {
  CreateIssueSchema,
  UpdateIssueSchema,
  PaginationSchema,
  IssueFiltersSchema,
  SortSchema,
  MoveIssueStatusSchema,
} from '../validators/issueValidator.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors.js';
import type { ApiResponse, PaginatedResponse, Issue } from '../types/index.js';

function escapeHtml(text: string | undefined): string | undefined {
  if (!text) return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function listIssues(
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
    
    const paginationResult = PaginationSchema.safeParse(req.query);
    if (!paginationResult.success) {
      throw new ValidationError('Invalid pagination parameters', {
        errors: paginationResult.error.errors,
      });
    }
    
    const filtersResult = IssueFiltersSchema.safeParse(req.query);
    if (!filtersResult.success) {
      throw new ValidationError('Invalid filter parameters', {
        errors: filtersResult.error.errors,
      });
    }
    
    const sortResult = SortSchema.safeParse(req.query);
    if (!sortResult.success) {
      throw new ValidationError('Invalid sort parameters', {
        errors: sortResult.error.errors,
      });
    }
    
    const pagination = paginationResult.data;
    const filters = filtersResult.data;
    const sort = sortResult.data;
    
    const result = IssueModel.listIssuesByProject(
      projectId,
      filters,
      pagination,
      sort
    );
    
    const response: ApiResponse<PaginatedResponse<Issue>> = {
      success: true,
      data: result,
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function getIssue(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId, issueId } = req.params;
    
    const project = ProjectModel.findProjectById(projectId);
    if (!project) {
      throw new NotFoundError('Project', projectId);
    }
    
    const issue = IssueModel.findIssueByIdOrKey(projectId, issueId);
    if (!issue) {
      throw new NotFoundError('Issue', issueId);
    }
    
    const assignee = issue.assigneeId ? UserModel.findUserById(issue.assigneeId) : null;
    const reporter = UserModel.findUserById(issue.reporterId);
    
    const response: ApiResponse<Issue & { assignee?: typeof assignee; reporter?: typeof reporter }> = {
      success: true,
      data: {
        ...issue,
        ...(assignee && { assignee }),
        ...(reporter && { reporter }),
      },
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function createIssue(
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
    
    const validationResult = CreateIssueSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Validation failed', { errors });
    }
    
    const input = validationResult.data;
    
    const reporter = UserModel.findUserById(input.reporterId);
    if (!reporter) {
      throw new ValidationError('Reporter not found', {
        field: 'reporterId',
        value: input.reporterId,
      });
    }
    
    if (input.assigneeId) {
      const assignee = UserModel.findUserById(input.assigneeId);
      if (!assignee) {
        throw new ValidationError('Assignee not found', {
          field: 'assigneeId',
          value: input.assigneeId,
        });
      }
      
      if (!ProjectModel.isProjectMember(projectId, input.assigneeId)) {
        throw new ForbiddenError('Assignee does not have access to this project');
      }
    }
    
    const sanitizedInput = {
      ...input,
      description: escapeHtml(input.description),
    };
    
    const issue = IssueModel.createIssue(projectId, project.prefix, sanitizedInput);
    
    const response: ApiResponse<Issue> = {
      success: true,
      data: issue,
    };
    
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function updateIssue(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId, issueId } = req.params;
    
    const project = ProjectModel.findProjectById(projectId);
    if (!project) {
      throw new NotFoundError('Project', projectId);
    }
    
    const existingIssue = IssueModel.findIssueByIdOrKey(projectId, issueId);
    if (!existingIssue) {
      throw new NotFoundError('Issue', issueId);
    }
    
    const validationResult = UpdateIssueSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Validation failed', { errors });
    }
    
    const input = validationResult.data;
    
    if (input.assigneeId !== undefined && input.assigneeId !== null) {
      const assignee = UserModel.findUserById(input.assigneeId);
      if (!assignee) {
        throw new ValidationError('Assignee not found', {
          field: 'assigneeId',
          value: input.assigneeId,
        });
      }
      
      if (!ProjectModel.isProjectMember(projectId, input.assigneeId)) {
        throw new ForbiddenError('Assignee does not have access to this project');
      }
    }
    
    const sanitizedInput = {
      ...input,
      ...(input.description !== undefined && { description: escapeHtml(input.description) }),
    };
    
    const updated = IssueModel.updateIssue(existingIssue.id, sanitizedInput);
    if (!updated) {
      throw new NotFoundError('Issue', issueId);
    }
    
    const response: ApiResponse<Issue> = {
      success: true,
      data: updated,
    };
    
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

export async function deleteIssue(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId, issueId } = req.params;
    
    const project = ProjectModel.findProjectById(projectId);
    if (!project) {
      throw new NotFoundError('Project', projectId);
    }
    
    const existingIssue = IssueModel.findIssueByIdOrKey(projectId, issueId);
    if (!existingIssue) {
      throw new NotFoundError('Issue', issueId);
    }
    
    const deleted = IssueModel.softDeleteIssue(existingIssue.id);
    if (!deleted) {
      throw new NotFoundError('Issue', issueId);
    }
    
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function moveIssueStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { projectId, issueId } = req.params;

    const project = ProjectModel.findProjectById(projectId);
    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    const existingIssue = IssueModel.findIssueByIdOrKey(projectId, issueId);
    if (!existingIssue) {
      throw new NotFoundError('Issue', issueId);
    }

    const validationResult = MoveIssueStatusSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Validation failed', { errors });
    }

    const { status } = validationResult.data;

    const updated = IssueModel.updateIssue(existingIssue.id, { status });
    if (!updated) {
      throw new NotFoundError('Issue', issueId);
    }

    const response: ApiResponse<Issue> = {
      success: true,
      data: updated,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
