import { rateLimit } from 'express-rate-limit';
import { Request, Response } from 'express';
import { rateLimitMiddlewareHandler } from '../lib/utils';

const verifyIdentityLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  limit: 1,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request, res: Response) => req.headers['x-onboarding-user'] as string,
  message: "You have exceeded the daily request limit.",
  headers: true,
  handler: rateLimitMiddlewareHandler
});

export default verifyIdentityLimiter;
