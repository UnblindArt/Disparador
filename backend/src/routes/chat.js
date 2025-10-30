import express from 'express';
import * as chatController from '../controllers/chatController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// Get all conversations for an instance
router.get('/:instanceName', chatController.getAllConversations);

// Get conversation history with a specific contact
router.get('/:instanceName/:phone', chatController.getConversation);

// Send a message in a conversation
router.post('/:instanceName/:phone', chatController.sendMessage);

export default router;
