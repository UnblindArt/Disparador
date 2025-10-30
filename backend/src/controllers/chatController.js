import { supabaseAdmin } from '../config/database.js';
import evolutionService from '../services/evolutionService.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import logger from '../config/logger.js';

/**
 * Helper function to get or create contact
 */
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
        opt_in_status: 'opted_in',
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

/**
 * Get conversation history for a specific contact/chat
 * GET /api/chat/:instanceName/:phone
 */
export const getConversation = asyncHandler(async (req, res) => {
  const { instanceName, phone } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  const userId = req.user.id;

  logger.info('\n💬 GET CONVERSATION');
  logger.info('User ID:', userId);
  logger.info('Instance:', instanceName);
  logger.info('Phone:', phone);

  // Verify instance belongs to user
  const { data: instance, error: instanceError } = await supabaseAdmin
    .from('whatsapp_instances')
    .select('*')
    .eq('instance_name', instanceName)
    .eq('user_id', userId)
    .single();

  if (instanceError || !instance) {
    return res.status(404).json({
      success: false,
      message: 'Instância não encontrada ou você não tem permissão'
    });
  }

  // Get messages from database (both inbound and outbound)
  const { data: messages, error: messagesError, count } = await supabaseAdmin
    .from('messages')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

  if (messagesError) {
    logger.error('Error fetching messages:', messagesError);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar mensagens'
    });
  }

  // Format messages for chat display
  const formattedMessages = messages.map(msg => ({
    id: msg.id,
    message: msg.content,
    direction: msg.direction,
    status: msg.status,
    timestamp: msg.created_at || msg.sent_at || msg.delivered_at,
    mediaUrl: msg.metadata?.media_url,
    mediaType: msg.metadata?.media_type,
    metadata: msg.metadata
  })).reverse(); // Reverse to show oldest first

  logger.info(`✅ ${messages.length} messages found`);

  // Mark inbound messages as read when conversation is opened
  await supabaseAdmin
    .from('messages')
    .update({
      read_at: new Date().toISOString(),
      status: 'read'
    })
    .eq('user_id', userId)
    .eq('phone', phone)
    .eq('direction', 'inbound')
    .is('read_at', null);

  logger.info('✅ Inbound messages marked as read');

  res.json({
    success: true,
    data: {
      phone,
      instanceName,
      messages: formattedMessages,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
});

/**
 * Get all conversations (list of chats with last message)
 * GET /api/chat/:instanceName
 */
export const getAllConversations = asyncHandler(async (req, res) => {
  const { instanceName } = req.params;
  const userId = req.user.id;

  logger.info('\n📬 GET ALL CONVERSATIONS');
  logger.info('User ID:', userId);
  logger.info('Instance:', instanceName);

  // Verify instance belongs to user
  const { data: instance, error: instanceError } = await supabaseAdmin
    .from('whatsapp_instances')
    .select('*')
    .eq('instance_name', instanceName)
    .eq('user_id', userId)
    .single();

  if (instanceError || !instance) {
    return res.status(404).json({
      success: false,
      message: 'Instância não encontrada ou você não tem permissão'
    });
  }

  // Get unique phone numbers with last message
  const { data: conversations, error } = await supabaseAdmin
    .rpc('get_conversations_with_last_message', {
      p_user_id: userId
    });

  if (error) {
    logger.warn('RPC function not available, using fallback query');

    // Fallback: Get messages grouped by phone
    const { data: allMessages, error: msgError } = await supabaseAdmin
      .from('messages')
      .select('phone, content, created_at, sent_at, delivered_at, direction, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (msgError) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar conversas'
      });
    }

    // Group by phone manually
    const conversationsMap = new Map();

    for (const msg of allMessages) {
      if (!conversationsMap.has(msg.phone)) {
        conversationsMap.set(msg.phone, {
          phone: msg.phone,
          lastMessage: msg.content,
          lastMessageTime: msg.created_at || msg.sent_at || msg.delivered_at,
          lastMessageDirection: msg.direction,
          unreadCount: 0
        });
      }
    }

    const conversationsList = Array.from(conversationsMap.values())
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    return res.json({
      success: true,
      data: conversationsList
    });
  }

  res.json({
    success: true,
    data: conversations || []
  });
});

/**
 * Send a message in a conversation
 * POST /api/chat/:instanceName/:phone
 * Body: { message, mediaUrl, mediaType, audioUrl, stickerUrl, contactData, messageType }
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { instanceName, phone } = req.params;
  const {
    message,
    mediaUrl,
    mediaType = 'image',
    audioUrl,
    stickerUrl,
    contactData,
    messageType = 'text' // text, media, audio, sticker, contact
  } = req.body;
  const userId = req.user.id;

  logger.info('\n💬 SEND MESSAGE');
  logger.info('User ID:', userId);
  logger.info('Instance:', instanceName);
  logger.info('Phone:', phone);
  logger.info('Message Type:', messageType);
  logger.info('Message:', message?.substring(0, 50));

  // Verify instance belongs to user
  const { data: instance, error: instanceError } = await supabaseAdmin
    .from('whatsapp_instances')
    .select('*')
    .eq('instance_name', instanceName)
    .eq('user_id', userId)
    .single();

  if (instanceError || !instance) {
    return res.status(404).json({
      success: false,
      message: 'Instância não encontrada ou você não tem permissão'
    });
  }

  try {
    // Get or create contact
    const contactId = await getOrCreateContact(userId, phone);

    let evolutionResult;
    let displayMessage = message;
    let finalMediaUrl = mediaUrl;
    let finalMediaType = mediaType;

    // Send via Evolution API based on message type
    switch (messageType) {
      case 'audio':
        evolutionResult = await evolutionService.sendAudioMessage(
          instanceName,
          phone,
          audioUrl,
          true // isVoice (PTT)
        );
        displayMessage = '[Áudio]';
        finalMediaUrl = audioUrl;
        finalMediaType = 'audio';
        break;

      case 'sticker':
        evolutionResult = await evolutionService.sendStickerMessage(
          instanceName,
          phone,
          stickerUrl
        );
        displayMessage = '[Figurinha]';
        finalMediaUrl = stickerUrl;
        finalMediaType = 'sticker';
        break;

      case 'contact':
        evolutionResult = await evolutionService.sendContactMessage(
          instanceName,
          phone,
          contactData
        );
        displayMessage = `[Contato: ${contactData.fullName}]`;
        finalMediaType = 'contact';
        break;

      case 'media':
        evolutionResult = await evolutionService.sendMediaMessage(
          instanceName,
          phone,
          mediaUrl,
          message || '',
          mediaType
        );
        displayMessage = message || `[${mediaType}]`;
        break;

      case 'text':
      default:
        evolutionResult = await evolutionService.sendTextMessage(
          instanceName,
          phone,
          message
        );
        break;
    }

    if (!evolutionResult.success) {
      throw new Error(evolutionResult.error || 'Erro ao enviar mensagem');
    }

    // Store message in database
    const { data: savedMessage, error: saveError } = await supabaseAdmin
      .from('messages')
      .insert({
        user_id: userId,
        contact_id: contactId,
        phone: phone,
        content: displayMessage,
        direction: 'outbound',
        status: 'sent',
        evolution_message_id: evolutionResult.data?.key?.id,
        metadata: {
          whatsapp_instance: instanceName,
          message_type: messageType,
          media_url: finalMediaUrl,
          media_type: finalMediaType,
          evolution_response: evolutionResult.data,
          contact_data: contactData || null
        },
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saveError) {
      logger.error('Error saving message:', saveError);
    }

    logger.info('✅ Message sent successfully');

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: savedMessage
    });

  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao enviar mensagem'
    });
  }
});

export default {
  getConversation,
  getAllConversations,
  sendMessage,
};
