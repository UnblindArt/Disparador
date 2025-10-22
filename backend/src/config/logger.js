import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import config from './env.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for console
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

// Transports array
const transports = [];

// Console transport
if (config.LOG_CONSOLE_ENABLED) {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat
      )
    })
  );
}

// File transports
if (config.LOG_FILE_ENABLED) {
  // Error log
  transports.push(
    new DailyRotateFile({
      filename: join(config.LOG_PATH, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: `${config.LOGS_RETENTION_DAYS}d`,
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      )
    })
  );

  // Combined log
  transports.push(
    new DailyRotateFile({
      filename: join(config.LOG_PATH, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: `${config.LOGS_RETENTION_DAYS}d`,
      format: combine(
        timestamp(),
        errors({ stack: true }),
        json()
      )
    })
  );

  // Access log (for HTTP requests)
  transports.push(
    new DailyRotateFile({
      filename: join(config.LOG_PATH, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: `${config.LOGS_RETENTION_DAYS}d`,
      level: 'http',
      format: combine(
        timestamp(),
        json()
      )
    })
  );
}

// Create logger
export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  transports,
  exitOnError: false
});

// Stream for Morgan
export const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Helper methods
logger.logRequest = (req, message) => {
  logger.info(message, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
};

logger.logError = (error, req = null) => {
  const meta = {
    message: error.message,
    stack: error.stack,
  };

  if (req) {
    meta.method = req.method;
    meta.url = req.url;
    meta.ip = req.ip;
  }

  logger.error('Application error', meta);
};

logger.logActivity = (userId, action, details = {}) => {
  logger.info('User activity', {
    userId,
    action,
    ...details,
    timestamp: new Date().toISOString()
  });
};

export default logger;
