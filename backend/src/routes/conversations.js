import express from 'express';
import * as conversationController from '../controllers/conversationController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Sync WhatsApp contacts
router.post('/sync/:instanceName', conversationController.syncWhatsAppContacts);

// Get all conversations/leads
router.get('/', conversationController.getAllConversations);

// Get conversation details
router.get('/:contactId', conversationController.getConversationDetails);

// Update contact notes
router.patch('/:contactId/notes', conversationController.updateContactNotes);

// Update contact status
router.patch('/:contactId/status', conversationController.updateContactStatus);

export default router;
