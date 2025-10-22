import express from 'express';
import * as contactController from '../controllers/contactController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { contactSchemas } from '../utils/validators.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validateRequest(contactSchemas.create), contactController.createContact);
router.get('/', contactController.getContacts);
router.get('/stats', contactController.getStats);
router.get('/:id', contactController.getContact);
router.put('/:id', validateRequest(contactSchemas.update), contactController.updateContact);
router.delete('/:id', contactController.deleteContact);
router.post('/bulk-import', validateRequest(contactSchemas.bulkImport), contactController.bulkImport);
router.post('/:id/opt-in', contactController.updateOptIn);

export default router;
