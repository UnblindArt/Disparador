import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../../.env.production') });

export const config = {
  // App
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: parseInt(process.env.PORT || '3000', 10),
  APP_NAME: process.env.APP_NAME || 'WhatsApp Dispatcher',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',

  // Security
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION || '15m',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  CORS_ORIGINS: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),

  // Database (Supabase)
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_DB: parseInt(process.env.REDIS_DB || '0', 10),
  REDIS_MAX_MEMORY: process.env.REDIS_MAX_MEMORY || '512mb',

  // Evolution API
  EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
  EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY,
  EVOLUTION_INSTANCE_NAME: process.env.EVOLUTION_INSTANCE_NAME || 'unblind-whatsapp',

  // WhatsApp Limits
  WHATSAPP_MESSAGES_PER_SECOND: parseInt(process.env.WHATSAPP_MESSAGES_PER_SECOND || '1', 10),
  WHATSAPP_MESSAGES_PER_MINUTE: parseInt(process.env.WHATSAPP_MESSAGES_PER_MINUTE || '30', 10),
  WHATSAPP_DAILY_LIMIT: parseInt(process.env.WHATSAPP_DAILY_LIMIT || '1000', 10),
  WHATSAPP_SESSION_TIMEOUT: parseInt(process.env.WHATSAPP_SESSION_TIMEOUT || '300000', 10),
  WHATSAPP_RETRY_AFTER_429: parseInt(process.env.WHATSAPP_RETRY_AFTER_429 || '60000', 10),
  WHATSAPP_MAX_MESSAGE_LENGTH: parseInt(process.env.WHATSAPP_MAX_MESSAGE_LENGTH || '4096', 10),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  RATE_LIMIT_LOGIN_MAX: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5', 10),
  RATE_LIMIT_LOGIN_WINDOW: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW || '3600000', 10),

  // LGPD
  DATA_RETENTION_DAYS: parseInt(process.env.DATA_RETENTION_DAYS || '90', 10),
  LOGS_RETENTION_DAYS: parseInt(process.env.LOGS_RETENTION_DAYS || '90', 10),
  ANONYMIZE_AFTER_DAYS: parseInt(process.env.ANONYMIZE_AFTER_DAYS || '90', 10),
  DATA_EXPORT_MAX_WAIT_HOURS: parseInt(process.env.DATA_EXPORT_MAX_WAIT_HOURS || '48', 10),
  DATA_DELETE_MAX_WAIT_HOURS: parseInt(process.env.DATA_DELETE_MAX_WAIT_HOURS || '72', 10),

  // Admin
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_PHONE: process.env.ADMIN_PHONE,

  // Notifications
  NOTIFICATION_EMAIL: process.env.NOTIFICATION_EMAIL,
  NOTIFICATION_PHONE: process.env.NOTIFICATION_PHONE,

  // File Uploads
  UPLOAD_MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10),
  UPLOAD_ALLOWED_TYPES: (process.env.UPLOAD_ALLOWED_TYPES || '').split(',').filter(Boolean),
  UPLOAD_PATH: process.env.UPLOAD_PATH || '/opt/whatsapp-dispatcher-client/uploads',

  // Backup
  BACKUP_ENABLED: process.env.BACKUP_ENABLED === 'true',
  BACKUP_INTERVAL: process.env.BACKUP_INTERVAL || 'daily',
  BACKUP_RETENTION_DAYS: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
  BACKUP_PATH: process.env.BACKUP_PATH || '/opt/whatsapp-dispatcher-client/backups',

  // Logs
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'json',
  LOG_FILE_ENABLED: process.env.LOG_FILE_ENABLED === 'true',
  LOG_CONSOLE_ENABLED: process.env.LOG_CONSOLE_ENABLED !== 'false',
  LOG_PATH: process.env.LOG_PATH || '/opt/whatsapp-dispatcher-client/logs',

  // Cache
  CACHE_ENABLED: process.env.CACHE_ENABLED !== 'false',
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '3600', 10),

  // Session
  SESSION_SECRET: process.env.SESSION_SECRET,
  SESSION_MAX_AGE: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10),
};

// Validate required config
const requiredKeys = [
  'JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY',
  'EVOLUTION_API_KEY',
];

for (const key of requiredKeys) {
  if (!config[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export default config;
