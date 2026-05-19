import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiResponse } from '../utils/ApiResponse';

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body ?? {},
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        res.status(400).json(ApiResponse.error(message));
        return;
      }
      res.status(400).json(ApiResponse.error('Validation failed'));
    }
  };
};
