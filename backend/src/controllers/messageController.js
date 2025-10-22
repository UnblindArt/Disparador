import * as messageService from '../services/messageService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

export const sendMessage = asyncHandler(async (req, res) => {
  const message = await messageService.sendMessage(req.user.id, req.body);

  res.status(201).json({
    success: true,
    data: message,
  });
});

export const getMessages = asyncHandler(async (req, res) => {
  const messages = await messageService.getMessages(req.user.id, req.query);

  res.json({
    success: true,
    data: messages,
  });
});

export const getMessage = asyncHandler(async (req, res) => {
  const message = await messageService.getMessageById(req.user.id, req.params.id);

  res.json({
    success: true,
    data: message,
  });
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await messageService.getMessageStats(req.user.id);

  res.json({
    success: true,
    data: stats,
  });
});

export default {
  sendMessage,
  getMessages,
  getMessage,
  getStats,
};
