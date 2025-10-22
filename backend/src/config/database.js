import { createClient } from '@supabase/supabase-js';
import config from './env.js';

// Create Supabase client with service role (bypasses RLS)
export const supabaseAdmin = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create Supabase client with anon key (respects RLS)
export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY
);

// Test database connection
export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export default { supabase, supabaseAdmin, testDatabaseConnection };
