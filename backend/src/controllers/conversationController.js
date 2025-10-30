import * as evolutionService from '../services/evolutionService.js';
import logger from '../config/logger.js';
import { supabaseAdmin } from '../config/database.js';

// Sync WhatsApp contacts from instance
export async function syncWhatsAppContacts(req, res, next) {
  try {
    const { instanceName } = req.params;
    const userId = req.user.userId;

    // Get all chats from WhatsApp
    const chats = await evolutionService.getAllChats(instanceName);
    logger.info(`Found ${chats?.length || 0} chats from WhatsApp`);

    let syncedCount = 0;
    const contactsData = [];

    if (chats && Array.isArray(chats)) {
      for (const chat of chats) {
        try {
          // Extract phone number from chat ID
          const phoneMatch = chat.id?.match(/(\d+)@/);
          if (!phoneMatch) continue;

          const phone = phoneMatch[1];
          const name = chat.name || chat.pushName || phone;

          // Check if contact already exists
          const { data: existingContact } = await supabaseAdmin
            .from('contacts')
            .select('id')
            .eq('phone', phone)
            .eq('user_id', userId)
            .single();

          if (!existingContact) {
            // Insert new contact
            await supabaseAdmin
              .from('contacts')
              .insert({
                user_id: userId,
                name,
                phone,
                source: 'whatsapp',
                status: 'active',
              });
            syncedCount++;
          }

          contactsData.push({
            phone,
            name,
            lastMessageTime: chat.lastMessageTime,
            unreadCount: chat.unreadCount || 0,
          });
        } catch (error) {
          logger.error('Error syncing contact:', error);
        }
      }
    }

    res.json({
      success: true,
      message: `${syncedCount} novos contatos sincronizados`,
      data: {
        totalChats: chats?.length || 0,
        syncedCount,
        contacts: contactsData,
      },
    });
  } catch (error) {
    logger.error('Error syncing WhatsApp contacts:', error);
    next(error);
  }
}

// Get all conversations (leads)
export async function getAllConversations(req, res, next) {
  try {
    const userId = req.user.userId;

    const result = await query(
      `SELECT id, name, phone, email, source, status, notes, created_at, updated_at
       FROM contacts
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    logger.error('Error getting conversations:', error);
    next(error);
  }
}

// Get conversation details with messages
export async function getConversationDetails(req, res, next) {
  try {
    const { contactId } = req.params;
    const userId = req.user.userId;
    const { instanceName } = req.query;

    // Get contact info
    const contactResult = await query(
      'SELECT * FROM contacts WHERE id = $1 AND user_id = $2',
      [contactId, userId]
    );

    if (contactResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    const contact = contactResult.rows[0];

    // Get WhatsApp messages if instanceName provided
    let whatsappMessages = [];
    if (instanceName && contact.phone) {
      try {
        const chatId = `${contact.phone}@s.whatsapp.net`;
        whatsappMessages = await evolutionService.getChatMessages(chatId, instanceName);
      } catch (error) {
        logger.warn('Error fetching WhatsApp messages:', error);
      }
    }

    // Get stored messages
    const messagesResult = await query(
      `SELECT * FROM messages
       WHERE contact_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [contactId]
    );

    res.json({
      success: true,
      data: {
        contact,
        messages: messagesResult.rows,
        whatsappMessages: whatsappMessages || [],
      },
    });
  } catch (error) {
    logger.error('Error getting conversation details:', error);
    next(error);
  }
}

// Update contact notes
export async function updateContactNotes(req, res, next) {
  try {
    const { contactId } = req.params;
    const { notes } = req.body;
    const userId = req.user.userId;

    const result = await query(
      `UPDATE contacts
       SET notes = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [notes, contactId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error updating notes:', error);
    next(error);
  }
}

// Update contact status
export async function updateContactStatus(req, res, next) {
  try {
    const { contactId } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    const result = await query(
      `UPDATE contacts
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, contactId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error updating status:', error);
    next(error);
  }
}

export default {
  syncWhatsAppContacts,
  getAllConversations,
  getConversationDetails,
  updateContactNotes,
  updateContactStatus,
};
