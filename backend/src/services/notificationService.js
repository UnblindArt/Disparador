import { supabaseAdmin } from '../config/database.js';
import logger from '../config/logger.js';
import nodemailer from 'nodemailer';

// Email transporter (configurar com SMTP real em produção)
let transporter = null;

// Initialize email transporter
function initializeEmailTransporter() {
  try {
    // Check if email is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      logger.warn('Email not configured. Using console logging for emails.');
      return null;
    }

    transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    logger.info('Email transporter initialized');
    return transporter;
  } catch (error) {
    logger.error('Error initializing email transporter:', error);
    return null;
  }
}

/**
 * Create in-app notification
 */
export async function createNotification(notificationData) {
  try {
    const {
      user_id,
      type,
      title,
      message,
      data = {},
      expires_at = null
    } = notificationData;

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert([{
        user_id,
        type,
        title,
        message,
        data,
        expires_at
      }])
      .select()
      .single();

    if (error) throw error;

    logger.info(`Notification created: ${notification.id} for user ${user_id}`);
    return notification;
  } catch (error) {
    logger.error('Create notification error:', error);
    throw error;
  }
}

/**
 * Send email notification
 */
export async function sendEmailNotification(emailData) {
  try {
    const { to, subject, body } = emailData;

    // Initialize transporter if not done yet
    if (!transporter) {
      transporter = initializeEmailTransporter();
    }

    // If no transporter, log to console
    if (!transporter) {
      logger.info('Email would be sent:', {
        to,
        subject,
        preview: body.substring(0, 100) + '...'
      });
      return true;
    }

    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"WhatsApp Dispatcher" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: body
    });

    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return true;
  } catch (error) {
    logger.error('Send email error:', error);
    // Don't throw - email is not critical
    return false;
  }
}

/**
 * Send batch notifications
 */
export async function sendBatchNotifications(userId, notifications) {
  try {
    const records = notifications.map(n => ({
      user_id: userId,
      ...n
    }));

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(records)
      .select();

    if (error) throw error;

    logger.info(`Batch notifications created: ${data.length} for user ${userId}`);
    return data;
  } catch (error) {
    logger.error('Send batch notifications error:', error);
    throw error;
  }
}

export default {
  createNotification,
  sendEmailNotification,
  sendBatchNotifications,
  initializeEmailTransporter
};
