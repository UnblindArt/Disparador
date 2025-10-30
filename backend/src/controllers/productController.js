import { supabaseAdmin } from '../config/database.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import logger from '../config/logger.js';

/**
 * GET /api/products
 */
export const getProducts = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) {
    logger.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar produtos'
    });
  }

  res.json({
    success: true,
    data: products
  });
});

/**
 * POST /api/products
 */
export const createProduct = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, description, price, sku, category, color } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Nome do produto é obrigatório'
    });
  }

  const { data: product, error } = await supabaseAdmin
    .from('products')
    .insert({
      user_id: userId,
      name: name.trim(),
      description,
      price,
      sku,
      category,
      color: color || '#10B981'
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Já existe um produto com este nome'
      });
    }
    logger.error('Error creating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar produto'
    });
  }

  logger.info('✅ Product created:', { id: product.id, name: product.name });

  res.status(201).json({
    success: true,
    data: product
  });
});

/**
 * PUT /api/products/:id
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { name, description, price, sku, category, color, is_active } = req.body;

  const updates = {};
  if (name) updates.name = name.trim();
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = price;
  if (sku !== undefined) updates.sku = sku;
  if (category !== undefined) updates.category = category;
  if (color) updates.color = color;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data: product, error } = await supabaseAdmin
    .from('products')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating product:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar produto'
    });
  }

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Produto não encontrado'
    });
  }

  res.json({
    success: true,
    data: product
  });
});

/**
 * DELETE /api/products/:id
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  // Verifica se produto existe e pertence ao usuário
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Produto não encontrado'
    });
  }

  // Deleta o produto (as relações em contact_products serão deletadas automaticamente por CASCADE)
  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error deleting product:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao deletar produto'
    });
  }

  logger.info('✅ Product deleted:', { id });

  res.json({
    success: true,
    message: 'Produto deletado com sucesso'
  });
});

/**
 * POST /api/products/:id/contacts/:contactId
 */
export const addProductToContact = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: productId, contactId } = req.params;
  const { notes } = req.body;

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('id, name')
    .eq('id', productId)
    .eq('user_id', userId)
    .single();

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Produto não encontrado'
    });
  }

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

  // Adiciona relação na tabela contact_products (unique constraint evita duplicatas)
  const { error } = await supabaseAdmin
    .from('contact_products')
    .insert({
      contact_id: contactId,
      product_id: productId,
      notes: notes || null
    });

  if (error) {
    if (error.code === '23505') { // unique violation - produto já existe no contato
      // Atualiza as notas se já existe
      const { error: updateError } = await supabaseAdmin
        .from('contact_products')
        .update({ notes: notes || null })
        .eq('contact_id', contactId)
        .eq('product_id', productId);

      if (updateError) {
        logger.error('Error updating product notes:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao atualizar notas do produto'
        });
      }

      return res.json({
        success: true,
        message: 'Notas do produto atualizadas'
      });
    }
    logger.error('Error adding product to contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao adicionar produto ao contato'
    });
  }

  logger.info('✅ Product added to contact:', {
    product: product.name,
    contact: contact.name
  });

  res.json({
    success: true,
    message: 'Produto adicionado ao contato com sucesso'
  });
});

/**
 * DELETE /api/products/:id/contacts/:contactId
 */
export const removeProductFromContact = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: productId, contactId } = req.params;

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

  // Remove relação na tabela contact_products
  const { error } = await supabaseAdmin
    .from('contact_products')
    .delete()
    .eq('contact_id', contactId)
    .eq('product_id', productId);

  if (error) {
    logger.error('Error removing product from contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao remover produto do contato'
    });
  }

  logger.info('✅ Product removed from contact:', { productId, contactId });

  res.json({
    success: true,
    message: 'Produto removido do contato com sucesso'
  });
});

/**
 * GET /api/products/:id/contacts
 */
export const getContactsByProduct = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: productId } = req.params;

  // Verifica se produto existe
  const { data: product } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('id', productId)
    .eq('user_id', userId)
    .single();

  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Produto não encontrado'
    });
  }

  // Busca contatos através da tabela contact_products
  const { data: contactProducts, error } = await supabaseAdmin
    .from('contact_products')
    .select(`
      contact_id,
      notes,
      contacts (*)
    `)
    .eq('product_id', productId);

  if (error) {
    logger.error('Error fetching contacts by product:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar contatos'
    });
  }

  // Extrai apenas os contatos e filtra por user_id
  const contacts = contactProducts
    ?.map(cp => ({
      ...cp.contacts,
      product_notes: cp.notes
    }))
    .filter(contact => contact && contact.user_id === userId && !contact.deleted_at) || [];

  res.json({
    success: true,
    data: contacts
  });
});

export default {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductToContact,
  removeProductFromContact,
  getContactsByProduct
};
