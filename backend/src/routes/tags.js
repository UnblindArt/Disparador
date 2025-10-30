import express from 'express';
import * as tagController from '../controllers/tagController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// CRUD de tags
router.get('/', tagController.getTags);
router.post('/', tagController.createTag);
router.put('/:id', tagController.updateTag);
router.delete('/:id', tagController.deleteTag);

// Associar tags com contatos
router.post('/:id/contacts/:contactId', tagController.addTagToContact);
router.delete('/:id/contacts/:contactId', tagController.removeTagFromContact);
router.get('/:id/contacts/count', tagController.getContactsCountByTag);
router.get('/:id/contacts', tagController.getContactsByTag);

export default router;
