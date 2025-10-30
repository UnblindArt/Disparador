import { supabaseAdmin } from '../config/database.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import * as appointmentService from '../services/appointmentService.js';
import logger from '../config/logger.js';

/**
 * GET /api/dashboard/stats
 * Retorna estatísticas gerais do usuário
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  try {
    // Get messages stats
    let messagesQuery = supabaseAdmin
      .from('messages')
      .select('id, status, direction, created_at', { count: 'exact' })
      .eq('user_id', userId);

    if (startDate) messagesQuery = messagesQuery.gte('created_at', startDate);
    if (endDate) messagesQuery = messagesQuery.lte('created_at', endDate);

    const { data: messages, count: totalMessages } = await messagesQuery;

    const messageStats = {
      total: totalMessages || 0,
      sent: messages?.filter(m => m.direction === 'outbound' && m.status === 'sent').length || 0,
      received: messages?.filter(m => m.direction === 'inbound').length || 0,
      failed: messages?.filter(m => m.status === 'failed').length || 0
    };

    // Get campaigns stats
    let campaignsQuery = supabaseAdmin
      .from('campaigns')
      .select('id, status, created_at', { count: 'exact' })
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (startDate) campaignsQuery = campaignsQuery.gte('created_at', startDate);
    if (endDate) campaignsQuery = campaignsQuery.lte('created_at', endDate);

    const { data: campaigns, count: totalCampaigns } = await campaignsQuery;

    const campaignStats = {
      total: totalCampaigns || 0,
      active: campaigns?.filter(c => c.status === 'active' || c.status === 'processing').length || 0,
      completed: campaigns?.filter(c => c.status === 'completed').length || 0,
      scheduled: campaigns?.filter(c => c.status === 'scheduled').length || 0,
      failed: campaigns?.filter(c => c.status === 'failed').length || 0
    };

    // Get campaign messages stats
    let campaignMessagesQuery = supabaseAdmin
      .from('campaign_messages')
      .select('status', { count: 'exact' })
      .eq('user_id', userId);

    const { data: campaignMessages } = await campaignMessagesQuery;

    const campaignMessageStats = {
      total: campaignMessages?.length || 0,
      sent: campaignMessages?.filter(m => m.status === 'sent').length || 0,
      delivered: campaignMessages?.filter(m => m.status === 'delivered').length || 0,
      pending: campaignMessages?.filter(m => m.status === 'pending').length || 0,
      failed: campaignMessages?.filter(m => m.status === 'failed').length || 0
    };

    // Get contacts stats
    const { count: totalContacts } = await supabaseAdmin
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null);

    const { count: optedInContacts } = await supabaseAdmin
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('opt_in_status', 'opted_in')
      .is('deleted_at', null);

    // Get appointments stats
    const appointmentStats = await appointmentService.getAppointmentStats(userId, {
      startDate,
      endDate
    });

    // Get upcoming appointments (next 7 days)
    const upcomingAppointments = await appointmentService.getUpcomingAppointments(userId, 7);

    // Response
    res.json({
      success: true,
      data: {
        messages: messageStats,
        campaigns: campaignStats,
        campaignMessages: campaignMessageStats,
        contacts: {
          total: totalContacts || 0,
          optedIn: optedInContacts || 0,
          optedOut: (totalContacts || 0) - (optedInContacts || 0)
        },
        appointments: {
          ...appointmentStats,
          upcoming: upcomingAppointments.length
        },
        period: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      }
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    throw error;
  }
});

/**
 * GET /api/dashboard/activity
 * Retorna atividades recentes
 */
export const getRecentActivity = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit = 20 } = req.query;

  try {
    // Get recent messages
    const { data: recentMessages } = await supabaseAdmin
      .from('messages')
      .select(`
        id,
        content,
        direction,
        status,
        created_at,
        contacts (
          id,
          name,
          phone
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Get recent campaigns
    const { data: recentCampaigns } = await supabaseAdmin
      .from('campaigns')
      .select('id, name, status, total_contacts, created_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Get recent appointments
    const { data: recentAppointments } = await supabaseAdmin
      .from('appointments')
      .select(`
        id,
        title,
        appointment_type,
        status,
        start_time,
        contacts (
          id,
          name,
          phone
        )
      `)
      .eq('user_id', userId)
      .is('cancelled_at', null)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Combine and sort by date
    const activities = [
      ...recentMessages.map(m => ({
        type: 'message',
        id: m.id,
        timestamp: m.created_at,
        data: m
      })),
      ...recentCampaigns.map(c => ({
        type: 'campaign',
        id: c.id,
        timestamp: c.created_at,
        data: c
      })),
      ...recentAppointments.map(a => ({
        type: 'appointment',
        id: a.id,
        timestamp: a.start_time,
        data: a
      }))
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    logger.error('Get recent activity error:', error);
    throw error;
  }
});

export default {
  getDashboardStats,
  getRecentActivity
};
