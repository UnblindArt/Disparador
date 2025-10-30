import { supabaseAdmin } from '../config/database.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import logger from '../config/logger.js';

/**
 * GET /api/tags
 * Lista todas as tags do usuário
 */
export const getTags = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { data: tags, error } = await supabaseAdmin
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    logger.error('Error fetching tags:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar tags'
    });
  }

  res.json({
    success: true,
    data: tags
  });
});

/**
 * POST /api/tags
 * Cria uma nova tag
 */
export const createTag = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, color, description } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Nome da tag é obrigatório'
    });
  }

  const { data: tag, error } = await supabaseAdmin
    .from('tags')
    .insert({
      user_id: userId,
      name: name.trim(),
      color: color || '#3B82F6',
      description
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // unique violation
      return res.status(400).json({
        success: false,
        message: 'Já existe uma tag com este nome'
      });
    }
    logger.error('Error creating tag:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar tag'
    });
  }

  logger.info('✅ Tag created:', { id: tag.id, name: tag.name });

  res.status(201).json({
    success: true,
    data: tag
  });
});

/**
 * PUT /api/tags/:id
 * Atualiza uma tag
 */
export const updateTag = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { name, color, description } = req.body;

  const updates = {};
  if (name) updates.name = name.trim();
  if (color) updates.color = color;
  if (description !== undefined) updates.description = description;

  const { data: tag, error } = await supabaseAdmin
    .from('tags')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma tag com este nome'
      });
    }
    logger.error('Error updating tag:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar tag'
    });
  }

  if (!tag) {
    return res.status(404).json({
      success: false,
      message: 'Tag não encontrada'
    });
  }

  res.json({
    success: true,
    data: tag
  });
});

/**
 * DELETE /api/tags/:id
 * Deleta uma tag
 */
export const deleteTag = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  // Verifica se a tag pertence ao usuário
  const { data: tag } = await supabaseAdmin
    .from('tags')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (!tag) {
    return res.status(404).json({
      success: false,
      message: 'Tag não encontrada'
    });
  }

  // Deleta a tag (as relações em contact_tags serão deletadas automaticamente por CASCADE)
  const { error } = await supabaseAdmin
    .from('tags')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error deleting tag:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao deletar tag'
    });
  }

  logger.info('✅ Tag deleted:', { id });

  res.json({
    success: true,
    message: 'Tag deletada com sucesso'
  });
});

/**
 * POST /api/tags/:id/contacts/:contactId
 * Adiciona tag a um contato
 */
export const addTagToContact = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: tagId, contactId } = req.params;

  // Verifica se tag existe
  const { data: tag } = await supabaseAdmin
    .from('tags')
    .select('id, name')
    .eq('id', tagId)
    .eq('user_id', userId)
    .single();

  if (!tag) {
    return res.status(404).json({
      success: false,
      message: 'Tag não encontrada'
    });
  }

  // Busca contato
  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('id, name')
    .eq('id', contactId)
    .eq('user_id', userId)
    .single();

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contato não encontrado'
    });
  }

  // Adiciona relação na tabela contact_tags (unique constraint evita duplicatas)
  const { error } = await supabaseAdmin
    .from('contact_tags')
    .insert({
      contact_id: contactId,
      tag_id: tagId
    });

  if (error) {
    if (error.code === '23505') { // unique violation - tag já existe no contato
      return res.json({
        success: true,
        message: 'Tag já estava associada ao contato'
      });
    }
    logger.error('Error adding tag to contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao adicionar tag ao contato'
    });
  }

  logger.info('✅ Tag added to contact:', {
    tag: tag.name,
    contact: contact.name
  });

  res.json({
    success: true,
    message: 'Tag adicionada ao contato com sucesso'
  });
});

/**
 * DELETE /api/tags/:id/contacts/:contactId
 * Remove tag de um contato
 */
export const removeTagFromContact = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: tagId, contactId } = req.params;

  // Verifica se contato existe e pertence ao usuário
  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('id')
    .eq('id', contactId)
    .eq('user_id', userId)
    .single();

  if (!contact) {
    return res.status(404).json({
      success: false,
      message: 'Contato não encontrado'
    });
  }

  // Remove relação na tabela contact_tags
  const { error } = await supabaseAdmin
    .from('contact_tags')
    .delete()
    .eq('contact_id', contactId)
    .eq('tag_id', tagId);

  if (error) {
    logger.error('Error removing tag from contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao remover tag do contato'
    });
  }

  logger.info('✅ Tag removed from contact:', { tagId, contactId });

  res.json({
    success: true,
    message: 'Tag removida do contato com sucesso'
  });
});

/**
 * GET /api/tags/:id/contacts
 * Lista contatos com uma tag específica
 */
export const getContactsByTag = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: tagId } = req.params;

  // Verifica se tag existe
  const { data: tag } = await supabaseAdmin
    .from('tags')
    .select('id')
    .eq('id', tagId)
    .eq('user_id', userId)
    .single();

  if (!tag) {
    return res.status(404).json({
      success: false,
      message: 'Tag não encontrada'
    });
  }

  // Busca contatos através da tabela contact_tags
  const { data: contactTags, error } = await supabaseAdmin
    .from('contact_tags')
    .select(`
      contact_id,
      contacts (*)
    `)
    .eq('tag_id', tagId);

  if (error) {
    logger.error('Error fetching contacts by tag:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar contatos'
    });
  }

  // Extrai apenas os contatos e filtra por user_id
  const contacts = contactTags
    ?.map(ct => ct.contacts)
    .filter(contact => contact && contact.user_id === userId && !contact.deleted_at) || [];

  res.json({
    success: true,
    data: contacts
  });
});

/**
 * GET /api/tags/:id/contacts/count
 * Retorna contagem de contatos com uma tag específica
 */
export const getContactsCountByTag = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: tagId } = req.params;

  // Verifica se tag existe
  const { data: tag } = await supabaseAdmin
    .from('tags')
    .select('id')
    .eq('id', tagId)
    .eq('user_id', userId)
    .single();

  if (!tag) {
    return res.status(404).json({
      success: false,
      message: 'Tag não encontrada'
    });
  }

  // Conta contatos através da tabela contact_tags
  const { data: contactTags, error } = await supabaseAdmin
    .from('contact_tags')
    .select(`
      contact_id,
      contacts!inner(user_id, deleted_at)
    `)
    .eq('tag_id', tagId)
    .eq('contacts.user_id', userId)
    .is('contacts.deleted_at', null);

  if (error) {
    logger.error('Error counting contacts by tag:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao contar contatos'
    });
  }

  res.json({
    success: true,
    data: { count: contactTags?.length || 0 }
  });
});

export default {
  getTags,
  createTag,
  updateTag,
  deleteTag,
  addTagToContact,
  removeTagFromContact,
  getContactsByTag
};
