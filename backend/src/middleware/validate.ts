import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Middleware factory: validate
 * Validates the specified part of the request against a Zod schema.
 * On failure, throws a ValidationError with structured field errors.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema, 'body'), handler)
 */
export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      const fieldErrors = formatZodError(result.error);
      return next(new ValidationError(fieldErrors));
    }

    // Replace the request part with the parsed (and coerced) data
    req[part] = result.data;
    next();
  };
}

function formatZodError(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'root';
    if (!fieldErrors[key]) {
      fieldErrors[key] = [];
    }
    fieldErrors[key].push(issue.message);
  }

  return fieldErrors;
}
