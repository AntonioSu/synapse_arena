import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.issues.map(i => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  console.error(`${req.method} ${req.path} error:`, err);
  res.status(err.status ?? 500).json({
    success: false,
    error: err.message ?? 'Internal server error',
  });
}
