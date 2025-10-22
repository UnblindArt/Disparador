import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { userSchemas } from '../utils/validators.js';
import { loginLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/register', validateRequest(userSchemas.register), authController.register);
router.post('/login', loginLimiter, validateRequest(userSchemas.login), authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, validateRequest(userSchemas.updateProfile), authController.updateProfile);
router.post('/change-password', authenticate, validateRequest(userSchemas.changePassword), authController.changePassword);

export default router;
