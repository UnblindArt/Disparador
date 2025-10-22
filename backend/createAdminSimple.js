import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.production') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    console.log('Email:', process.env.ADMIN_EMAIL);

    // Check if exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', process.env.ADMIN_EMAIL)
      .is('deleted_at', null)
      .single();

    if (existing) {
      console.log('Admin already exists:', existing.id);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

    // Create user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: process.env.ADMIN_EMAIL,
          password_hash: passwordHash,
          name: 'Admin',
          phone: process.env.ADMIN_PHONE,
          role: 'admin',
          is_active: true,
          email_verified: true,
          phone_verified: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating admin:', error);
      process.exit(1);
    }

    console.log('Admin created successfully:', data.id);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
