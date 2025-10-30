import express from 'express';
import * as scheduleController from '../controllers/scheduleController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Appointments CRUD
router.post('/', scheduleController.createAppointment);
router.get('/', scheduleController.getAppointments);
router.get('/:appointmentId', scheduleController.getAppointment);
router.put('/:appointmentId', scheduleController.updateAppointment);
router.delete('/:appointmentId', scheduleController.deleteAppointment);

export default router;
