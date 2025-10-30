import express from 'express';
import * as appointmentController from '../controllers/appointmentController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticate);

// Stats and special endpoints first
router.get('/upcoming', appointmentController.getUpcomingAppointments);
router.get('/stats', appointmentController.getAppointmentStats);

// CRUD
router.post('/', appointmentController.createAppointment);
router.get('/', appointmentController.getAppointments);
router.get('/:id', appointmentController.getAppointment);
router.put('/:id', appointmentController.updateAppointment);
router.delete('/:id', appointmentController.deleteAppointment);

// Actions
router.post('/:id/cancel', appointmentController.cancelAppointment);
router.post('/:id/complete', appointmentController.completeAppointment);

export default router;
