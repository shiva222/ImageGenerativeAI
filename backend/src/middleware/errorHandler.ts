import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class AppError extends Error implements ApiError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error & { statusCode?: number; name?: string },
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message;

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    const zodErrors = JSON.parse(err.message);
    if (Array.isArray(zodErrors) && zodErrors.length > 0) {
      message = zodErrors[0].message;
    } else {
      message = 'Validation error';
    }
  }

  // Handle SQLite constraint errors
  if (err.message?.includes('UNIQUE constraint failed: users.email')) {
    statusCode = 400;
    message = 'User with this email already exists';
  }

  if (err.message?.includes('UNIQUE constraint failed: generations.id')) {
    statusCode = 500;
    message = 'Generation ID conflict';
  }

  // Handle not found errors
  if (err.message?.includes('not found') || err.message?.includes('Not found')) {
    statusCode = 404;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error for debugging (only in development to avoid noise in tests)
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error:', {
      message: err.message,
      name: err.name,
      stack: err.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (fn: AsyncRouteHandler) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
