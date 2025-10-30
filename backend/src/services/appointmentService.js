import { supabaseAdmin } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Create appointment
 */
export async function createAppointment(userId, appointmentData) {
  try {
    const {
      contactId,
      title,
      description,
      appointmentType,
      startTime,
      endTime,
      location,
      notes,
      reminderTime
    } = appointmentData;

    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .insert([
        {
          user_id: userId,
          contact_id: contactId || null,
          title,
          description,
          appointment_type: appointmentType || 'meeting',
          start_time: startTime,
          end_time: endTime,
          location,
          notes,
          reminder_time: reminderTime || null,
          status: 'scheduled'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    logger.info('Appointment created:', { userId, appointmentId: appointment.id });
    return appointment;
  } catch (error) {
    logger.error('Create appointment error:', error);
    throw error;
  }
}

/**
 * Get appointments
 */
export async function getAppointments(userId, filters = {}) {
  try {
    const { status, startDate, endDate, contactId, type } = filters;

    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        contacts (
          id,
          name,
          phone,
          email
        )
      `)
      .eq('user_id', userId)
      .is('cancelled_at', null);

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('start_time', startDate);
    }

    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    if (type) {
      query = query.eq('appointment_type', type);
    }

    const { data: appointments, error } = await query.order('start_time', { ascending: true });

    if (error) throw error;

    return appointments;
  } catch (error) {
    logger.error('Get appointments error:', error);
    throw error;
  }
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(userId, appointmentId) {
  try {
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        contacts (
          id,
          name,
          phone,
          email
        )
      `)
      .eq('id', appointmentId)
      .eq('user_id', userId)
      .single();

    if (error || !appointment) {
      throw new Error('Appointment not found');
    }

    return appointment;
  } catch (error) {
    logger.error('Get appointment error:', error);
    throw error;
  }
}

/**
 * Update appointment
 */
export async function updateAppointment(userId, appointmentId, updates) {
  try {
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Appointment updated:', { userId, appointmentId });
    return appointment;
  } catch (error) {
    logger.error('Update appointment error:', error);
    throw error;
  }
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(userId, appointmentId) {
  try {
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Appointment cancelled:', { userId, appointmentId });
    return appointment;
  } catch (error) {
    logger.error('Cancel appointment error:', error);
    throw error;
  }
}

/**
 * Complete appointment
 */
export async function completeAppointment(userId, appointmentId) {
  try {
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    logger.info('Appointment completed:', { userId, appointmentId });
    return appointment;
  } catch (error) {
    logger.error('Complete appointment error:', error);
    throw error;
  }
}

/**
 * Delete appointment
 */
export async function deleteAppointment(userId, appointmentId) {
  try {
    const { error } = await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('id', appointmentId)
      .eq('user_id', userId);

    if (error) throw error;

    logger.info('Appointment deleted:', { userId, appointmentId });
    return true;
  } catch (error) {
    logger.error('Delete appointment error:', error);
    throw error;
  }
}

/**
 * Get upcoming appointments
 */
export async function getUpcomingAppointments(userId, daysAhead = 7) {
  try {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        contacts (
          id,
          name,
          phone
        )
      `)
      .eq('user_id', userId)
      .gte('start_time', now.toISOString())
      .lte('start_time', futureDate.toISOString())
      .in('status', ['scheduled', 'confirmed'])
      .order('start_time', { ascending: true });

    if (error) throw error;

    return appointments;
  } catch (error) {
    logger.error('Get upcoming appointments error:', error);
    throw error;
  }
}

/**
 * Get appointment statistics
 */
export async function getAppointmentStats(userId, options = {}) {
  try {
    const { startDate, endDate } = options;

    let query = supabaseAdmin
      .from('appointments')
      .select('status, appointment_type, start_time')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('start_time', startDate);
    }

    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    const { data: appointments, error } = await query;

    if (error) throw error;

    const stats = {
      total: appointments.length,
      byStatus: {},
      byType: {},
      thisWeek: 0,
      thisMonth: 0
    };

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    appointments.forEach(apt => {
      // Count by status
      stats.byStatus[apt.status] = (stats.byStatus[apt.status] || 0) + 1;

      // Count by type
      stats.byType[apt.appointment_type] = (stats.byType[apt.appointment_type] || 0) + 1;

      // Time-based counts
      const aptDate = new Date(apt.start_time);
      if (aptDate >= weekAgo) stats.thisWeek++;
      if (aptDate >= monthAgo) stats.thisMonth++;
    });

    return stats;
  } catch (error) {
    logger.error('Get appointment stats error:', error);
    throw error;
  }
}

export default {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
  deleteAppointment,
  getUpcomingAppointments,
  getAppointmentStats
};
