import { query } from '../config/database.js';
import logger from '../config/logger.js';

async function createAppointmentsTable() {
  try {
    // Create appointments table
    await query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        attendees JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'scheduled',
        google_calendar_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    logger.info('Appointments table created successfully');

    // Create index for faster queries
    await query(`
      CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
      CREATE INDEX IF NOT EXISTS idx_appointments_contact_id ON appointments(contact_id);
    `);

    logger.info('Appointments indexes created successfully');
  } catch (error) {
    logger.error('Error creating appointments table:', error);
    throw error;
  }
}

createAppointmentsTable()
  .then(() => {
    logger.info('Setup completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Setup failed:', error);
    process.exit(1);
  });
