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

export default {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  bulkImportContacts,
  updateOptInStatus,
  getContactStats,
};
