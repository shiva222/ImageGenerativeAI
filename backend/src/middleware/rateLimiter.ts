import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Max requests per window

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === 'test') {
    next();
    return;
  }

  const clientId = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  // Clean up expired entries
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
  
  // Initialize or get current data for client
  if (!store[clientId] || store[clientId].resetTime < now) {
    store[clientId] = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
  } else {
    store[clientId].count++;
  }
  
  const { count, resetTime } = store[clientId];
  
  // Set rate limit headers
  res.set({
    'X-RateLimit-Limit': MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': Math.max(0, MAX_REQUESTS - count).toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
  });
  
  // Check if limit exceeded
  if (count > MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: Math.ceil((resetTime - now) / 1000),
    });
    return;
  }
  
  next();
};
