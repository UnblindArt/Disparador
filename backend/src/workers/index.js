import messageWorker from './messageWorker.js';
import campaignWorker from './campaignWorker.js';
import logger from '../config/logger.js';

logger.info('Starting workers...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing workers...');
  await Promise.all([
    messageWorker.close(),
    campaignWorker.close(),
  ]);
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing workers...');
  await Promise.all([
    messageWorker.close(),
    campaignWorker.close(),
  ]);
  process.exit(0);
});

logger.info('Workers started successfully');
