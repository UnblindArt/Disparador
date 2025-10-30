import express from 'express';
import * as contactController from '../controllers/contactController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { contactSchemas } from '../utils/validators.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validateRequest(contactSchemas.create), contactController.createContact);
router.get('/', contactController.getContacts);
router.get('/search', contactController.searchContacts);
router.get('/stats', contactController.getStats);
router.get('/duplicates', contactController.findDuplicates);
router.post('/merge', contactController.mergeContactsHandler);

// WhatsApp sync endpoints
router.post('/sync-whatsapp/:instanceName', contactController.syncWhatsAppContacts);
router.get('/whatsapp-chats/:instanceName', contactController.getWhatsAppChats);

router.get('/:id', contactController.getContact);
router.get('/:id/media', contactController.getContactMedia);
router.put('/:id', validateRequest(contactSchemas.update), contactController.updateContact);
router.delete('/:id', contactController.deleteContact);
router.post('/bulk-import', validateRequest(contactSchemas.bulkImport), contactController.bulkImport);
router.post('/:id/opt-in', contactController.updateOptIn);
router.post('/:id/tags', contactController.addTagsToContact);
router.post('/:id/products', contactController.addProductsToContact);

export default router;
