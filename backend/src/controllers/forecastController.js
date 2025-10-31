import { supabaseAdmin } from '../config/database.js';

/**
 * Financial Forecast Controller
 * Gerencia previsões financeiras baseadas em produtos e agendamentos
 */

/**
 * GET /api/forecast/monthly
 * Obtém previsão financeira mensal
 */
export const getMonthlyForecast = async (req, res) => {
  try {
    const userId = req.user.id;
    const { months = 3 } = req.query; // Número de meses para frente

    const forecasts = [];

    for (let i = 0; i < parseInt(months); i++) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + i);
      targetDate.setDate(1); // Primeiro dia do mês

      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

      // Buscar oportunidades com data de fechamento no mês
      const { data: opportunities, error } = await supabaseAdmin
        .from('contact_products')
        .select(`
          *,
          contacts!inner(id, name, phone, user_id),
          products(id, name, price, category)
        `)
        .eq('contacts.user_id', userId)
        .gte('expected_close_date', monthStart.toISOString().split('T')[0])
        .lte('expected_close_date', monthEnd.toISOString().split('T')[0])
        .not('deal_status', 'in', '(won,lost)');

      if (error) throw error;

      // Calcular métricas
      const totalDeals = opportunities.length;
      const totalValue = opportunities.reduce((sum, opp) => {
        const value = opp.deal_value || opp.products?.price || 0;
        return sum + value;
      }, 0);

      const weightedValue = opportunities.reduce((sum, opp) => {
        const value = opp.deal_value || opp.products?.price || 0;
        const probability = opp.deal_probability || 50;
        return sum + (value * (probability / 100));
      }, 0);

      // Agrupar por status
      const byStatus = opportunities.reduce((acc, opp) => {
        const status = opp.deal_status || 'lead';
        if (!acc[status]) {
          acc[status] = { count: 0, value: 0, weighted: 0 };
        }
        const value = opp.deal_value || opp.products?.price || 0;
        const probability = opp.deal_probability || 50;

        acc[status].count++;
        acc[status].value += value;
        acc[status].weighted += value * (probability / 100);
        return acc;
      }, {});

      forecasts.push({
        month: monthStart.toISOString().split('T')[0],
        monthLabel: monthStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        totalDeals,
        totalValue,
        weightedValue,
        avgProbability: totalDeals > 0 ? opportunities.reduce((sum, o) => sum + (o.deal_probability || 50), 0) / totalDeals : 0,
        byStatus
      });
    }

    res.json({
      success: true,
      data: forecasts
    });
  } catch (error) {
    console.error('Error getting monthly forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter previsão mensal',
      error: error.message
    });
  }
};

/**
 * GET /api/forecast/pipeline
 * Obtém pipeline de vendas completo
 */
export const getSalesPipeline = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, orderBy = 'expected_close_date' } = req.query;

    let query = supabaseAdmin
      .from('contact_products')
      .select(`
        *,
        contacts!inner(id, name, phone, email, user_id),
        products(id, name, price, category, description)
      `)
      .eq('contacts.user_id', userId)
      .not('deal_status', 'in', '(won,lost)');

    if (status) {
      query = query.eq('deal_status', status);
    }

    query = query.order(orderBy, { ascending: true, nullsFirst: false });

    const { data: opportunities, error } = await query;

    if (error) throw error;

    // Enriquecer com cálculos
    const enrichedOpportunities = opportunities.map(opp => {
      const value = opp.deal_value || opp.products?.price || 0;
      const probability = opp.deal_probability || 50;
      const weightedValue = value * (probability / 100);

      let daysToClose = null;
      if (opp.expected_close_date) {
        const closeDate = new Date(opp.expected_close_date);
        const today = new Date();
        daysToClose = Math.ceil((closeDate - today) / (1000 * 60 * 60 * 24));
      }

      return {
        ...opp,
        value,
        weightedValue,
        daysToClose
      };
    });

    // Calcular totais por status
    const summary = {
      total: enrichedOpportunities.length,
      totalValue: enrichedOpportunities.reduce((sum, o) => sum + o.value, 0),
      totalWeighted: enrichedOpportunities.reduce((sum, o) => sum + o.weightedValue, 0),
      byStatus: {}
    };

    const statusGroups = ['lead', 'qualified', 'negotiating', 'proposal', 'closing'];
    statusGroups.forEach(status => {
      const items = enrichedOpportunities.filter(o => o.deal_status === status);
      summary.byStatus[status] = {
        count: items.length,
        value: items.reduce((sum, o) => sum + o.value, 0),
        weighted: items.reduce((sum, o) => sum + o.weightedValue, 0)
      };
    });

    res.json({
      success: true,
      data: {
        opportunities: enrichedOpportunities,
        summary
      }
    });
  } catch (error) {
    console.error('Error getting sales pipeline:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter pipeline de vendas',
      error: error.message
    });
  }
};

/**
 * PUT /api/forecast/opportunities/:id
 * Atualiza oportunidade (deal)
 */
export const updateOpportunity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { expected_close_date, deal_value, deal_probability, deal_status, notes } = req.body;

    // Verificar permissão
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('contact_products')
      .select('*, contacts!inner(user_id)')
      .eq('id', id)
      .eq('contacts.user_id', userId)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Oportunidade não encontrada'
      });
    }

    const updateData = {};
    if (expected_close_date !== undefined) updateData.expected_close_date = expected_close_date;
    if (deal_value !== undefined) updateData.deal_value = deal_value;
    if (deal_probability !== undefined) updateData.deal_probability = deal_probability;
    if (deal_status !== undefined) updateData.deal_status = deal_status;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabaseAdmin
      .from('contact_products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      message: 'Oportunidade atualizada com sucesso'
    });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar oportunidade',
      error: error.message
    });
  }
};

/**
 * GET /api/forecast/stats
 * Obtém estatísticas gerais do forecast
 */
export const getForecastStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar todas as oportunidades ativas
    const { data: opportunities, error } = await supabaseAdmin
      .from('contact_products')
      .select(`
        *,
        contacts!inner(id, user_id),
        products(id, price)
      `)
      .eq('contacts.user_id', userId)
      .not('deal_status', 'in', '(won,lost)');

    if (error) throw error;

    // Oportunidades com data de fechamento definida
    const withDate = opportunities.filter(o => o.expected_close_date);
    const withoutDate = opportunities.filter(o => !o.expected_close_date);

    // Com agendamento
    const { data: withAppointment, error: aptError } = await supabaseAdmin
      .from('appointments')
      .select('contact_id')
      .in('status', ['scheduled', 'confirmed'])
      .in('contact_id', opportunities.map(o => o.contact_id));

    if (aptError) console.error('Error fetching appointments:', aptError);

    const appointmentContactIds = new Set(withAppointment?.map(a => a.contact_id) || []);

    res.json({
      success: true,
      data: {
        total: opportunities.length,
        withExpectedDate: withDate.length,
        withoutExpectedDate: withoutDate.length,
        withAppointment: opportunities.filter(o => appointmentContactIds.has(o.contact_id)).length,
        withoutAppointment: opportunities.filter(o => !appointmentContactIds.has(o.contact_id)).length
      }
    });
  } catch (error) {
    console.error('Error getting forecast stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas',
      error: error.message
    });
  }
};
