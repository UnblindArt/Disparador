-- Add last_sync_at column to whatsapp_instances table
ALTER TABLE whatsapp_instances
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN whatsapp_instances.last_sync_at IS 'Last time contacts were synced from WhatsApp';
