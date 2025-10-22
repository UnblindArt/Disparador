import Redis from 'ioredis';
import config from './env.js';

// Main Redis client for general purpose
export const redis = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD || undefined,
  db: config.REDIS_DB,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
});

// Redis client for BullMQ
export const redisConnection = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD || undefined,
  db: config.REDIS_DB,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
};

// Event handlers
redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

redis.on('ready', () => {
  console.log('Redis is ready');
});

redis.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});

// Test Redis connection
export async function testRedisConnection() {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
}

// Helper functions
export const cacheService = {
  async get(key) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  async set(key, value, ttl = config.CACHE_TTL) {
    try {
      const stringValue = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, stringValue);
      } else {
        await redis.set(key, stringValue);
      }
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  },

  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  },

  async flush() {
    try {
      await redis.flushdb();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }
};

export default { redis, redisConnection, testRedisConnection, cacheService };
