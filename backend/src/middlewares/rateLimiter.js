import rateLimit from 'express-rate-limit';
import { redis } from '../config/redis.js';
import config from '../config/env.js';

// Custom store using Redis
class RedisStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'rl:';
    this.client = redis;
  }

  async increment(key) {
    const fullKey = this.prefix + key;
    const current = await this.client.incr(fullKey);

    if (current === 1) {
      await this.client.expire(fullKey, 60);
    }

    return {
      totalHits: current,
      resetTime: new Date(Date.now() + 60000),
    };
  }

  async decrement(key) {
    const fullKey = this.prefix + key;
    await this.client.decr(fullKey);
  }

  async resetKey(key) {
    const fullKey = this.prefix + key;
    await this.client.del(fullKey);
  }
}

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'rl:api:' }),
});

// Login rate limiter (more strict)
export const loginLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_LOGIN_WINDOW,
  max: config.RATE_LIMIT_LOGIN_MAX,
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  store: new RedisStore({ prefix: 'rl:login:' }),
});

// WhatsApp message rate limiter
export const messageLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: config.WHATSAPP_MESSAGES_PER_MINUTE,
  message: {
    success: false,
    error: 'Message rate limit exceeded. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'rl:message:' }),
  keyGenerator: (req) => {
    // Rate limit per user
    return req.user?.id || req.ip;
  },
});

// Campaign creation rate limiter
export const campaignLimiter = rateLimit({
  windowMs: 3600000, // 1 hour
  max: 10, // 10 campaigns per hour
  message: {
    success: false,
    error: 'Campaign creation limit exceeded.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'rl:campaign:' }),
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
});

// Create custom rate limiter
export function createRateLimiter(options) {
  return rateLimit({
    ...options,
    store: new RedisStore({ prefix: options.prefix || 'rl:custom:' }),
  });
}

export default {
  apiLimiter,
  loginLimiter,
  messageLimiter,
  campaignLimiter,
  createRateLimiter,
};
