import logger from '../config/logger.js';
import { redis } from '../config/redis.js';
import { supabaseAdmin } from '../config/database.js';
import fs from 'fs';

// Store to hold QR codes temporarily (5 minutes TTL)
const QR_CODE_TTL = 300; // 5 minutes in seconds

// Helper function to get or create contact
async function getOrCreateContact(userId, phone, name = null) {
  try {
    // Check if contact exists
    let { data: contact, error: findError } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('user_id', userId)
      .eq('phone', phone)
      .single();

    if (findError && findError.code !== 'PGRST116') { // PGRST116 = not found
      throw findError;
    }

    if (contact) {
      return contact.id;
    }

    // Create new contact
    const { data: newContact, error: createError} = await supabaseAdmin
      .from('contacts')
      .insert({
        user_id: userId,
        phone: phone,
        name: name || phone,
        opt_in_status: 'opted_in', // contatos que enviam mensagens são opt-in
        opt_in_at: new Date().toISOString(),
        last_message_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (createError) {
      throw createError;
    }

    logger.info('✅ New contact created:', { phone, name });
    return newContact.id;
  } catch (error) {
    logger.error('Error in getOrCreateContact:', error);
    throw error;
  }
}

// Webhook handler for Evolution API events
export async function handleEvolutionWebhook(req, res, next) {
  const startTime = Date.now();

  try {
    const { event, instance, data } = req.body;

    logger.info('\n========================================');
    logger.info('🔔 EVOLUTION WEBHOOK RECEIVED');
    logger.info('========================================');
    logger.info('Timestamp:', new Date().toISOString());
    logger.info('Event Type:', event);
    logger.info('Instance:', instance?.instanceName || instance || 'unknown');
    logger.info('Headers:', JSON.stringify({
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'x-forwarded-for': req.headers['x-forwarded-for']
    }));
    logger.info('Body Keys:', Object.keys(req.body));

    // Log to file for debugging
    try {
      fs.appendFileSync('/tmp/webhook-debug.log',
        `\n\n=== ${new Date().toISOString()} ===\n` +
        `Event: ${event}\n` +
        `Body: ${JSON.stringify(req.body, null, 2)}\n`
      );
    } catch (e) {
      logger.error('Error writing debug log:', e.message);
    }

    logger.info('Full Body:', JSON.stringify(req.body, null, 2));

    // Handle QR Code update event
    if (event === 'qrcode.updated' || event === 'QRCODE_UPDATED') {
      logger.info('\n📱 Processing QR CODE UPDATE event...');

      const instanceName = instance?.instanceName || instance;
      const qrCode = data?.qrcode || data?.base64 || data?.code || data;

      logger.info('QR Code Event Details:', {
        instanceName,
        hasQrCode: !!qrCode,
        qrCodeType: typeof qrCode,
        qrCodeKeys: qrCode && typeof qrCode === 'object' ? Object.keys(qrCode) : 'not-object',
        qrCodeLength: typeof qrCode === 'string' ? qrCode.length : 'not-string',
        dataKeys: data ? Object.keys(data) : []
      });

      if (instanceName && qrCode) {
        // Store QR code in Redis with TTL
        const key = `qrcode:${instanceName}`;
        const qrCodeData = {
          qrcode: qrCode,
          timestamp: Date.now(),
          event,
          pairingCode: data?.pairingCode || null
        };

        await redis.setex(key, QR_CODE_TTL, JSON.stringify(qrCodeData));

        logger.info('✅ QR Code stored successfully in Redis:', {
          instanceName,
          key,
          ttl: QR_CODE_TTL,
          dataSize: JSON.stringify(qrCodeData).length,
          hasPairingCode: !!data?.pairingCode
        });
      } else {
        logger.warn('⚠️ QR Code event missing required data:', {
          hasInstanceName: !!instanceName,
          hasQrCode: !!qrCode,
          instanceName,
          dataStructure: JSON.stringify(data).substring(0, 200)
        });
      }
    }

    // Handle connection update event
    if (event === 'connection.update' || event === 'CONNECTION_UPDATE') {
      logger.info('\n🔌 Processing CONNECTION UPDATE event...');

      const instanceName = instance?.instanceName || instance;
      const state = data?.state || data?.status;

      logger.info('Connection Details:', {
        instanceName,
        state,
        dataKeys: data ? Object.keys(data) : [],
        fullData: JSON.stringify(data).substring(0, 200)
      });

      // If connected, remove QR code from cache
      if (state === 'open' || state === 'connected') {
        const key = `qrcode:${instanceName}`;
        const deleted = await redis.del(key);

        logger.info('✅ Connection established - QR Code removed from cache:', {
          instanceName,
          key,
          wasDeleted: deleted > 0
        });
      }
    }

    // Handle send message event (mensagens enviadas)
    if (event === 'send.message' || event === 'SEND_MESSAGE') {
      logger.info('\n📤 Processing SEND MESSAGE event...');

      const instanceName = instance?.instanceName || instance;
      const messageData = data;

      if (messageData && messageData.key) {
        try {
          const phone = messageData.key.remoteJid?.replace(/@.*$/, '');
          const remoteJid = messageData.key.remoteJid;
          const isGroup = remoteJid?.includes('@g.us');

          // Extrair texto da mensagem
          let messageText = '';
          if (messageData.message?.conversation) {
            messageText = messageData.message.conversation;
          } else if (messageData.message?.extendedTextMessage) {
            messageText = messageData.message.extendedTextMessage.text || '';
          } else {
            messageText = `[${messageData.messageType}]`;
          }

          // Find instance owner
          let cachedUserId = await redis.get(`instance:${instanceName}:user_id`);
          let userId = cachedUserId;

          if (!userId) {
            const { data: whatsappInstance } = await supabaseAdmin
              .from('whatsapp_instances')
              .select('user_id')
              .eq('instance_name', instanceName)
              .single();

            if (whatsappInstance?.user_id) {
              userId = whatsappInstance.user_id;
              await redis.setex(`instance:${instanceName}:user_id`, 3600, userId);
            }
          }

          if (userId) {
            // Get or create contact
            const contactId = await getOrCreateContact(userId, phone, messageData.pushName);

            // Store sent message
            const { error: messageError } = await supabaseAdmin
              .from('messages')
              .insert({
                user_id: userId,
                contact_id: contactId,
                phone: phone,
                content: messageText,
                direction: 'outbound',
                status: messageData.status?.toLowerCase() || 'sent',
                evolution_message_id: messageData.key?.id,
                metadata: {
                  whatsapp_instance: instanceName,
                  message_type: messageData.messageType,
                  remote_jid: remoteJid,
                  from_me: true,
                  push_name: messageData.pushName,
                  message_timestamp: messageData.messageTimestamp,
                  is_group: isGroup,
                  group_id: isGroup ? remoteJid : null,
                  raw_message: messageData.message
                },
                sent_at: new Date(parseInt(messageData.messageTimestamp) * 1000).toISOString()
              });

            if (messageError) {
              logger.error('Error storing sent message:', messageError);
            } else {
              logger.info('✅ Sent message stored:', {
                phone,
                instanceName,
                messageId: messageData.key?.id,
                text: messageText.substring(0, 50)
              });
            }
          }
        } catch (error) {
          logger.error('Error processing send.message:', error.message);
        }
      }
    }

    // Handle messages upsert event (mensagens recebidas)
    if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
      logger.info('\n💬 Processing MESSAGES UPSERT event...');

      const instanceName = instance?.instanceName || instance;

      // Evolution API v2 pode enviar em diferentes estruturas:
      // - Array: data.messages = [{key, message, ...}]
      // - Objeto direto: data = {key, message, ...}
      let messagesArray = [];

      if (data?.messages && Array.isArray(data.messages)) {
        // Estrutura com array
        messagesArray = data.messages;
      } else if (data?.key && data?.message) {
        // Estrutura com objeto direto (data É a mensagem)
        messagesArray = [data];
      }

      logger.info('Message Details:', {
        instanceName,
        messageCount: messagesArray.length,
        dataStructure: {
          hasMessages: !!data?.messages,
          hasKey: !!data?.key,
          hasMessage: !!data?.message,
          dataKeys: data ? Object.keys(data).slice(0, 10) : []
        },
        firstMessage: messagesArray[0] ? {
          from: messagesArray[0].key?.remoteJid,
          id: messagesArray[0].key?.id,
          hasContent: !!messagesArray[0].message,
          messageType: messagesArray[0].messageType
        } : null
      });

      // Store ALL messages (including fromMe - sent from phone)
      for (const msg of messagesArray) {
        try {
          const fromMe = msg.key?.fromMe || false;

          logger.info(`Processing message (fromMe: ${fromMe})`);

          const remoteJid = msg.key?.remoteJid;
          const isGroup = remoteJid?.includes('@g.us');

          // Se for grupo, pegar phone do participant, senão do remoteJid
          let phone;
          if (isGroup && msg.key?.participant) {
            phone = msg.key.participant.replace(/@.*$/, '');
          } else if (isGroup && msg.key?.participantAlt) {
            phone = msg.key.participantAlt.replace(/@.*$/, '');
          } else {
            phone = remoteJid?.replace(/@.*$/, '');
          }

          // Skip se não conseguiu extrair phone
          if (!phone) {
            logger.warn('Could not extract phone from message:', {
              remoteJid,
              participant: msg.key?.participant,
              participantAlt: msg.key?.participantAlt
            });
            continue;
          }

          // Extrair conteúdo da mensagem
          const msgContent = msg.message || {};
          const messageType = Object.keys(msgContent)[0];

          let messageText = '';
          let mediaUrl = null;
          let mediaType = null;
          let mimeType = null;
          let caption = null;
          let thumbnail = null;
          let duration = null;
          let fileSize = null;
          let fileName = null;

          // Processar diferentes tipos de mensagem
          if (msgContent.conversation) {
            messageText = msgContent.conversation;
          } else if (msgContent.extendedTextMessage) {
            messageText = msgContent.extendedTextMessage.text || '';
          } else if (msgContent.imageMessage) {
            caption = msgContent.imageMessage.caption || '';
            messageText = caption || '[Imagem]';
            mediaUrl = msgContent.imageMessage.url;
            mediaType = 'image';
            mimeType = msgContent.imageMessage.mimetype;
            fileSize = msgContent.imageMessage.fileLength;
            thumbnail = msgContent.imageMessage.jpegThumbnail;
          } else if (msgContent.videoMessage) {
            caption = msgContent.videoMessage.caption || '';
            messageText = caption || '[Vídeo]';
            mediaUrl = msgContent.videoMessage.url;
            mediaType = 'video';
            mimeType = msgContent.videoMessage.mimetype;
            fileSize = msgContent.videoMessage.fileLength;
            duration = msgContent.videoMessage.seconds;
          } else if (msgContent.audioMessage) {
            messageText = '[Áudio]';
            mediaUrl = msgContent.audioMessage.url;
            mediaType = 'audio';
            mimeType = msgContent.audioMessage.mimetype;
            fileSize = msgContent.audioMessage.fileLength;
            duration = msgContent.audioMessage.seconds;
          } else if (msgContent.documentMessage) {
            fileName = msgContent.documentMessage.fileName || 'document';
            caption = msgContent.documentMessage.caption || '';
            messageText = caption || `[Documento: ${fileName}]`;
            mediaUrl = msgContent.documentMessage.url;
            mediaType = 'document';
            mimeType = msgContent.documentMessage.mimetype;
            fileSize = msgContent.documentMessage.fileLength;
          } else if (msgContent.stickerMessage) {
            messageText = '[Sticker]';
            mediaUrl = msgContent.stickerMessage.url;
            mediaType = 'sticker';
            mimeType = msgContent.stickerMessage.mimetype;
          } else {
            messageText = `[${messageType}]`;
          }

          // Find instance owner
          let cachedUserId = await redis.get(`instance:${instanceName}:user_id`);
          let userId = cachedUserId;

          if (!userId) {
            const { data: whatsappInstance } = await supabaseAdmin
              .from('whatsapp_instances')
              .select('user_id')
              .eq('instance_name', instanceName)
              .single();

            if (whatsappInstance?.user_id) {
              userId = whatsappInstance.user_id;
              await redis.setex(`instance:${instanceName}:user_id`, 3600, userId);
            }
          }

          if (userId) {
            // Get or create contact
            const contactId = await getOrCreateContact(userId, phone, msg.pushName || data?.pushName);

            // Store message com dados completos
            const { data: storedMessage, error: messageError } = await supabaseAdmin
              .from('messages')
              .insert({
                user_id: userId,
                contact_id: contactId,
                phone: phone,
                content: messageText,
                direction: fromMe ? 'outbound' : 'inbound',  // ✅ Corrigido: usar fromMe
                status: fromMe ? 'sent' : 'delivered',  // ✅ Corrigido: fromMe = sent, inbound = delivered
                evolution_message_id: msg.key?.id,
                metadata: {
                  whatsapp_instance: instanceName,
                  message_type: messageType,
                  remote_jid: remoteJid,
                  from_me: fromMe,  // ✅ Corrigido: usar variável fromMe
                  push_name: msg.pushName || data?.pushName,
                  participant: msg.key?.participant,
                  message_timestamp: msg.messageTimestamp,
                  is_group: isGroup,
                  group_id: isGroup ? remoteJid : null,
                  media_url: mediaUrl,
                  media_type: mediaType,
                  caption: caption,
                  mime_type: mimeType,
                  duration: duration,
                  file_size: fileSize,
                  raw_message: msgContent
                },
                delivered_at: fromMe ? null : new Date(parseInt(msg.messageTimestamp) * 1000).toISOString(),  // ✅ delivered_at apenas se inbound
                sent_at: fromMe ? new Date(parseInt(msg.messageTimestamp) * 1000).toISOString() : null  // ✅ sent_at apenas se fromMe
              })
              .select()
              .single();

            if (messageError) {
              logger.error('Error storing message:', messageError);
            } else {
              logger.info('✅ Message stored with full details:', {
                phone,
                instanceName,
                messageId: msg.key?.id,
                messageType,
                hasMedia: !!mediaUrl
              });
            }
          }
        } catch (msgError) {
          logger.error('Error storing message:', msgError.message, msgError.stack);
        }
      }
    }

    // Handle messages update event (para status de entrega/leitura)
    if (event === 'messages.update' || event === 'MESSAGES_UPDATE') {
      logger.info('\n📬 Processing MESSAGES UPDATE event...');

      const instanceName = instance?.instanceName || instance;
      const updates = data?.messages || data || [];

      for (const update of Array.isArray(updates) ? updates : [updates]) {
        try {
          const messageId = update.key?.id || update.id;
          const status = update.update?.status || update.status;

          if (messageId && status) {
            const updateData = {
              status: status,
              updated_at: new Date().toISOString()
            };

            if (status === 'delivered') {
              updateData.delivered_at = new Date().toISOString();
            } else if (status === 'read') {
              updateData.read_at = new Date().toISOString();
            }

            await supabaseAdmin
              .from('messages')
              .update(updateData)
              .eq('evolution_message_id', messageId);

            logger.info('✅ Message status updated:', { messageId, status });
          }
        } catch (updateError) {
          logger.error('Error updating message status:', updateError.message);
        }
      }
    }

    const processingTime = Date.now() - startTime;
    logger.info('\n✅ Webhook processed successfully');
    logger.info('Processing time:', processingTime, 'ms');
    logger.info('========================================\n');

    res.json({
      success: true,
      message: 'Webhook processed',
      processingTime,
      event
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error('\n❌ WEBHOOK PROCESSING ERROR');
    logger.error('Error message:', error.message);
    logger.error('Error stack:', error.stack);
    logger.error('Processing time:', processingTime, 'ms');
    logger.error('Request body:', JSON.stringify(req.body).substring(0, 500));
    logger.error('========================================\n');

    // Don't throw error to Evolution API, just log it and return success
    res.json({
      success: true,
      message: 'Webhook received (with errors)',
      error: error.message
    });
  }
}

// Get QR code from cache
export async function getQRCodeFromCache(req, res, next) {
  try {
    const { instanceName } = req.params;

    const key = `qrcode:${instanceName}`;
    const cached = await redis.get(key);

    if (!cached) {
      return res.status(404).json({
        success: false,
        message: 'QR Code não disponível. Aguardando geração...',
      });
    }

    const data = JSON.parse(cached);

    res.json({
      success: true,
      data: {
        instance: { instanceName },
        qrcode: {
          base64: data.qrcode.base64 || data.qrcode,
          code: data.qrcode.code || data.qrcode,
        },
        timestamp: data.timestamp,
      },
    });
  } catch (error) {
    logger.error('Error getting QR code from cache:', error);
    next(error);
  }
}

// Test webhook endpoint
export async function testWebhook(req, res, next) {
  try {
    logger.info('\n🧪 TESTING WEBHOOK ENDPOINT');

    const testPayload = {
      event: 'QRCODE_UPDATED',
      instance: {
        instanceName: 'test-webhook'
      },
      data: {
        qrcode: {
          base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          code: 'TEST_QR_CODE'
        },
        pairingCode: '12345678'
      }
    };

    logger.info('Test Payload:', JSON.stringify(testPayload, null, 2));

    // Check Redis connection
    try {
      await redis.ping();
      logger.info('✅ Redis connection OK');
    } catch (redisError) {
      logger.error('❌ Redis connection failed:', redisError.message);
      return res.status(500).json({
        success: false,
        message: 'Redis connection failed',
        error: redisError.message
      });
    }

    res.json({
      success: true,
      message: 'Webhook test endpoint is working',
      redisConnected: true,
      testPayload,
      info: 'Send a POST request with Evolution API webhook format to test the webhook handler'
    });

  } catch (error) {
    logger.error('❌ Test webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export default {
  handleEvolutionWebhook,
  getQRCodeFromCache,
  testWebhook,
};
