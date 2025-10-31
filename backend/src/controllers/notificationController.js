import * as reminderService from '../services/reminderService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

/**
 * GET /api/notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { read, limit } = req.query;

  const notifications = await reminderService.getUserNotifications(req.user.id, {
    read: read === 'true' ? true : read === 'false' ? false : undefined,
    limit: limit ? parseInt(limit) : 50
  });

  res.json({
    success: true,
    data: notifications
  });
});

/**
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await reminderService.getUnreadCount(req.user.id);

  res.json({
    success: true,
    data: { count }
  });
});

/**
 * PUT /api/notifications/:id/read
 */
export const markAsRead = asyncHandler(async (req, res) => {
  await reminderService.markNotificationAsRead(req.user.id, req.params.id);

  res.json({
    success: true,
    message: 'Notification marked as read'
  });
});

/**
 * PUT /api/notifications/mark-all-read
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  await reminderService.markAllNotificationsAsRead(req.user.id);

  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});

/**
 * DELETE /api/notifications/:id
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  await reminderService.deleteNotification(req.user.id, req.params.id);

  res.json({
    success: true,
    message: 'Notification deleted'
  });
});

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
