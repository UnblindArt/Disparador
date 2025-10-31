import { supabaseAdmin } from '../config/database.js';
import logger from '../config/logger.js';
import notificationService from './notificationService.js';

/**
 * Process pending reminders
 */
export async function processPendingReminders() {
  try {
    // Get pending reminders from view
    const { data: reminders, error } = await supabaseAdmin
      .from('pending_reminders')
      .select('*')
      .limit(100);

    if (error) {
      logger.error('Error fetching pending reminders:', error);
      return;
    }

    if (!reminders || reminders.length === 0) {
      return;
    }

    logger.info(`Processing ${reminders.length} pending reminders`);

    for (const reminder of reminders) {
      try {
        await processReminder(reminder);
      } catch (error) {
        logger.error(`Error processing reminder ${reminder.id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in processPendingReminders:', error);
  }
}

/**
 * Process a single reminder
 */
async function processReminder(reminder) {
  const {
    id,
    appointment_id,
    user_id,
    reminder_type,
    appointment_title,
    appointment_description,
    appointment_start,
    appointment_location,
    contact_name,
    contact_phone,
    user_email,
    user_name
  } = reminder;

  // Determine message based on reminder type
  let title, message;

  switch (reminder_type) {
    case '10_minutes':
      title = '⏰ Lembrete: Agendamento em 10 minutos';
      message = `Seu agendamento "${appointment_title}" começa em 10 minutos`;
      break;
    case '5_minutes':
      title = '⚠️ Lembrete: Agendamento em 5 minutos';
      message = `Seu agendamento "${appointment_title}" começa em 5 minutos`;
      break;
    case 'on_time':
      title = '🔔 Agendamento Iniciando Agora!';
      message = `Seu agendamento "${appointment_title}" está começando agora`;
      break;
  }

  // Add more details to message
  if (contact_name) {
    message += ` com ${contact_name}`;
  }
  if (appointment_location) {
    message += ` em ${appointment_location}`;
  }

  // Create in-app notification
  await notificationService.createNotification({
    user_id,
    type: 'appointment_reminder',
    title,
    message,
    data: {
      appointment_id,
      reminder_type,
      contact_phone,
      start_time: appointment_start
    }
  });

  // Send email notification (if enabled)
  if (user_email) {
    await notificationService.sendEmailNotification({
      to: user_email,
      subject: title,
      body: `
        <h2>${title}</h2>
        <p>${message}</p>
        <br>
        <p><strong>Título:</strong> ${appointment_title}</p>
        ${appointment_description ? `<p><strong>Descrição:</strong> ${appointment_description}</p>` : ''}
        ${contact_name ? `<p><strong>Contato:</strong> ${contact_name} (${contact_phone})</p>` : ''}
        ${appointment_location ? `<p><strong>Local:</strong> ${appointment_location}</p>` : ''}
        <p><strong>Horário:</strong> ${new Date(appointment_start).toLocaleString('pt-BR')}</p>
        <br>
        <p><em>WhatsApp Dispatcher - Unblind</em></p>
      `
    });
  }

  // Mark reminder as sent
  await supabaseAdmin
    .from('appointment_reminders')
    .update({
      sent: true,
      sent_at: new Date().toISOString()
    })
    .eq('id', id);

  logger.info(`Reminder sent: ${id} (${reminder_type}) for appointment ${appointment_id}`);
}

/**
 * Get user notifications
 */
export async function getUserNotifications(userId, filters = {}) {
  try {
    const { read, limit = 50 } = filters;

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (typeof read === 'boolean') {
      query = query.eq('read', read);
    }

    // Filter out expired notifications
    query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    logger.error('Get user notifications error:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(userId, notificationId) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;

    return true;
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    throw error;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(userId, notificationId) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    logger.error('Delete notification error:', error);
    throw error;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId) {
  try {
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (error) throw error;

    return count || 0;
  } catch (error) {
    logger.error('Get unread count error:', error);
    return 0;
  }
}

export default {
  processPendingReminders,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount
};
