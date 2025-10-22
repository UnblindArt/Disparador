-- ============================================
-- WhatsApp Dispatcher v2.0 - Initial Schema
-- ============================================
-- Migration: 001_initial_schema
-- Description: Create all base tables for the system
-- Author: Unblind
-- Date: 2025-10-22
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'operator')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Index for faster queries
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_active ON users(is_active) WHERE deleted_at IS NULL;

-- ============================================
-- CONTACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    tags JSONB DEFAULT '[]',
    custom_fields JSONB DEFAULT '{}',
    opt_in_status VARCHAR(50) DEFAULT 'pending' CHECK (opt_in_status IN ('pending', 'opted_in', 'opted_out')),
    opt_in_at TIMESTAMP WITH TIME ZONE,
    opt_out_at TIMESTAMP WITH TIME ZONE,
    consent_ip VARCHAR(45),
    consent_user_agent TEXT,
    is_blocked BOOLEAN DEFAULT false,
    blocked_reason TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE UNIQUE INDEX idx_contacts_user_phone ON contacts(user_id, phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_user_id ON contacts(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_opt_in_status ON contacts(opt_in_status) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_tags ON contacts USING GIN (tags) WHERE deleted_at IS NULL;

-- ============================================
-- CONTACT GROUPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contact_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tags JSONB DEFAULT '[]',
    total_contacts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_contact_groups_user_id ON contact_groups(user_id) WHERE deleted_at IS NULL;

-- ============================================
-- CONTACT GROUP MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contact_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES contact_groups(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, contact_id)
);

CREATE INDEX idx_contact_group_members_group_id ON contact_group_members(group_id);
CREATE INDEX idx_contact_group_members_contact_id ON contact_group_members(contact_id);

-- ============================================
-- MESSAGE TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    category VARCHAR(100),
    tags JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_message_templates_user_id ON message_templates(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_message_templates_category ON message_templates(category) WHERE deleted_at IS NULL;

-- ============================================
-- CAMPAIGNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
    message_content TEXT NOT NULL,
    target_type VARCHAR(50) DEFAULT 'group' CHECK (target_type IN ('group', 'contacts', 'all')),
    target_group_id UUID REFERENCES contact_groups(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled', 'failed')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    total_contacts INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    messages_delivered INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,
    messages_pending INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    send_rate_per_minute INTEGER DEFAULT 30,
    retry_failed BOOLEAN DEFAULT true,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_campaigns_user_id ON campaigns(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_campaigns_status ON campaigns(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_campaigns_scheduled_at ON campaigns(scheduled_at) WHERE status = 'scheduled';

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'cancelled')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    queued_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    evolution_message_id VARCHAR(255),
    evolution_response JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_campaign_id ON messages(campaign_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_contact_id ON messages(contact_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_scheduled_at ON messages(scheduled_at) WHERE status IN ('pending', 'scheduled');
CREATE INDEX idx_messages_phone ON messages(phone);

-- ============================================
-- WHATSAPP INSTANCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    instance_name VARCHAR(255) UNIQUE NOT NULL,
    instance_key VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    qr_code TEXT,
    status VARCHAR(50) DEFAULT 'disconnected' CHECK (status IN ('connecting', 'connected', 'disconnected', 'qr', 'error')),
    connection_state JSONB DEFAULT '{}',
    last_connected_at TIMESTAMP WITH TIME ZONE,
    last_disconnected_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_instances_user_id ON whatsapp_instances(user_id);
CREATE INDEX idx_whatsapp_instances_status ON whatsapp_instances(status);

-- ============================================
-- RATE LIMITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    count INTEGER DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    window_end TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_user_id ON rate_limits(user_id);
CREATE INDEX idx_rate_limits_resource ON rate_limits(resource_type, resource_id);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_end);

-- ============================================
-- AUDIT LOGS TABLE (LGPD Compliance)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- DATA EXPORT REQUESTS TABLE (LGPD Compliance)
-- ============================================
CREATE TABLE IF NOT EXISTS data_export_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_path TEXT,
    file_size BIGINT,
    expires_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX idx_data_export_requests_status ON data_export_requests(status);

-- ============================================
-- DATA DELETION REQUESTS TABLE (LGPD Compliance)
-- ============================================
CREATE TABLE IF NOT EXISTS data_deletion_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    reason TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_data_deletion_requests_user_id ON data_deletion_requests(user_id);
CREATE INDEX idx_data_deletion_requests_status ON data_deletion_requests(status);

-- ============================================
-- WEBHOOKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    events JSONB DEFAULT '[]',
    secret VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    total_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);

-- ============================================
-- WEBHOOK LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB,
    response_status INTEGER,
    response_body TEXT,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);

-- ============================================
-- SYSTEM SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_system_settings_key ON system_settings(key);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Users: Can only see their own data
CREATE POLICY users_select_own ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_update_own ON users
    FOR UPDATE USING (auth.uid() = id);

-- Contacts: Users can only manage their own contacts
CREATE POLICY contacts_all_operations ON contacts
    FOR ALL USING (auth.uid() = user_id);

-- Contact Groups: Users can only manage their own groups
CREATE POLICY contact_groups_all_operations ON contact_groups
    FOR ALL USING (auth.uid() = user_id);

-- Contact Group Members: Users can only manage their own group members
CREATE POLICY contact_group_members_all_operations ON contact_group_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM contact_groups
            WHERE contact_groups.id = contact_group_members.group_id
            AND contact_groups.user_id = auth.uid()
        )
    );

-- Message Templates: Users can only manage their own templates
CREATE POLICY message_templates_all_operations ON message_templates
    FOR ALL USING (auth.uid() = user_id);

-- Campaigns: Users can only manage their own campaigns
CREATE POLICY campaigns_all_operations ON campaigns
    FOR ALL USING (auth.uid() = user_id);

-- Messages: Users can only see their own messages
CREATE POLICY messages_all_operations ON messages
    FOR ALL USING (auth.uid() = user_id);

-- WhatsApp Instances: Users can only manage their own instances
CREATE POLICY whatsapp_instances_all_operations ON whatsapp_instances
    FOR ALL USING (auth.uid() = user_id);

-- Webhooks: Users can only manage their own webhooks
CREATE POLICY webhooks_all_operations ON webhooks
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_groups_updated_at BEFORE UPDATE ON contact_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON whatsapp_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update contact group member count
CREATE OR REPLACE FUNCTION update_contact_group_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE contact_groups
        SET total_contacts = total_contacts + 1
        WHERE id = NEW.group_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE contact_groups
        SET total_contacts = GREATEST(0, total_contacts - 1)
        WHERE id = OLD.group_id;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contact_group_count_trigger
AFTER INSERT OR DELETE ON contact_group_members
FOR EACH ROW EXECUTE FUNCTION update_contact_group_count();

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default system settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
    ('whatsapp_messages_per_second', '1', 'Maximum messages per second', false),
    ('whatsapp_messages_per_minute', '30', 'Maximum messages per minute', false),
    ('whatsapp_daily_limit', '1000', 'Daily message limit', false),
    ('data_retention_days', '90', 'Days to keep data before anonymization', false),
    ('maintenance_mode', 'false', 'System maintenance mode', true)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE users IS 'System users with authentication';
COMMENT ON TABLE contacts IS 'WhatsApp contacts with LGPD compliance';
COMMENT ON TABLE contact_groups IS 'Groups of contacts for campaigns';
COMMENT ON TABLE campaigns IS 'Message campaigns';
COMMENT ON TABLE messages IS 'Individual messages sent or pending';
COMMENT ON TABLE audit_logs IS 'Audit trail for LGPD compliance';
COMMENT ON TABLE data_export_requests IS 'LGPD data portability requests';
COMMENT ON TABLE data_deletion_requests IS 'LGPD right to be forgotten requests';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
