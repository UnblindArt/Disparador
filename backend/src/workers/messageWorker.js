import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { supabaseAdmin } from '../config/database.js';
import * as evolutionService from '../services/evolutionService.js';
import logger from '../config/logger.js';
import config from '../config/env.js';

const messageWorker = new Worker(
  'messages',
  async (job) => {
    const { messageId, userId, to, message, mediaUrl, mediaType, instanceName, isCampaign } = job.data;

    logger.info(`Processing message job ${job.id}`, { messageId, to, instanceName });

    try {
      // Send message via Evolution API
      let result;
      if (mediaUrl) {
        result = await evolutionService.sendMediaMessage(instanceName, to, mediaUrl, message, mediaType);
      } else {
        result = await evolutionService.sendTextMessage(instanceName, to, message);
      }

      // Update message status in appropriate table
      const tableName = isCampaign ? 'campaign_messages' : 'messages';
      const updateData = {
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (!isCampaign) {
        updateData.external_id = result.key?.id || null;
        updateData.metadata = result;
      } else {
        updateData.evolution_message_id = result.key?.id || null;
      }

      await supabaseAdmin
        .from(tableName)
        .update(updateData)
        .eq('id', messageId);

      // Update contact last message timestamp
      const { data: contact } = await supabaseAdmin
        .from('contacts')
        .select('id')
        .eq('phone', to)
        .eq('user_id', userId)
        .single();

      if (contact) {
        await supabaseAdmin
          .from('contacts')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', contact.id);
      }

      logger.info(`Message ${messageId} sent successfully`);

      return { success: true, messageId, result };
    } catch (error) {
      logger.error(`Failed to send message ${messageId}:`, error);

      // Update message status to failed
      const tableName = isCampaign ? 'campaign_messages' : 'messages';
      await supabaseAdmin
        .from(tableName)
        .update({
          status: 'failed',
          error_message: error.message,
          failed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: config.WHATSAPP_MESSAGES_PER_SECOND,
    limiter: {
      max: config.WHATSAPP_MESSAGES_PER_MINUTE,
      duration: 60000,
    },
  }
);

messageWorker.on('completed', (job) => {
  logger.debug(`Message job ${job.id} completed`);
});

messageWorker.on('failed', (job, err) => {
  logger.error(`Message job ${job?.id} failed:`, err);
});

messageWorker.on('error', (err) => {
  logger.error('Message worker error:', err);
});

export default messageWorker;
