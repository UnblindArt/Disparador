import express from 'express';
import * as messageController from '../controllers/messageController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { messageSchemas } from '../utils/validators.js';
import { messageLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.use(authenticate);

router.post('/send', messageLimiter, validateRequest(messageSchemas.send), messageController.sendMessage);
router.get('/', messageController.getMessages);
router.get('/stats', messageController.getStats);
router.get('/:id', messageController.getMessage);

export default router;
