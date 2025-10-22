import { supabaseAdmin } from '../config/database.js';
import { queueHelpers } from '../config/queue.js';
import logger from '../config/logger.js';

export async function sendMessage(userId, messageData) {
  try {
    const { to, message, mediaUrl, scheduledFor } = messageData;

    // Verify contact exists and is opted in
    const { data: contact } = await supabaseAdmin
      .from('contacts')
      .select('id, opt_in_status')
      .eq('user_id', userId)
      .eq('phone', to)
      .is('deleted_at', null)
      .single();

    if (!contact) {
      throw new Error('Contact not found');
    }

    if (contact.opt_in_status !== 'opted_in') {
      throw new Error('Contact has not opted in to receive messages');
    }

    // Create message record
    const { data: msg, error } = await supabaseAdmin
      .from('messages')
      .insert([
        {
          user_id: userId,
          contact_id: contact.id,
          phone: to,
          message,
          media_url: mediaUrl || null,
          status: 'pending',
          scheduled_for: scheduledFor || null,
          direction: 'outbound',
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Queue message if not scheduled
    if (!scheduledFor) {
      await queueHelpers.addMessageJob({
        messageId: msg.id,
        userId,
        to,
        message,
        mediaUrl,
      });
    }

    logger.info('Message queued:', { userId, messageId: msg.id });
    return msg;
  } catch (error) {
    logger.error('Send message error:', error);
    throw error;
  }
}

export async function getMessages(userId, filters = {}) {
  try {
    let query = supabaseAdmin
      .from('messages')
      .select('*')
      .eq('user_id', userId);

    if (filters.contactId) {
      query = query.eq('contact_id', filters.contactId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.direction) {
      query = query.eq('direction', filters.direction);
    }

    const { data: messages, error } = await query
      .order('created_at', { ascending: false })
      .limit(filters.limit || 100);

    if (error) {
      throw error;
    }

    return messages;
  } catch (error) {
    logger.error('Get messages error:', error);
    throw error;
  }
}

export async function getMessageById(userId, messageId) {
  try {
    const { data: message, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('user_id', userId)
      .single();

    if (error || !message) {
      throw new Error('Message not found');
    }

    return message;
  } catch (error) {
    logger.error('Get message error:', error);
    throw error;
  }
}

export async function getMessageStats(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('status, direction')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    const stats = {
      total: data.length,
      sent: data.filter(m => m.status === 'sent').length,
      delivered: data.filter(m => m.status === 'delivered').length,
      failed: data.filter(m => m.status === 'failed').length,
      pending: data.filter(m => m.status === 'pending').length,
      inbound: data.filter(m => m.direction === 'inbound').length,
      outbound: data.filter(m => m.direction === 'outbound').length,
    };

    return stats;
  } catch (error) {
    logger.error('Get message stats error:', error);
    throw error;
  }
}

export default {
  sendMessage,
  getMessages,
  getMessageById,
  getMessageStats,
};
