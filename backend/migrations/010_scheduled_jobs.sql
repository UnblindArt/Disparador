-- Migration: Scheduled Jobs Table
-- Description: Creates table for managing scheduled jobs (campaigns, reminders, etc.)

-- Create scheduled_jobs table
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL, -- 'campaign_message', 'campaign_start', 'appointment_reminder'
  campaign_id UUID,
  campaign_recipient_id UUID,
  appointment_id UUID,
  scheduled_at TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  payload JSONB, -- Additional data needed for job execution
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaigns') THEN
    ALTER TABLE scheduled_jobs
    DROP CONSTRAINT IF EXISTS scheduled_jobs_campaign_id_fkey,
    ADD CONSTRAINT scheduled_jobs_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_recipients') THEN
    ALTER TABLE scheduled_jobs
    DROP CONSTRAINT IF EXISTS scheduled_jobs_campaign_recipient_id_fkey,
    ADD CONSTRAINT scheduled_jobs_campaign_recipient_id_fkey
    FOREIGN KEY (campaign_recipient_id) REFERENCES campaign_recipients(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments') THEN
    ALTER TABLE scheduled_jobs
    DROP CONSTRAINT IF EXISTS scheduled_jobs_appointment_id_fkey,
    ADD CONSTRAINT scheduled_jobs_appointment_id_fkey
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_user_id ON scheduled_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_campaign_id ON scheduled_jobs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_status ON scheduled_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_scheduled_at ON scheduled_jobs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_job_type ON scheduled_jobs(job_type);

-- Create composite index for processing jobs
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_processing
ON scheduled_jobs(status, scheduled_at)
WHERE status = 'pending';

-- Add comments
COMMENT ON TABLE scheduled_jobs IS 'Manages scheduled jobs for campaigns, reminders, and other automated tasks';
COMMENT ON COLUMN scheduled_jobs.job_type IS 'Type of job: campaign_message, campaign_start, appointment_reminder';
COMMENT ON COLUMN scheduled_jobs.status IS 'Job status: pending, processing, completed, failed';
COMMENT ON COLUMN scheduled_jobs.payload IS 'Additional data needed for job execution (JSON)';
COMMENT ON COLUMN scheduled_jobs.retry_count IS 'Number of times this job has been retried';
COMMENT ON COLUMN scheduled_jobs.max_retries IS 'Maximum number of retry attempts';
