import logger from '../config/logger.js';
import { supabaseAdmin } from '../config/database.js';

// Create appointment
export async function createAppointment(req, res, next) {
  try {
    const userId = req.user.userId;
    const { title, description, startTime, endTime, attendees, contactId } = req.body;

    const result = await query(
      `INSERT INTO appointments (user_id, title, description, start_time, end_time, attendees, contact_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [userId, title, description, startTime, endTime, JSON.stringify(attendees), contactId]
    );

    logger.info('Appointment created:', result.rows[0].id);

    res.json({
      success: true,
      message: 'Compromisso criado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error creating appointment:', error);
    next(error);
  }
}

// Get appointments for a date range
export async function getAppointments(req, res, next) {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    const result = await query(
      `SELECT a.*, c.name as contact_name, c.phone as contact_phone
       FROM appointments a
       LEFT JOIN contacts c ON a.contact_id = c.id
       WHERE a.user_id = $1
       AND a.start_time >= $2
       AND a.start_time <= $3
       ORDER BY a.start_time ASC`,
      [userId, startDate, endDate]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error getting appointments:', error);
    next(error);
  }
}

// Get single appointment
export async function getAppointment(req, res, next) {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.userId;

    const result = await query(
      `SELECT a.*, c.name as contact_name, c.phone as contact_phone, c.email as contact_email
       FROM appointments a
       LEFT JOIN contacts c ON a.contact_id = c.id
       WHERE a.id = $1 AND a.user_id = $2`,
      [appointmentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error getting appointment:', error);
    next(error);
  }
}

// Update appointment
export async function updateAppointment(req, res, next) {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.userId;
    const { title, description, startTime, endTime, attendees, contactId, status } = req.body;

    const result = await query(
      `UPDATE appointments
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           start_time = COALESCE($3, start_time),
           end_time = COALESCE($4, end_time),
           attendees = COALESCE($5, attendees),
           contact_id = COALESCE($6, contact_id),
           status = COALESCE($7, status),
           updated_at = NOW()
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [title, description, startTime, endTime, attendees ? JSON.stringify(attendees) : null, contactId, status, appointmentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    res.json({
      success: true,
      message: 'Compromisso atualizado com sucesso',
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error updating appointment:', error);
    next(error);
  }
}

// Delete appointment
export async function deleteAppointment(req, res, next) {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.userId;

    const result = await query(
      'DELETE FROM appointments WHERE id = $1 AND user_id = $2 RETURNING *',
      [appointmentId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    res.json({
      success: true,
      message: 'Compromisso excluído com sucesso',
    });
  } catch (error) {
    logger.error('Error deleting appointment:', error);
    next(error);
  }
}

export default {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
};
