import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, formatErrorResponse, ValidationError } from '../utils/errors.js';

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json(formatErrorResponse(error));
    return;
  }
  
  if (error instanceof ZodError) {
    const validationError = new ValidationError('Validation failed', {
      errors: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    res.status(400).json(formatErrorResponse(validationError));
    return;
  }
  
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
