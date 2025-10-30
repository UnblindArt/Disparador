-- Migration: Add tags and products system
-- Created: 2025-10-24

-- Add tags column to contacts table (if not exists)
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100),
  price DECIMAL(10, 2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create contact_products junction table
CREATE TABLE IF NOT EXISTS contact_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(contact_id, product_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contact_products_contact ON contact_products(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_products_product ON contact_products(product_id);

-- Update campaigns table to support products
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS product_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS media_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS original_media_url TEXT,
ADD COLUMN IF NOT EXISTS delay_min INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS delay_max INTEGER DEFAULT 10;

-- Update campaign_messages table for media support
ALTER TABLE campaign_messages
ADD COLUMN IF NOT EXISTS media_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS delay_seconds INTEGER;

-- Update messages table for media support
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS media_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS original_media_url TEXT;

-- Create uploaded_files table for tracking uploads
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  url TEXT,
  mime_type VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_user ON uploaded_files(user_id) WHERE deleted_at IS NULL;

-- Create campaign_upload_contacts table for tracking contacts from uploads
CREATE TABLE IF NOT EXISTS campaign_upload_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  file_id UUID REFERENCES uploaded_files(id) ON DELETE SET NULL,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  extracted_data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_upload_contacts_campaign ON campaign_upload_contacts(campaign_id);

-- Add comments
COMMENT ON COLUMN contacts.tags IS 'Array of tags for segmentation';
COMMENT ON COLUMN contacts.custom_fields IS 'Custom fields for flexible contact data';
COMMENT ON TABLE products IS 'Products for tracking customer purchases';
COMMENT ON TABLE contact_products IS 'Many-to-many relationship between contacts and products';
COMMENT ON COLUMN campaigns.delay_min IS 'Minimum delay between messages in seconds';
COMMENT ON COLUMN campaigns.delay_max IS 'Maximum delay between messages in seconds';
