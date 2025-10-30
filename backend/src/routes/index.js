import express from 'express';
import authRoutes from './auth.js';
import contactRoutes from './contacts.js';
import campaignRoutes from './campaigns.js';
import messageRoutes from './messages.js';
import whatsappRoutes from './whatsapp.js';
import webhookRoutes from './webhook.js';
import productRoutes from './products.js';
import uploadRoutes from './uploads.js';
import chatRoutes from './chat.js';
import tagRoutes from './tags.js';
import appointmentRoutes from './appointments.js';
import dashboardRoutes from './dashboard.js';
import { apiLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Webhook routes (no rate limiting for webhooks)
router.use('/webhook', webhookRoutes);

// Apply general rate limiter to other routes
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
router.use('/whatsapp', whatsappRoutes);
router.use('/products', productRoutes);
router.use('/upload', uploadRoutes);
router.use('/chat', chatRoutes);
router.use('/tags', tagRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
