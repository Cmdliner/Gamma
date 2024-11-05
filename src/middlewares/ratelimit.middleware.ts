import { rateLimit } from 'express-rate-limit';
import { Request, Response } from 'express';

const verifyBvnLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  limit: 2,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request, res: Response) => req.headers['x-onboarding-user'] as string,
  message: "You have exceeded the daily request limit.",
  headers: true,
});

export default verifyBvnLimiter;
