import { supabaseAdmin } from '../config/database.js';
import { queueHelpers } from '../config/queue.js';
import evolutionService from './evolutionService.js';
import logger from '../config/logger.js';

export async function createCampaign(userId, campaignData) {
  try {
    const {
      name,
      instanceName,
      templateId,
      message,
      mediaUrl,
      mediaType,
      targetType,
      groupId,
      tags,
      productIds,
      contactIds,
      uploadedContacts,
      scheduledFor,
      variables,
      delayMin = 3,
      delayMax = 10
    } = campaignData;

    // Get target contacts
    let targetContacts = [];

    if (targetType === 'all') {
      const { data } = await supabaseAdmin
        .from('contacts')
        .select('id, phone, name')
        .eq('user_id', userId)
        .eq('opt_in_status', 'opted_in')
        .is('deleted_at', null);
      targetContacts = data || [];
    } else if (targetType === 'group' && groupId) {
      const { data } = await supabaseAdmin
        .from('contact_group_members')
        .select('contacts(id, phone, name, opt_in_status)')
        .eq('group_id', groupId);
      targetContacts = (data || [])
        .map(m => m.contacts)
        .filter(c => c.opt_in_status === 'opted_in');
    } else if (targetType === 'tag' && tags && tags.length > 0) {
      const { data } = await supabaseAdmin
        .from('contacts')
        .select('id, phone, name')
        .eq('user_id', userId)
        .eq('opt_in_status', 'opted_in')
        .contains('tags', tags)
        .is('deleted_at', null);
      targetContacts = data || [];
    } else if (targetType === 'product' && productIds && productIds.length > 0) {
      // Get contacts with specific products
      const { data } = await supabaseAdmin
        .from('contacts')
        .select('id, phone, name')
        .eq('user_id', userId)
        .eq('opt_in_status', 'opted_in')
        .contains('products', productIds)
        .is('deleted_at', null);
      targetContacts = data || [];
    } else if (targetType === 'individual' && contactIds && contactIds.length > 0) {
      const { data } = await supabaseAdmin
        .from('contacts')
        .select('id, phone, name')
        .in('id', contactIds)
        .eq('user_id', userId)
        .eq('opt_in_status', 'opted_in')
        .is('deleted_at', null);
      targetContacts = data || [];
    } else if (targetType === 'upload' && uploadedContacts && uploadedContacts.length > 0) {
      // Use contacts from uploaded file
      // Create contacts if they don't exist
      for (const uploadContact of uploadedContacts) {
        const { phone, name, tags: uploadTags } = uploadContact;

        // Check if contact exists
        const { data: existing } = await supabaseAdmin
          .from('contacts')
          .select('id, phone, name, opt_in_status')
          .eq('user_id', userId)
          .eq('phone', phone)
          .is('deleted_at', null)
          .single();

        if (existing) {
          // Update tags if provided
          if (uploadTags && uploadTags.length > 0) {
            await supabaseAdmin
              .from('contacts')
              .update({
                tags: [...new Set([...(existing.tags || []), ...uploadTags])]
              })
              .eq('id', existing.id);
          }

          if (existing.opt_in_status === 'opted_in') {
            targetContacts.push(existing);
          }
        } else {
          // Create new contact
          const { data: newContact } = await supabaseAdmin
            .from('contacts')
            .insert([
              {
                user_id: userId,
                phone,
                name: name || phone,
                tags: uploadTags || [],
                opt_in_status: 'opted_in' // Auto opt-in for uploaded contacts
              }
            ])
            .select('id, phone, name')
            .single();

          if (newContact) {
            targetContacts.push(newContact);
          }
        }
      }
    }

    if (targetContacts.length === 0) {
      throw new Error('No valid contacts found for this campaign');
    }

    // Remove duplicates
    const uniqueContacts = Array.from(
      new Map(targetContacts.map(c => [c.phone, c])).values()
    );

    // Get template content if templateId provided
    let finalMessage = message;
    if (templateId) {
      const { data: template } = await supabaseAdmin
        .from('message_templates')
        .select('content')
        .eq('id', templateId)
        .eq('user_id', userId)
        .single();

      if (template) {
        finalMessage = template.content;
      }
    }

    // Get user's default instance if not provided
    let finalInstanceName = instanceName;
    if (!finalInstanceName) {
      const { data: userSettings } = await supabaseAdmin
        .from('user_settings')
        .select('default_instance')
        .eq('user_id', userId)
        .single();

      if (!userSettings?.default_instance) {
        throw new Error('No WhatsApp instance configured. Please connect an instance first.');
      }

      finalInstanceName = userSettings.default_instance;
    }

    // Create campaign
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .insert([
        {
          user_id: userId,
          name,
          instance_name: finalInstanceName,
          template_id: templateId || null,
          message_content: finalMessage,
          media_url: mediaUrl || null,
          media_type: mediaType || null,
          target_type: targetType,
          target_group_id: groupId || null,
          tags: tags || [],
          product_ids: productIds || [],
          total_contacts: uniqueContacts.length,
          status: scheduledFor ? 'scheduled' : 'draft',
          scheduled_at: scheduledFor || null,
          variables: variables || {},
          delay_min: delayMin,
          delay_max: delayMax,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create campaign messages with randomized delays
    const messages = uniqueContacts.map((contact, index) => {
      // Calculate cumulative delay for sequential sending
      let delaySeconds = 0;
      for (let i = 0; i <= index; i++) {
        delaySeconds += Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
      }

      return {
        campaign_id: campaign.id,
        user_id: userId,
        contact_id: contact.id,
        phone: contact.phone,
        message: finalMessage,
        media_url: mediaUrl || null,
        media_type: mediaType || null,
        status: 'pending',
        scheduled_for: scheduledFor || null,
        delay_seconds: delaySeconds
      };
    });

    await supabaseAdmin
      .from('campaign_messages')
      .insert(messages);

    // Queue messages if not scheduled
    if (!scheduledFor) {
      await queueHelpers.addCampaignJob({
        campaignId: campaign.id,
        userId,
        instanceName: finalInstanceName,
        delayMin,
        delayMax
      });
    }

    logger.info('Campaign created:', { userId, campaignId: campaign.id, totalContacts: uniqueContacts.length });

    return campaign;
  } catch (error) {
    logger.error('Create campaign error:', error);
    throw error;
  }
}

export async function getCampaigns(userId, filters = {}) {
  try {
    let query = supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data: campaigns, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return campaigns;
  } catch (error) {
    logger.error('Get campaigns error:', error);
    throw error;
  }
}

export async function getCampaignById(userId, campaignId) {
  try {
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !campaign) {
      throw new Error('Campaign not found');
    }

    // Get message stats
    const { data: messageStats } = await supabaseAdmin
      .from('campaign_messages')
      .select('status')
      .eq('campaign_id', campaignId);

    const stats = {
      total: messageStats?.length || 0,
      sent: messageStats?.filter(m => m.status === 'sent').length || 0,
      delivered: messageStats?.filter(m => m.status === 'delivered').length || 0,
      failed: messageStats?.filter(m => m.status === 'failed').length || 0,
      pending: messageStats?.filter(m => m.status === 'pending').length || 0,
    };

    return { ...campaign, stats };
  } catch (error) {
    logger.error('Get campaign error:', error);
    throw error;
  }
}

export async function updateCampaign(userId, campaignId, updates) {
  try {
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info('Campaign updated:', { userId, campaignId });
    return campaign;
  } catch (error) {
    logger.error('Update campaign error:', error);
    throw error;
  }
}

export async function pauseCampaign(userId, campaignId) {
  try {
    return await updateCampaign(userId, campaignId, { status: 'paused' });
  } catch (error) {
    logger.error('Pause campaign error:', error);
    throw error;
  }
}

export async function resumeCampaign(userId, campaignId) {
  try {
    const campaign = await updateCampaign(userId, campaignId, { status: 'active' });

    // Re-queue pending messages
    await queueHelpers.addCampaignJob({
      campaignId: campaign.id,
      userId,
    });

    return campaign;
  } catch (error) {
    logger.error('Resume campaign error:', error);
    throw error;
  }
}

export async function cancelCampaign(userId, campaignId) {
  try {
    return await updateCampaign(userId, campaignId, { status: 'cancelled' });
  } catch (error) {
    logger.error('Cancel campaign error:', error);
    throw error;
  }
}

export async function deleteCampaign(userId, campaignId) {
  try {
    const { error } = await supabaseAdmin
      .from('campaigns')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', campaignId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    logger.info('Campaign deleted:', { userId, campaignId });
    return true;
  } catch (error) {
    logger.error('Delete campaign error:', error);
    throw error;
  }
}

export default {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  deleteCampaign,
};
