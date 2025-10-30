import { supabaseAdmin } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Create a new product
 */
export async function createProduct(userId, productData) {
  try {
    const { name, description, sku, price, metadata } = productData;

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert([
        {
          user_id: userId,
          name,
          description: description || null,
          sku: sku || null,
          price: price || null,
          metadata: metadata || {}
        }
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info('Product created:', { userId, productId: product.id });
    return product;
  } catch (error) {
    logger.error('Create product error:', error);
    throw error;
  }
}

/**
 * Get all products for a user
 */
export async function getProducts(userId, filters = {}) {
  try {
    let query = supabaseAdmin
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }

    const { data: products, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return products;
  } catch (error) {
    logger.error('Get products error:', error);
    throw error;
  }
}

/**
 * Get a single product
 */
export async function getProductById(userId, productId) {
  try {
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !product) {
      throw new Error('Product not found');
    }

    return product;
  } catch (error) {
    logger.error('Get product error:', error);
    throw error;
  }
}

/**
 * Update a product
 */
export async function updateProduct(userId, productId, updates) {
  try {
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info('Product updated:', { userId, productId });
    return product;
  } catch (error) {
    logger.error('Update product error:', error);
    throw error;
  }
}

/**
 * Delete a product (soft delete)
 */
export async function deleteProduct(userId, productId) {
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    logger.info('Product deleted:', { userId, productId });
    return true;
  } catch (error) {
    logger.error('Delete product error:', error);
    throw error;
  }
}

/**
 * Associate product with contact
 */
export async function addProductToContact(contactId, productId, data = {}) {
  try {
    const { quantity = 1, notes = null } = data;

    const { data: contactProduct, error } = await supabaseAdmin
      .from('contact_products')
      .insert([
        {
          contact_id: contactId,
          product_id: productId,
          quantity,
          notes
        }
      ])
      .select()
      .single();

    if (error) {
      // If already exists, update it
      if (error.code === '23505') {
        const { data: updated } = await supabaseAdmin
          .from('contact_products')
          .update({ quantity, notes })
          .eq('contact_id', contactId)
          .eq('product_id', productId)
          .select()
          .single();

        return updated;
      }
      throw error;
    }

    logger.info('Product added to contact:', { contactId, productId });
    return contactProduct;
  } catch (error) {
    logger.error('Add product to contact error:', error);
    throw error;
  }
}

/**
 * Remove product from contact
 */
export async function removeProductFromContact(contactId, productId) {
  try {
    const { error } = await supabaseAdmin
      .from('contact_products')
      .delete()
      .eq('contact_id', contactId)
      .eq('product_id', productId);

    if (error) {
      throw error;
    }

    logger.info('Product removed from contact:', { contactId, productId });
    return true;
  } catch (error) {
    logger.error('Remove product from contact error:', error);
    throw error;
  }
}

/**
 * Get products for a contact
 */
export async function getContactProducts(contactId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('contact_products')
      .select(`
        *,
        products (*)
      `)
      .eq('contact_id', contactId);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Get contact products error:', error);
    throw error;
  }
}

/**
 * Get contacts for a product
 */
export async function getProductContacts(userId, productId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('contact_products')
      .select(`
        *,
        contacts (*)
      `)
      .eq('product_id', productId);

    if (error) {
      throw error;
    }

    // Filter by user
    const filtered = data.filter(cp => cp.contacts?.user_id === userId);

    return filtered;
  } catch (error) {
    logger.error('Get product contacts error:', error);
    throw error;
  }
}

export default {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addProductToContact,
  removeProductFromContact,
  getContactProducts,
  getProductContacts
};
