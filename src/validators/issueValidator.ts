import * as z from 'zod';

export const IssueStatusSchema = z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done', 'closed']);
export const IssuePrioritySchema = z.enum(['lowest', 'low', 'medium', 'high', 'highest']);
export const IssueTypeSchema = z.enum(['bug', 'task', 'story', 'epic']);

export const CreateIssueSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z.string().max(5000, 'Description must be 5000 characters or less').optional(),
  status: IssueStatusSchema.optional().default('backlog'),
  priority: IssuePrioritySchema.optional().default('medium'),
  type: IssueTypeSchema,
  assigneeId: z.string().uuid('Invalid assignee ID format').optional(),
  reporterId: z.string().uuid('Invalid reporter ID format'),
});

export const UpdateIssueSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(255, 'Title must be 255 characters or less').optional(),
  description: z.string().max(5000, 'Description must be 5000 characters or less').optional(),
  status: IssueStatusSchema.optional(),
  priority: IssuePrioritySchema.optional(),
  type: IssueTypeSchema.optional(),
  assigneeId: z.string().uuid('Invalid assignee ID format').nullable().optional(),
}).strict();

export const PaginationSchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a number').optional().transform(val => parseInt(val ?? '1', 10)),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional().transform(val => Math.min(parseInt(val ?? '10', 10), 100)),
});

export const IssueFiltersSchema = z.object({
  status: IssueStatusSchema.optional(),
  priority: IssuePrioritySchema.optional(),
  type: IssueTypeSchema.optional(),
  assigneeId: z.string().uuid().optional(),
  q: z.string().max(200).optional(),
});

export const SortSchema = z.object({
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const IssueIdParamSchema = z.object({
  issueId: z.string().min(1, 'Issue ID is required'),
});

export const ProjectIdParamSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
});

export type CreateIssueInput = z.infer<typeof CreateIssueSchema>;
export type UpdateIssueInput = z.infer<typeof UpdateIssueSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type IssueFiltersInput = z.infer<typeof IssueFiltersSchema>;
export type SortInput = z.infer<typeof SortSchema>;
