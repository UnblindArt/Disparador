import express from 'express';
import * as productController from '../controllers/productController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// CRUD de produtos
router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Associar produtos com contatos
router.post('/:id/contacts/:contactId', productController.addProductToContact);
router.delete('/:id/contacts/:contactId', productController.removeProductFromContact);
router.get('/:id/contacts', productController.getContactsByProduct);

export default router;
