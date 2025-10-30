import express from 'express';
import * as whatsappController from '../controllers/whatsappController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// Test endpoint (sem autenticação para facilitar debug)
router.get('/test-evolution', whatsappController.testEvolutionConnection);

// All other routes require authentication
router.use(authenticate);

// Instance management
router.post('/instances', whatsappController.createWhatsAppInstance);
router.get('/instances', whatsappController.getAllInstances);
router.get('/instances/evolution', whatsappController.getEvolutionInstances);
router.get('/instances/:instanceName/status', whatsappController.getInstanceStatus);
router.get('/instances/:instanceName/qrcode', whatsappController.getQRCode);
router.post('/instances/:instanceName/disconnect', whatsappController.disconnectInstance);
router.post('/instances/:instanceName/configure-webhook', whatsappController.configureWebhook);
router.delete('/instances/:instanceName', whatsappController.deleteInstance);

export default router;
