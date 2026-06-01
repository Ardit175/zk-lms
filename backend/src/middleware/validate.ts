import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiResponse } from '../utils/ApiResponse';

export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.slice(1).join('.')}: ${issue.message}`)
        .join(', ');
      res.status(400).json(ApiResponse.error(message));
      return;
    }

    // Write coerced/defaulted/trimmed values back so controllers use the
    // validated data (Zod .default(), .transform(), .trim() now take effect).
    const data = result.data as { body?: unknown; query?: unknown; params?: unknown };
    if (data.body !== undefined) req.body = data.body;
    if (data.query !== undefined) Object.assign(req.query, data.query);
    if (data.params !== undefined) Object.assign(req.params, data.params);

    next();
  };
};
