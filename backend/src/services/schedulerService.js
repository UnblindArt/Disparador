import { supabaseAdmin } from '../config/database.js';
import evolutionService from './evolutionService.js';
import logger from '../config/logger.js';
import cron from 'node-cron';

/**
 * Scheduler Service
 * Gerencia agendamento automático de mensagens com cadências personalizadas
 */

class SchedulerService {
  constructor() {
    this.jobs = new Map(); // Armazena jobs ativos do cron
    this.isRunning = false;
  }

  /**
   * Substituir variáveis dinâmicas no texto
   * Suporta: {nome}, {telefone}, {email}, {empresa}, etc
   */
  replaceVariables(text, recipient) {
    if (!text) return text;

    let result = text;

    // Variáveis padrão
    const variables = {
      nome: recipient.name || '',
      telefone: recipient.phone || '',
      email: recipient.email || '',
      empresa: recipient.company || '',
      ...(recipient.custom_fields || {})
    };

    // Substituir todas as variáveis
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{${key}\\}`, 'gi');
      result = result.replace(regex, variables[key] || '');
    });

    return result;
  }

  /**
   * Calcular próximo horário de envio baseado na cadência
   */
  calculateNextSendTime(campaign, currentSequence = 1, lastSendTime = null) {
    const now = new Date();
    let nextTime = lastSendTime ? new Date(lastSendTime) : now;

    // Obter mensagem da sequência
    const messageDelay = currentSequence > 1 ? this.getMessageDelay(campaign, currentSequence) : 0;

    // Adicionar delay da mensagem (em minutos)
    if (messageDelay > 0) {
      nextTime.setMinutes(nextTime.getMinutes() + messageDelay);
    } else {
      // Usar cadência da campanha
      nextTime = this.applyCadence(nextTime, campaign.cadence_type, campaign.cadence_config);
    }

    // Ajustar para horário comercial
    nextTime = this.adjustToBusinessHours(nextTime, campaign);

    return nextTime;
  }

  /**
   * Aplicar cadência ao horário
   */
  applyCadence(baseTime, cadenceType, cadenceConfig = {}) {
    const nextTime = new Date(baseTime);

    switch (cadenceType) {
      case 'imediato':
        // Nenhum delay
        break;

      case 'diario':
        nextTime.setDate(nextTime.getDate() + 1);
        break;

      case 'cada-2-dias':
        nextTime.setDate(nextTime.getDate() + 2);
        break;

      case 'semanal':
        nextTime.setDate(nextTime.getDate() + 7);
        break;

      case 'quinzenal':
        nextTime.setDate(nextTime.getDate() + 14);
        break;

      case 'mensal':
        nextTime.setMonth(nextTime.getMonth() + 1);
        break;

      case 'trimestral':
        nextTime.setMonth(nextTime.getMonth() + 3);
        break;

      case 'semestral':
        nextTime.setMonth(nextTime.getMonth() + 6);
        break;

      case 'anual':
        nextTime.setFullYear(nextTime.getFullYear() + 1);
        break;

      case 'personalizado':
        if (cadenceConfig.days) nextTime.setDate(nextTime.getDate() + parseInt(cadenceConfig.days));
        if (cadenceConfig.hours) nextTime.setHours(nextTime.getHours() + parseInt(cadenceConfig.hours));
        if (cadenceConfig.minutes) nextTime.setMinutes(nextTime.getMinutes() + parseInt(cadenceConfig.minutes));
        break;
    }

    return nextTime;
  }

  /**
   * Ajustar para horário comercial
   */
  adjustToBusinessHours(time, campaign) {
    const nextTime = new Date(time);

    const sendStart = campaign.send_time_start || '08:00:00';
    const sendEnd = campaign.send_time_end || '18:00:00';

    const [startHour, startMin] = sendStart.split(':').map(Number);
    const [endHour, endMin] = sendEnd.split(':').map(Number);

    // Se for antes do horário comercial, ajustar para início
    if (nextTime.getHours() < startHour || (nextTime.getHours() === startHour && nextTime.getMinutes() < startMin)) {
      nextTime.setHours(startHour, startMin, 0);
    }

    // Se for depois do horário comercial, adiar para próximo dia
    if (nextTime.getHours() > endHour || (nextTime.getHours() === endHour && nextTime.getMinutes() > endMin)) {
      nextTime.setDate(nextTime.getDate() + 1);
      nextTime.setHours(startHour, startMin, 0);
    }

    // Pular finais de semana se necessário
    if (!campaign.send_on_weekends) {
      while (nextTime.getDay() === 0 || nextTime.getDay() === 6) {
        nextTime.setDate(nextTime.getDate() + 1);
        nextTime.setHours(startHour, startMin, 0);
      }
    }

    return nextTime;
  }

  /**
   * Obter delay da mensagem na sequência
   */
  getMessageDelay(campaign, sequence) {
    // Aqui você buscaria da tabela campaign_messages
    // Por enquanto retorna 0
    return 0;
  }

  /**
   * Processar jobs pendentes (executado a cada minuto)
   */
  async processScheduledJobs() {
    try {
      const now = new Date().toISOString();

      // Buscar jobs pendentes que devem ser executados agora
      const { data: jobs, error } = await supabaseAdmin
        .from('scheduled_jobs')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', now)
        .limit(100);

      if (error) throw error;

      logger.info(`[Scheduler] Found ${jobs?.length || 0} jobs to process`);

      // Processar cada job
      for (const job of jobs || []) {
        try {
          await this.processJob(job);
        } catch (error) {
          logger.error(`[Scheduler] Error processing job ${job.id}:`, error);

          // Marcar job como failed
          await supabaseAdmin
            .from('scheduled_jobs')
            .update({
              status: 'failed',
              error_message: error.message,
              retry_count: job.retry_count + 1,
              executed_at: new Date().toISOString(),
            })
            .eq('id', job.id);

          // Reagendar se não excedeu limite de retries
          if (job.retry_count < job.max_retries) {
            const retryTime = new Date();
            retryTime.setMinutes(retryTime.getMinutes() + 5); // Retry em 5 minutos

            await supabaseAdmin
              .from('scheduled_jobs')
              .update({
                status: 'pending',
                scheduled_at: retryTime.toISOString(),
              })
              .eq('id', job.id);
          }
        }
      }
    } catch (error) {
      logger.error('[Scheduler] Error in processScheduledJobs:', error);
    }
  }

  /**
   * Processar um job individual
   */
  async processJob(job) {
    logger.info(`[Scheduler] Processing job ${job.id} - ${job.job_type}`);

    // Marcar como processando
    await supabaseAdmin
      .from('scheduled_jobs')
      .update({ status: 'processing' })
      .eq('id', job.id);

    switch (job.job_type) {
      case 'campaign_message':
        await this.processCampaignMessage(job);
        break;

      case 'campaign_start':
        await this.processCampaignStart(job);
        break;

      default:
        logger.warn(`[Scheduler] Unknown job type: ${job.job_type}`);
    }

    // Marcar como concluído
    await supabaseAdmin
      .from('scheduled_jobs')
      .update({
        status: 'completed',
        executed_at: new Date().toISOString(),
      })
      .eq('id', job.id);
  }

  /**
   * Processar envio de mensagem de campanha
   */
  async processCampaignMessage(job) {
    const { campaign_id, campaign_recipient_id, message_sequence } = job.payload;

    // Buscar campanha
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();

    if (!campaign || campaign.status !== 'active') {
      logger.info(`[Scheduler] Campaign ${campaign_id} is not active, skipping`);
      return;
    }

    // Buscar destinatário
    const { data: recipient } = await supabaseAdmin
      .from('campaign_recipients')
      .select('*')
      .eq('id', campaign_recipient_id)
      .single();

    if (!recipient) {
      throw new Error(`Recipient ${campaign_recipient_id} not found`);
    }

    // Buscar mensagem da sequência
    const { data: campaignMessage } = await supabaseAdmin
      .from('campaign_messages')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('sequence_order', message_sequence)
      .single();

    if (!campaignMessage) {
      logger.info(`[Scheduler] No more messages in sequence for campaign ${campaign_id}`);

      // Marcar destinatário como concluído
      await supabaseAdmin
        .from('campaign_recipients')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', campaign_recipient_id);

      return;
    }

    // Substituir variáveis no conteúdo
    const messageContent = this.replaceVariables(campaignMessage.message_content, recipient);

    // Enviar mensagem via Evolution API
    let result;
    const instanceName = campaign.whatsapp_instance;

    try {
      if (campaignMessage.message_type === 'text') {
        result = await evolutionService.sendTextMessage(instanceName, recipient.phone, messageContent);
      } else if (campaignMessage.message_type === 'image' || campaignMessage.message_type === 'video' || campaignMessage.message_type === 'document') {
        result = await evolutionService.sendMediaMessage(instanceName, recipient.phone, {
          mediaUrl: campaignMessage.media_url,
          mediaType: campaignMessage.message_type,
          caption: messageContent,
        });
      } else if (campaignMessage.message_type === 'audio') {
        result = await evolutionService.sendAudioMessage(instanceName, recipient.phone, campaignMessage.media_url);
      }

      logger.info(`[Scheduler] Message sent to ${recipient.phone}`, result);

      // Salvar log de envio
      await supabaseAdmin
        .from('campaign_message_logs')
        .insert({
          campaign_id: campaign_id,
          campaign_recipient_id: campaign_recipient_id,
          campaign_message_id: campaignMessage.id,
          phone: recipient.phone,
          message_content: messageContent,
          message_type: campaignMessage.message_type,
          media_url: campaignMessage.media_url,
          status: 'sent',
          sent_at: new Date().toISOString(),
          external_message_id: result?.key?.id,
        });

      // Atualizar estatísticas do destinatário
      await supabaseAdmin
        .from('campaign_recipients')
        .update({
          status: 'sent',
          current_message_sequence: message_sequence,
          last_message_sent_at: new Date().toISOString(),
          total_messages_sent: recipient.total_messages_sent + 1,
        })
        .eq('id', campaign_recipient_id);

      // Agendar próxima mensagem se existir
      const { data: nextMessage } = await supabaseAdmin
        .from('campaign_messages')
        .select('*')
        .eq('campaign_id', campaign_id)
        .eq('sequence_order', message_sequence + 1)
        .single();

      if (nextMessage) {
        const nextSendTime = this.calculateNextSendTime(campaign, message_sequence + 1, new Date());

        // Criar próximo job
        await supabaseAdmin
          .from('scheduled_jobs')
          .insert({
            user_id: job.user_id,
            job_type: 'campaign_message',
            campaign_id: campaign_id,
            campaign_recipient_id: campaign_recipient_id,
            scheduled_at: nextSendTime.toISOString(),
            payload: {
              campaign_id: campaign_id,
              recipient_id: campaign_recipient_id,
              message_sequence: message_sequence + 1,
            },
          });

        // Atualizar próximo agendamento
        await supabaseAdmin
          .from('campaign_recipients')
          .update({
            next_message_scheduled_at: nextSendTime.toISOString(),
          })
          .eq('id', campaign_recipient_id);
      }

    } catch (error) {
      logger.error(`[Scheduler] Failed to send message:`, error);

      // Salvar log de erro
      await supabaseAdmin
        .from('campaign_message_logs')
        .insert({
          campaign_id: campaign_id,
          campaign_recipient_id: campaign_recipient_id,
          campaign_message_id: campaignMessage.id,
          phone: recipient.phone,
          message_content: messageContent,
          message_type: campaignMessage.message_type,
          status: 'failed',
          failed_at: new Date().toISOString(),
          error_message: error.message,
        });

      // Atualizar estatísticas
      await supabaseAdmin
        .from('campaign_recipients')
        .update({
          status: 'failed',
          error_message: error.message,
          error_count: recipient.error_count + 1,
          total_messages_failed: recipient.total_messages_failed + 1,
        })
        .eq('id', campaign_recipient_id);

      throw error;
    }
  }

  /**
   * Processar início de campanha
   */
  async processCampaignStart(job) {
    // Implementar lógica de início de campanha
    logger.info(`[Scheduler] Starting campaign ${job.campaign_id}`);
  }

  /**
   * Iniciar scheduler (executar a cada minuto)
   */
  start() {
    if (this.isRunning) {
      logger.warn('[Scheduler] Already running');
      return;
    }

    logger.info('[Scheduler] Starting scheduler service');

    // Executar a cada minuto
    const cronJob = cron.schedule('* * * * *', async () => {
      await this.processScheduledJobs();
    });

    this.jobs.set('main', cronJob);
    this.isRunning = true;

    logger.info('[Scheduler] Scheduler service started successfully');
  }

  /**
   * Parar scheduler
   */
  stop() {
    logger.info('[Scheduler] Stopping scheduler service');

    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`[Scheduler] Stopped job: ${name}`);
    });

    this.jobs.clear();
    this.isRunning = false;

    logger.info('[Scheduler] Scheduler service stopped');
  }
}

export default new SchedulerService();
