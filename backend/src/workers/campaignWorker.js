import { Worker } from 'bullmq';
import { redisConnection } from '../config/redis.js';
import { supabaseAdmin } from '../config/database.js';
import { queueHelpers } from '../config/queue.js';
import logger from '../config/logger.js';

const campaignWorker = new Worker(
  'campaigns',
  async (job) => {
    const { campaignId, userId } = job.data;

    logger.info(`Processing campaign job ${job.id}`, { campaignId });

    try {
      // Get campaign
      const { data: campaign, error: campaignError } = await supabaseAdmin
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) {
        throw new Error('Campaign not found');
      }

      // Check if campaign is still active
      if (campaign.status !== 'active' && campaign.status !== 'scheduled') {
        logger.info(`Campaign ${campaignId} is ${campaign.status}, skipping`);
        return { success: false, reason: 'Campaign not active' };
      }

      // Get pending campaign messages
      const { data: messages, error: messagesError } = await supabaseAdmin
        .from('campaign_messages')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'pending');

      if (messagesError) {
        throw messagesError;
      }

      if (!messages || messages.length === 0) {
        logger.info(`No pending messages for campaign ${campaignId}`);

        // Update campaign status to completed
        await supabaseAdmin
          .from('campaigns')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', campaignId);

        return { success: true, messagesSent: 0 };
      }

      // Queue messages
      const messageJobs = messages.map((msg, index) => ({
        messageId: msg.id,
        userId,
        to: msg.phone,
        message: msg.message,
        mediaUrl: msg.media_url,
      }));

      await queueHelpers.addBulkMessages(messageJobs);

      // Update campaign status
      await supabaseAdmin
        .from('campaigns')
        .update({
          status: 'processing',
          started_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      logger.info(`Campaign ${campaignId} processing started`, { messageCount: messages.length });

      return { success: true, messagesSent: messages.length };
    } catch (error) {
      logger.error(`Failed to process campaign ${campaignId}:`, error);

      // Update campaign status to failed
      await supabaseAdmin
        .from('campaigns')
        .update({
          status: 'failed',
          error_message: error.message,
        })
        .eq('id', campaignId);

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);

campaignWorker.on('completed', (job) => {
  logger.debug(`Campaign job ${job.id} completed`);
});

campaignWorker.on('failed', (job, err) => {
  logger.error(`Campaign job ${job?.id} failed:`, err);
});

campaignWorker.on('error', (err) => {
  logger.error('Campaign worker error:', err);
});

export default campaignWorker;
