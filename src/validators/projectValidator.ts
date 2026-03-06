import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  prefix: z.string()
    .min(2, 'Prefix must be at least 2 characters')
    .max(10, 'Prefix must be 10 characters or less')
    .regex(/^[a-zA-Z]+$/, 'Prefix must contain only letters')
    .transform(val => val.toUpperCase()),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
});

export const UpdateProjectSchema = z.object({
  name: z.string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .nullable()
    .optional(),
}).strict();

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
