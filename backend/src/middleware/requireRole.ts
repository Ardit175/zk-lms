import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse';

type Role = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(ApiResponse.error('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json(ApiResponse.error('Insufficient permissions'));
      return;
    }

    next();
  };
};
