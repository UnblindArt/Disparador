import express from 'express';
import * as webhookController from '../controllers/webhookController.js';

const router = express.Router();

// Webhook endpoint - NO authentication required (Evolution API calls this)
router.post('/evolution', webhookController.handleEvolutionWebhook);

// Get QR code from cache - NO authentication required for easier access
router.get('/qrcode/:instanceName', webhookController.getQRCodeFromCache);

// Test webhook endpoint - NO authentication required for testing
router.get('/test', webhookController.testWebhook);

export default router;
