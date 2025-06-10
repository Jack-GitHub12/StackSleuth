import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: 'Not Found' });
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  logger.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
} 