import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('[Error Handler]', {
    method: req.method,
    url: req.url,
    message: err.message,
    name: err.name,
    code: err.code,
  });

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Database schema validation error',
      details: err.message,
    });
    return;
  }

  if (err.code === 11000) {
    res.status(409).json({
      success: false,
      message: 'Duplicate key error: Resource with this unique identifier already exists.',
    });
    return;
  }

  if (err.name === 'MulterError') {
    res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'An unexpected server error occurred.' : err.message;

  res.status(statusCode).json({
    success: false,
    message,
  });
};
