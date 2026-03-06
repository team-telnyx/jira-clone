import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  prefix: z.string()
    .min(2, 'Prefix must be at least 2 characters')
    .max(10, 'Prefix must be 10 characters or less')
    .transform(val => val.toUpperCase()),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
