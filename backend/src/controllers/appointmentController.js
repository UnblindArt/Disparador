import * as appointmentService from '../services/appointmentService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

/**
 * POST /api/appointments
 */
export const createAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.createAppointment(req.user.id, req.body);

  res.status(201).json({
    success: true,
    data: appointment
  });
});

/**
 * GET /api/appointments
 */
export const getAppointments = asyncHandler(async (req, res) => {
  const appointments = await appointmentService.getAppointments(req.user.id, req.query);

  res.json({
    success: true,
    data: appointments
  });
});

/**
 * GET /api/appointments/upcoming
 */
export const getUpcomingAppointments = asyncHandler(async (req, res) => {
  const { days } = req.query;
  const appointments = await appointmentService.getUpcomingAppointments(
    req.user.id,
    parseInt(days) || 7
  );

  res.json({
    success: true,
    data: appointments
  });
});

/**
 * GET /api/appointments/stats
 */
export const getAppointmentStats = asyncHandler(async (req, res) => {
  const stats = await appointmentService.getAppointmentStats(req.user.id, req.query);

  res.json({
    success: true,
    data: stats
  });
});

/**
 * GET /api/appointments/:id
 */
export const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.getAppointmentById(req.user.id, req.params.id);

  res.json({
    success: true,
    data: appointment
  });
});

/**
 * PUT /api/appointments/:id
 */
export const updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.updateAppointment(
    req.user.id,
    req.params.id,
    req.body
  );

  res.json({
    success: true,
    data: appointment
  });
});

/**
 * POST /api/appointments/:id/cancel
 */
export const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.cancelAppointment(req.user.id, req.params.id);

  res.json({
    success: true,
    data: appointment,
    message: 'Agendamento cancelado com sucesso'
  });
});

/**
 * POST /api/appointments/:id/complete
 */
export const completeAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.completeAppointment(req.user.id, req.params.id);

  res.json({
    success: true,
    data: appointment,
    message: 'Agendamento concluído com sucesso'
  });
});

/**
 * DELETE /api/appointments/:id
 */
export const deleteAppointment = asyncHandler(async (req, res) => {
  await appointmentService.deleteAppointment(req.user.id, req.params.id);

  res.json({
    success: true,
    message: 'Agendamento deletado com sucesso'
  });
});

export default {
  createAppointment,
  getAppointments,
  getUpcomingAppointments,
  getAppointmentStats,
  getAppointment,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
  deleteAppointment
};
