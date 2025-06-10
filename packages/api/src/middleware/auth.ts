import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Very simple JWT check placeholder – accepts all requests if token absent
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    // TODO: verify token
    next();
  } else {
    next();
  }
} 