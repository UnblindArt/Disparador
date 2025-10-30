import { supabaseAdmin } from './src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
  try {
    console.log('📦 Reading migration file...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations/007_tags_and_products.sql'),
      'utf8'
    );

    console.log('🔄 Applying migration to database...\n');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.includes('CREATE') || statement.includes('ALTER') ||
          statement.includes('INSERT') || statement.includes('COMMENT')) {
        try {
          const { error } = await supabaseAdmin.rpc('exec_sql', {
            sql_query: statement + ';'
          });

          if (error) {
            // Try direct query if RPC fails
            const { error: directError } = await supabaseAdmin.from('_sqlx_migrations').select('version').limit(1);
            if (directError && directError.message.includes('does not exist')) {
              console.log('⚠️  RPC method not available, migration may need to be applied manually');
              console.log('\nMigration SQL:');
              console.log('='.repeat(80));
              console.log(migrationSQL);
              console.log('='.repeat(80));
              console.log('\nPlease apply this SQL manually in Supabase SQL Editor or via psql');
              return;
            }
            throw error;
          }

          const preview = statement.substring(0, 60).replace(/\n/g, ' ');
          console.log(`✅ ${preview}...`);
        } catch (err) {
          if (err.message?.includes('already exists')) {
            console.log(`⏭️  Skipping (already exists): ${statement.substring(0, 40)}...`);
          } else {
            throw err;
          }
        }
      }
    }

    console.log('\n✅ Migration applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error applying migration:', error.message);
    console.error('\nFull error:', error);

    console.log('\n📝 You can apply the migration manually using the SQL below:');
    console.log('='.repeat(80));
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations/007_tags_and_products.sql'),
      'utf8'
    );
    console.log(migrationSQL);
    console.log('='.repeat(80));

    process.exit(1);
  }
}

applyMigration();
