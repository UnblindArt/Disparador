import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://supabase.unblind.cloud';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogInNlcnZpY2Vfcm9sZSIsCiAgImlzcyI6ICJzdXBhYmFzZSIsCiAgImlhdCI6IDE3MTUwNTA4MDAsCiAgImV4cCI6IDE4NzI4MTcyMDAKfQ.hQaoiXs6b274cO_NYpVrE9bxgT4omMWHTwuwOC-ufH8';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('Running migration: 003_add_last_sync_column.sql');

    const sql = readFileSync('./migrations/003_add_last_sync_column.sql', 'utf8');

    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Migration error:', error);

      // Try direct query instead
      console.log('Trying direct approach...');
      const { error: altError } = await supabase
        .from('whatsapp_instances')
        .select('id')
        .limit(0);

      if (altError) {
        console.error('Table check error:', altError);
      }

      process.exit(1);
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

runMigration();
