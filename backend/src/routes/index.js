import express from 'express';
import authRoutes from './auth.js';
import contactRoutes from './contacts.js';
import campaignRoutes from './campaigns.js';
import messageRoutes from './messages.js';
import { apiLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Apply general rate limiter
router.use(apiLimiter);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/contacts', contactRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/messages', messageRoutes);

export default router;
