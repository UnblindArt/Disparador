import { supabaseAdmin } from '../config/database.js';
import logger from '../config/logger.js';

export async function createContact(userId, contactData) {
  try {
    const { phone, name, email, tags, customFields } = contactData;

    // Check if contact already exists for this user
    const { data: existing } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('user_id', userId)
      .eq('phone', phone)
      .is('deleted_at', null)
      .single();

    if (existing) {
      throw new Error('Contact with this phone already exists');
    }

    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .insert([
        {
          user_id: userId,
          phone,
          name: name || null,
          email: email || null,
          tags: tags || [],
          custom_fields: customFields || {},
          opt_in_status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info('Contact created:', { userId, contactId: contact.id });
    return contact;
  } catch (error) {
    logger.error('Create contact error:', error);
    throw error;
  }
}

export async function getContacts(userId, filters = {}) {
  try {
    let query = supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (filters.optInStatus) {
      query = query.eq('opt_in_status', filters.optInStatus);
    }

    if (filters.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data: contacts, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return contacts;
  } catch (error) {
    logger.error('Get contacts error:', error);
    throw error;
  }
}

export async function getContactById(userId, contactId) {
  try {
    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !contact) {
      throw new Error('Contact not found');
    }

    return contact;
  } catch (error) {
    logger.error('Get contact error:', error);
    throw error;
  }
}

export async function updateContact(userId, contactId, updates) {
  try {
    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info('Contact updated:', { userId, contactId });
    return contact;
  } catch (error) {
    logger.error('Update contact error:', error);
    throw error;
  }
}

export async function deleteContact(userId, contactId) {
  try {
    const { error } = await supabaseAdmin
      .from('contacts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', contactId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    logger.info('Contact deleted:', { userId, contactId });
    return true;
  } catch (error) {
    logger.error('Delete contact error:', error);
    throw error;
  }
}

export async function bulkImportContacts(userId, contacts) {
  try {
    const contactsToInsert = contacts.map(contact => ({
      user_id: userId,
      phone: contact.phone,
      name: contact.name || null,
      email: contact.email || null,
      tags: contact.tags || [],
      custom_fields: contact.customFields || {},
      opt_in_status: 'pending',
    }));

    const { data, error } = await supabaseAdmin
      .from('contacts')
      .insert(contactsToInsert)
      .select();

    if (error) {
      throw error;
    }

    logger.info('Bulk import completed:', { userId, count: data.length });
    return data;
  } catch (error) {
    logger.error('Bulk import error:', error);
    throw error;
  }
}

export async function updateOptInStatus(userId, contactId, status, metadata = {}) {
  try {
    const updates = {
      opt_in_status: status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'opted_in') {
      updates.opt_in_at = new Date().toISOString();
      updates.consent_ip = metadata.ip || null;
      updates.consent_user_agent = metadata.userAgent || null;
    } else if (status === 'opted_out') {
      updates.opt_out_at = new Date().toISOString();
    }

    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .update(updates)
      .eq('id', contactId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info('Contact opt-in status updated:', { userId, contactId, status });
    return contact;
  } catch (error) {
    logger.error('Update opt-in status error:', error);
    throw error;
  }
}

export async function getContactStats(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('contacts')
      .select('opt_in_status')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) {
      throw error;
    }

    const stats = {
      total: data.length,
      optedIn: data.filter(c => c.opt_in_status === 'opted_in').length,
      optedOut: data.filter(c => c.opt_in_status === 'opted_out').length,
      pending: data.filter(c => c.opt_in_status === 'pending').length,
    };

    return stats;
  } catch (error) {
    logger.error('Get contact stats error:', error);
    throw error;
  }
}

/**
 * Find duplicate contacts by name or similar phone patterns
 */
export async function findDuplicateContacts(userId, options = {}) {
  try {
    const { threshold = 0.8 } = options;

    // Get all active contacts for this user
    const { data: contacts, error } = await supabaseAdmin
      .from('contacts')
      .select('id, name, phone, email, tags, products, created_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group potential duplicates
    const duplicateGroups = [];
    const processed = new Set();

    for (let i = 0; i < contacts.length; i++) {
      if (processed.has(contacts[i].id)) continue;

      const group = [contacts[i]];
      processed.add(contacts[i].id);

      for (let j = i + 1; j < contacts.length; j++) {
        if (processed.has(contacts[j].id)) continue;

        // Check if names are similar (case-insensitive)
        const name1 = (contacts[i].name || '').toLowerCase().trim();
        const name2 = (contacts[j].name || '').toLowerCase().trim();

        if (name1 && name2 && name1 === name2) {
          group.push(contacts[j]);
          processed.add(contacts[j].id);
        }
      }

      if (group.length > 1) {
        duplicateGroups.push(group);
      }
    }

    logger.info('Found duplicate groups:', { userId, count: duplicateGroups.length });
    return duplicateGroups;
  } catch (error) {
    logger.error('Find duplicates error:', error);
    throw error;
  }
}

/**
 * Merge multiple contacts into one
 */
export async function mergeContacts(userId, primaryContactId, contactIdsToMerge) {
  try {
    // Get primary contact
    const { data: primaryContact, error: primaryError } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('id', primaryContactId)
      .eq('user_id', userId)
      .single();

    if (primaryError || !primaryContact) {
      throw new Error('Primary contact not found');
    }

    // Get contacts to merge
    const { data: contactsToMerge, error: mergeError } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .in('id', contactIdsToMerge)
      .eq('user_id', userId);

    if (mergeError) throw mergeError;

    // Merge data
    const mergedTags = [...new Set([
      ...(primaryContact.tags || []),
      ...contactsToMerge.flatMap(c => c.tags || [])
    ])];

    const mergedProducts = [...new Set([
      ...(primaryContact.products || []),
      ...contactsToMerge.flatMap(c => c.products || [])
    ])];

    const mergedCustomFields = contactsToMerge.reduce((acc, contact) => {
      return { ...acc, ...(contact.custom_fields || {}) };
    }, primaryContact.custom_fields || {});

    // Collect all phone numbers
    const allPhones = [
      primaryContact.phone,
      ...contactsToMerge.map(c => c.phone)
    ].filter(Boolean);

    // Add secondary phones to custom fields
    mergedCustomFields.secondary_phones = allPhones.slice(1);

    // Update primary contact with merged data
    const { data: updatedContact, error: updateError } = await supabaseAdmin
      .from('contacts')
      .update({
        tags: mergedTags,
        products: mergedProducts,
        custom_fields: mergedCustomFields,
        email: primaryContact.email || contactsToMerge.find(c => c.email)?.email || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', primaryContactId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update all messages to point to primary contact
    for (const contactId of contactIdsToMerge) {
      await supabaseAdmin
        .from('messages')
        .update({ contact_id: primaryContactId })
        .eq('contact_id', contactId);

      await supabaseAdmin
        .from('campaign_messages')
        .update({ contact_id: primaryContactId })
        .eq('contact_id', contactId);
    }

    // Soft delete merged contacts
    await supabaseAdmin
      .from('contacts')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', contactIdsToMerge);

    logger.info('Contacts merged:', {
      userId,
      primaryContactId,
      mergedCount: contactIdsToMerge.length
    });

    return updatedContact;
  } catch (error) {
    logger.error('Merge contacts error:', error);
    throw error;
  }
}

/**
 * Get contact media/links/documents from messages
 */
export async function getContactMedia(userId, contactId, options = {}) {
  try {
    const { type = 'all', limit = 50 } = options;

    // Verify contact belongs to user
    const { data: contact } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('user_id', userId)
      .single();

    if (!contact) {
      throw new Error('Contact not found');
    }

    // Get messages with media
    let query = supabaseAdmin
      .from('messages')
      .select('id, content, metadata, direction, created_at')
      .eq('contact_id', contactId)
      .not('metadata', 'is', null)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data: messages, error } = await query;

    if (error) throw error;

    // Parse media from messages
    const media = {
      images: [],
      videos: [],
      audios: [],
      documents: [],
      links: []
    };

    for (const msg of messages) {
      const metadata = msg.metadata || {};

      // Check for media in metadata
      if (metadata.mediaUrl || metadata.media_url) {
        const mediaUrl = metadata.mediaUrl || metadata.media_url;
        const mediaType = metadata.mediaType || metadata.media_type || 'unknown';
        const caption = metadata.caption || msg.content || '';

        const mediaItem = {
          id: msg.id,
          url: mediaUrl,
          caption,
          timestamp: msg.created_at,
          direction: msg.direction
        };

        if (mediaType.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(mediaUrl)) {
          media.images.push(mediaItem);
        } else if (mediaType.includes('video') || /\.(mp4|mov|avi|mkv)$/i.test(mediaUrl)) {
          media.videos.push(mediaItem);
        } else if (mediaType.includes('audio') || /\.(mp3|ogg|wav|m4a)$/i.test(mediaUrl)) {
          media.audios.push(mediaItem);
        } else {
          media.documents.push(mediaItem);
        }
      }

      // Extract links from message content
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const content = msg.content || '';
      const urls = content.match(urlRegex);
      if (urls) {
        urls.forEach(url => {
          media.links.push({
            id: msg.id,
            url,
            timestamp: msg.created_at,
            direction: msg.direction
          });
        });
      }
    }

    // Filter by type if requested
    if (type !== 'all') {
      return { [type]: media[type] };
    }

    return media;
  } catch (error) {
    logger.error('Get contact media error:', error);
    throw error;
  }
}

export default {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  bulkImportContacts,
  updateOptInStatus,
  getContactStats,
  findDuplicateContacts,
  mergeContacts,
  getContactMedia,
};
