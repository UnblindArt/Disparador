import * as contactService from '../services/contactService.js';
import evolutionService from '../services/evolutionService.js';
import { supabaseAdmin } from '../config/database.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import logger from '../config/logger.js';

export const createContact = asyncHandler(async (req, res) => {
  const contact = await contactService.createContact(req.user.id, req.body);

  res.status(201).json({
    success: true,
    data: contact,
  });
});

export const getContacts = asyncHandler(async (req, res) => {
  const contacts = await contactService.getContacts(req.user.id, req.query);

  res.json({
    success: true,
    data: contacts,
  });
});

export const getContact = asyncHandler(async (req, res) => {
  const contact = await contactService.getContactById(req.user.id, req.params.id);

  res.json({
    success: true,
    data: contact,
  });
});

export const updateContact = asyncHandler(async (req, res) => {
  const contact = await contactService.updateContact(req.user.id, req.params.id, req.body);

  res.json({
    success: true,
    data: contact,
  });
});

export const deleteContact = asyncHandler(async (req, res) => {
  await contactService.deleteContact(req.user.id, req.params.id);

  res.json({
    success: true,
    message: 'Contact deleted successfully',
  });
});

export const bulkImport = asyncHandler(async (req, res) => {
  const contacts = await contactService.bulkImportContacts(req.user.id, req.body.contacts);

  res.status(201).json({
    success: true,
    data: contacts,
  });
});

export const updateOptIn = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const metadata = {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };

  const contact = await contactService.updateOptInStatus(req.user.id, req.params.id, status, metadata);

  res.json({
    success: true,
    data: contact,
  });
});

export const getStats = asyncHandler(async (req, res) => {
  const stats = await contactService.getContactStats(req.user.id);

  res.json({
    success: true,
    data: stats,
  });
});

/**
 * Sync contacts from WhatsApp (Evolution API)
 * GET /api/contacts/sync-whatsapp/:instanceName
 */
export const syncWhatsAppContacts = asyncHandler(async (req, res) => {
  const { instanceName } = req.params;
  const userId = req.user.id;

  logger.info('\n========================================');
  logger.info('📱 SINCRONIZAR CONTATOS DO WHATSAPP');
  logger.info('========================================');
  logger.info('User ID:', userId);
  logger.info('Instance Name:', instanceName);

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

  // Fetch contacts from Evolution API
  const evolutionResult = await evolutionService.fetchContacts(instanceName);

  if (!evolutionResult.success) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar contatos da Evolution API',
      error: evolutionResult.error
    });
  }

  const whatsappContacts = evolutionResult.contacts;
  logger.info(`📋 ${whatsappContacts.length} contatos encontrados no WhatsApp`);

  // Process and sync contacts to database
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const whatsContact of whatsappContacts) {
    try {
      // Extract phone number (remoteJid format: 5511999999999@s.whatsapp.net)
      const phone = whatsContact.id?.replace(/@.*$/, '') || whatsContact.remoteJid?.replace(/@.*$/, '');

      if (!phone || phone.includes('@g.us')) {
        // Skip groups
        skipped++;
        continue;
      }

      const contactData = {
        phone: phone,
        name: whatsContact.name || whatsContact.pushName || whatsContact.notify || phone,
        tags: ['whatsapp-sync'],
        custom_fields: {
          whatsapp_profile_pic: whatsContact.profilePicUrl,
          whatsapp_id: whatsContact.id,
          synced_at: new Date().toISOString()
        }
      };

      // Check if contact already exists
      const { data: existingContact } = await supabaseAdmin
        .from('contacts')
        .select('id, phone, name')
        .eq('user_id', userId)
        .eq('phone', phone)
        .eq('deleted_at', null)
        .single();

      if (existingContact) {
        // Update existing contact
        const { error: updateError } = await supabaseAdmin
          .from('contacts')
          .update({
            name: contactData.name,
            custom_fields: contactData.custom_fields,
            tags: existingContact.tags ? [...new Set([...existingContact.tags, 'whatsapp-sync'])] : ['whatsapp-sync'],
            updated_at: new Date().toISOString()
          })
          .eq('id', existingContact.id);

        if (!updateError) {
          updated++;
        }
      } else {
        // Create new contact
        const { error: insertError } = await supabaseAdmin
          .from('contacts')
          .insert({
            user_id: userId,
            ...contactData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (!insertError) {
          created++;
        }
      }
    } catch (error) {
      logger.error('Erro ao processar contato:', whatsContact.id, error.message);
      skipped++;
    }
  }

  // Note: last_sync_at column migration pending

  logger.info('✅ Sincronização concluída');
  logger.info(`Criados: ${created}, Atualizados: ${updated}, Ignorados: ${skipped}`);
  logger.info('========================================\n');

  res.json({
    success: true,
    message: 'Contatos sincronizados com sucesso',
    stats: {
      total: whatsappContacts.length,
      created,
      updated,
      skipped
    }
  });
});

/**
 * Get WhatsApp chats/conversations
 * GET /api/contacts/whatsapp-chats/:instanceName
 */
export const getWhatsAppChats = asyncHandler(async (req, res) => {
  const { instanceName } = req.params;
  const userId = req.user.id;

  logger.info('\n📬 BUSCAR CONVERSAS DO WHATSAPP');
  logger.info('User ID:', userId);
  logger.info('Instance Name:', instanceName);

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

  // Fetch chats from Evolution API
  const evolutionResult = await evolutionService.fetchChats(instanceName);

  if (!evolutionResult.success) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar conversas da Evolution API',
      error: evolutionResult.error
    });
  }

  // Get unread counts from database for each chat
  const phoneNumbers = evolutionResult.chats.map(chat =>
    chat.remoteJid?.replace(/@.*$/, '') || ''
  ).filter(phone => phone);

  const { data: unreadCounts } = await supabaseAdmin
    .from('messages')
    .select('phone')
    .eq('user_id', userId)
    .eq('direction', 'inbound')
    .is('read_at', null);

  // Count unread messages per phone
  const unreadMap = {};
  if (unreadCounts) {
    unreadCounts.forEach(msg => {
      unreadMap[msg.phone] = (unreadMap[msg.phone] || 0) + 1;
    });
  }

  // Map chats with database unread counts (include groups too)
  const chats = evolutionResult.chats
    .map(chat => {
      const phone = chat.remoteJid?.replace(/@.*$/, '') || '';
      return {
        id: chat.id,
        remoteJid: chat.remoteJid,
        name: chat.name,
        phone,
        profilePicUrl: chat.profilePicUrl,
        unreadCount: unreadMap[phone] || 0, // Use database count
        lastMessageTime: chat.conversationTimestamp,
        lastMessage: chat.lastMessage ? {
          text: chat.lastMessage.text || '',
          timestamp: chat.lastMessage.timestamp,
          fromMe: chat.lastMessage.fromMe
        } : null,
        isGroup: chat.isGroup
      };
    });

  logger.info(`✅ ${chats.length} conversas encontradas`);

  res.json({
    success: true,
    data: chats
  });
});

export default {
  createContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
  bulkImport,
  updateOptIn,
  getStats,
  syncWhatsAppContacts,
  getWhatsAppChats,
};

/**
 * GET /api/contacts/search
 * Busca contatos com filtros de tags e produtos
 */
export const searchContacts = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { tags, products, search, limit = 50, offset = 0 } = req.query;

  let query = supabaseAdmin
    .from('contacts')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .is('deleted_at', null);

  // Filtro por tags
  if (tags) {
    const tagIds = Array.isArray(tags) ? tags : [tags];
    query = query.contains('tags', tagIds);
  }

  // Filtro por produtos
  if (products) {
    const productIds = Array.isArray(products) ? products : [products];
    query = query.contains('products', productIds);
  }

  // Busca por nome ou telefone
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data: contacts, error, count } = await query
    .order('name', { ascending: true })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

  if (error) {
    logger.error('Error searching contacts:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar contatos'
    });
  }

  res.json({
    success: true,
    data: contacts,
    total: count,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

/**
 * POST /api/contacts/:id/tags
 * Adiciona múltiplas tags a um contato
 */
export const addTagsToContact = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { tagIds } = req.body;

  if (!Array.isArray(tagIds) || tagIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'tagIds deve ser um array não vazio'
    });
  }

  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('id, tags')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contato não encontrado'
    });
  }

  const currentTags = contact.tags || [];
  const newTags = [...new Set([...currentTags, ...tagIds])];

  const { error } = await supabaseAdmin
    .from('contacts')
    .update({ tags: newTags })
    .eq('id', id);

  if (error) {
    logger.error('Error adding tags to contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao adicionar tags'
    });
  }

  res.json({
    success: true,
    message: 'Tags adicionadas com sucesso'
  });
});

/**
 * POST /api/contacts/:id/products
 * Adiciona múltiplos produtos a um contato
 */
export const addProductsToContact = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { productIds } = req.body;

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'productIds deve ser um array não vazio'
    });
  }

  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('id, products')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contato não encontrado'
    });
  }

  const currentProducts = contact.products || [];
  const newProducts = [...new Set([...currentProducts, ...productIds])];

  const { error } = await supabaseAdmin
    .from('contacts')
    .update({ products: newProducts })
    .eq('id', id);

  if (error) {
    logger.error('Error adding products to contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao adicionar produtos'
    });
  }

  res.json({
    success: true,
    message: 'Produtos adicionados com sucesso'
  });
});

/**
 * GET /api/contacts/duplicates
 * Encontra contatos duplicados
 */
export const findDuplicates = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const duplicateGroups = await contactService.findDuplicateContacts(userId);

  res.json({
    success: true,
    data: duplicateGroups
  });
});

/**
 * POST /api/contacts/merge
 * Une múltiplos contatos em um só
 */
export const mergeContactsHandler = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { primaryContactId, contactIdsToMerge } = req.body;

  if (!primaryContactId || !Array.isArray(contactIdsToMerge) || contactIdsToMerge.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'primaryContactId e contactIdsToMerge são obrigatórios'
    });
  }

  const mergedContact = await contactService.mergeContacts(userId, primaryContactId, contactIdsToMerge);

  res.json({
    success: true,
    data: mergedContact,
    message: 'Contatos unidos com sucesso'
  });
});

/**
 * GET /api/contacts/:id/media
 * Busca mídias, links e documentos do contato
 */
export const getContactMedia = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { type, limit } = req.query;

  const media = await contactService.getContactMedia(userId, id, { type, limit: parseInt(limit) || 50 });

  res.json({
    success: true,
    data: media
  });
});
