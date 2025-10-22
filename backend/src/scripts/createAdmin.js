import { supabaseAdmin } from '../config/database.js';
import { hashPassword } from '../utils/crypto.js';
import config from '../config/env.js';
import logger from '../config/logger.js';

async function createAdminUser() {
  try {
    logger.info('Creating admin user...');

    // Check if admin already exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', config.ADMIN_EMAIL)
      .is('deleted_at', null)
      .single();

    if (existing) {
      logger.info('Admin user already exists');
      return existing;
    }

    // Hash password
    const passwordHash = await hashPassword(config.ADMIN_PASSWORD);

    // Create admin user
    const { data: admin, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email: config.ADMIN_EMAIL,
          password_hash: passwordHash,
          name: 'Admin',
          phone: config.ADMIN_PHONE,
          role: 'admin',
          is_active: true,
          email_verified: true,
          phone_verified: true,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info('Admin user created successfully', { userId: admin.id, email: admin.email });
    return admin;
  } catch (error) {
    logger.error('Failed to create admin user:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

createAdminUser();
