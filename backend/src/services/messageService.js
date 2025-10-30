import { supabaseAdmin } from '../config/database.js';
import { queueHelpers } from '../config/queue.js';
import evolutionService from './evolutionService.js';
import { getMediaType } from './mediaConverterService.js';
import logger from '../config/logger.js';

export async function sendMessage(userId, messageData) {
  try {
    const { instanceName, to, message, mediaUrl, mediaType, scheduledFor } = messageData;

    // Get user's default instance if not provided
    let finalInstanceName = instanceName;
    if (!finalInstanceName) {
      const { data: userSettings } = await supabaseAdmin
        .from('user_settings')
        .select('default_instance')
        .eq('user_id', userId)
        .single();

      if (!userSettings?.default_instance) {
        throw new Error('No WhatsApp instance configured. Please connect an instance first.');
      }

      finalInstanceName = userSettings.default_instance;
    }

    // Verify contact exists (optional - can send to any number)
    let contactId = null;
    const { data: contact } = await supabaseAdmin
      .from('contacts')
      .select('id, opt_in_status, name')
      .eq('user_id', userId)
      .eq('phone', to)
      .is('deleted_at', null)
      .single();

    if (contact) {
      contactId = contact.id;

      // Check opt-in status if contact exists
      if (contact.opt_in_status === 'opted_out') {
        throw new Error(`Contact ${contact.name || to} has opted out of receiving messages`);
      }
    } else {
      // Create contact if doesn't exist
      const { data: newContact } = await supabaseAdmin
        .from('contacts')
        .insert([
          {
            user_id: userId,
            phone: to,
            name: to,
            opt_in_status: 'pending'
          }
        ])
        .select('id')
        .single();

      contactId = newContact?.id;
    }

    // Create message record
    const { data: msg, error } = await supabaseAdmin
      .from('messages')
      .insert([
        {
          user_id: userId,
          contact_id: contactId,
          phone: to,
          message: message || '',
          media_url: mediaUrl || null,
          media_type: mediaType || (mediaUrl ? getMediaType(mediaType) : null),
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

    // Send immediately if not scheduled
    if (!scheduledFor) {
      try {
        let sendResult;

        if (mediaUrl) {
          // Send media message
          const caption = message || '';
          const finalMediaType = mediaType || getMediaType(mediaUrl);

          sendResult = await evolutionService.sendMediaMessage(
            finalInstanceName,
            to,
            mediaUrl,
            caption,
            finalMediaType
          );
        } else {
          // Send text message
          sendResult = await evolutionService.sendTextMessage(
            finalInstanceName,
            to,
            message
          );
        }

        // Update message status to sent
        await supabaseAdmin
          .from('messages')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', msg.id);

        logger.info('Message sent successfully:', { userId, messageId: msg.id, to });

        return { ...msg, status: 'sent', sendResult };
      } catch (sendError) {
        // Update message status to failed
        await supabaseAdmin
          .from('messages')
          .update({
            status: 'failed',
            error_message: sendError.message || 'Failed to send message'
          })
          .eq('id', msg.id);

        logger.error('Failed to send message:', sendError);
        throw sendError;
      }
    } else {
      // Queue message for later
      await queueHelpers.addMessageJob({
        messageId: msg.id,
        userId,
        instanceName: finalInstanceName,
        to,
        message,
        mediaUrl,
        mediaType,
        scheduledFor
      });

      logger.info('Message scheduled:', { userId, messageId: msg.id, scheduledFor });
    }

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
