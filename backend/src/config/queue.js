import { Queue, Worker, QueueEvents } from 'bullmq';
import { redisConnection } from './redis.js';
import config from './env.js';
import logger from './logger.js';

// Queue configurations
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: {
    count: 1000,
    age: 24 * 3600, // 24 hours
  },
  removeOnFail: {
    count: 5000,
    age: 7 * 24 * 3600, // 7 days
  },
};

// Message Queue
export const messageQueue = new Queue('messages', {
  connection: redisConnection,
  defaultJobOptions: {
    ...defaultJobOptions,
    priority: 1,
  },
});

// Campaign Queue
export const campaignQueue = new Queue('campaigns', {
  connection: redisConnection,
  defaultJobOptions: {
    ...defaultJobOptions,
    priority: 2,
  },
});

// Notification Queue
export const notificationQueue = new Queue('notifications', {
  connection: redisConnection,
  defaultJobOptions: {
    ...defaultJobOptions,
    priority: 3,
  },
});

// Queue Events for monitoring
const messageQueueEvents = new QueueEvents('messages', {
  connection: redisConnection,
});

const campaignQueueEvents = new QueueEvents('campaigns', {
  connection: redisConnection,
});

// Event listeners
messageQueueEvents.on('completed', ({ jobId }) => {
  logger.debug(`Message job ${jobId} completed`);
});

messageQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Message job ${jobId} failed:`, { failedReason });
});

campaignQueueEvents.on('completed', ({ jobId }) => {
  logger.debug(`Campaign job ${jobId} completed`);
});

campaignQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Campaign job ${jobId} failed:`, { failedReason });
});

// Helper functions
export const queueHelpers = {
  async addMessageJob(data, options = {}) {
    try {
      const job = await messageQueue.add('send-message', data, {
        ...options,
        jobId: data.messageId || undefined,
      });
      logger.debug(`Message job added: ${job.id}`, { data });
      return job;
    } catch (error) {
      logger.error('Error adding message job:', error);
      throw error;
    }
  },

  async addCampaignJob(data, options = {}) {
    try {
      const job = await campaignQueue.add('process-campaign', data, {
        ...options,
        jobId: data.campaignId || undefined,
      });
      logger.debug(`Campaign job added: ${job.id}`, { data });
      return job;
    } catch (error) {
      logger.error('Error adding campaign job:', error);
      throw error;
    }
  },

  async addBulkMessages(messages) {
    try {
      const jobs = messages.map((msg, index) => ({
        name: 'send-message',
        data: msg,
        opts: {
          delay: index * 1000, // 1 second delay between messages
          jobId: msg.messageId || undefined,
        },
      }));

      const bulkJobs = await messageQueue.addBulk(jobs);
      logger.info(`${bulkJobs.length} message jobs added to queue`);
      return bulkJobs;
    } catch (error) {
      logger.error('Error adding bulk messages:', error);
      throw error;
    }
  },

  async getQueueStats() {
    try {
      const [messageStats, campaignStats] = await Promise.all([
        messageQueue.getJobCounts(),
        campaignQueue.getJobCounts(),
      ]);

      return {
        messages: messageStats,
        campaigns: campaignStats,
      };
    } catch (error) {
      logger.error('Error getting queue stats:', error);
      throw error;
    }
  },

  async pauseQueue(queueName) {
    const queue = queueName === 'messages' ? messageQueue : campaignQueue;
    await queue.pause();
    logger.info(`Queue ${queueName} paused`);
  },

  async resumeQueue(queueName) {
    const queue = queueName === 'messages' ? messageQueue : campaignQueue;
    await queue.resume();
    logger.info(`Queue ${queueName} resumed`);
  },

  async cleanQueue(queueName, grace = 5000) {
    const queue = queueName === 'messages' ? messageQueue : campaignQueue;
    await queue.clean(grace, 100, 'completed');
    await queue.clean(grace, 100, 'failed');
    logger.info(`Queue ${queueName} cleaned`);
  },
};

// Graceful shutdown
export async function closeQueues() {
  logger.info('Closing queues...');
  await Promise.all([
    messageQueue.close(),
    campaignQueue.close(),
    notificationQueue.close(),
    messageQueueEvents.close(),
    campaignQueueEvents.close(),
  ]);
  logger.info('Queues closed successfully');
}

export default {
  messageQueue,
  campaignQueue,
  notificationQueue,
  queueHelpers,
  closeQueues,
};
