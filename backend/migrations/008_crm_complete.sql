-- ============================================
-- CRM COMPLETE SYSTEM
-- Migration 008
-- Created: 2025-10-30
-- Description: Sistema completo de CRM com Pipeline, Vendas e Pós-venda
-- ============================================

-- ============================================
-- DEALS TABLE (Pipeline/Oportunidades)
-- ============================================
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    value DECIMAL(10, 2),
    stage VARCHAR(50) NOT NULL DEFAULT 'lead',
    probability INT DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    lost_reason TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT deals_stage_check CHECK (stage IN ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'))
);

CREATE INDEX idx_deals_contact_id ON deals(contact_id);
CREATE INDEX idx_deals_user_id ON deals(user_id);
CREATE INDEX idx_deals_stage ON deals(stage, user_id) WHERE stage NOT IN ('won', 'lost');
CREATE INDEX idx_deals_expected_close ON deals(expected_close_date) WHERE stage NOT IN ('won', 'lost');

-- ============================================
-- DEAL STAGE HISTORY (Histórico de mudanças)
-- ============================================
CREATE TABLE IF NOT EXISTS deal_stage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    from_stage VARCHAR(50),
    to_stage VARCHAR(50) NOT NULL,
    changed_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deal_stage_history_deal_id ON deal_stage_history(deal_id, changed_at DESC);

-- ============================================
-- PURCHASES TABLE (Vendas Efetivadas)
-- ============================================
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    discount DECIMAL(10, 2) DEFAULT 0 CHECK (discount >= 0),
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
    installments INT DEFAULT 1 CHECK (installments > 0),
    installment_value DECIMAL(10, 2),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT purchases_payment_method_check CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'installments')),
    CONSTRAINT purchases_payment_status_check CHECK (payment_status IN ('pending', 'paid', 'partial', 'cancelled', 'refunded'))
);

CREATE INDEX idx_purchases_contact_id ON purchases(contact_id);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_product_id ON purchases(product_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date DESC, user_id);
CREATE INDEX idx_purchases_payment_status ON purchases(payment_status) WHERE payment_status != 'paid';

-- ============================================
-- CONTACT NOTES (Observações do Lead/Cliente)
-- ============================================
CREATE TABLE IF NOT EXISTS contact_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'general',
    is_pinned BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT contact_notes_note_type_check CHECK (note_type IN ('general', 'call', 'meeting', 'follow_up', 'important'))
);

CREATE INDEX idx_contact_notes_contact_id ON contact_notes(contact_id, created_at DESC);
CREATE INDEX idx_contact_notes_user_id ON contact_notes(user_id);
CREATE INDEX idx_contact_notes_pinned ON contact_notes(contact_id, is_pinned) WHERE is_pinned = true;

-- ============================================
-- POST SALE TASK TEMPLATES (Templates por Produto)
-- ============================================
CREATE TABLE IF NOT EXISTS post_sale_task_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) NOT NULL DEFAULT 'follow_up',
    days_after_purchase INT NOT NULL DEFAULT 7 CHECK (days_after_purchase >= 0),
    is_active BOOLEAN DEFAULT true,
    order_index INT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT post_sale_templates_task_type_check CHECK (task_type IN ('follow_up', 'check_satisfaction', 'schedule_return', 'send_material', 'reminder', 'custom'))
);

CREATE INDEX idx_post_sale_templates_product_id ON post_sale_task_templates(product_id);
CREATE INDEX idx_post_sale_templates_user_id ON post_sale_task_templates(user_id);

-- ============================================
-- POST SALE TASKS (Tarefas de Pós-venda)
-- ============================================
CREATE TABLE IF NOT EXISTS post_sale_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES post_sale_task_templates(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) NOT NULL DEFAULT 'follow_up',
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT post_sale_tasks_task_type_check CHECK (task_type IN ('follow_up', 'check_satisfaction', 'schedule_return', 'send_material', 'reminder', 'custom')),
    CONSTRAINT post_sale_tasks_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

CREATE INDEX idx_post_sale_tasks_purchase_id ON post_sale_tasks(purchase_id);
CREATE INDEX idx_post_sale_tasks_contact_id ON post_sale_tasks(contact_id);
CREATE INDEX idx_post_sale_tasks_user_id ON post_sale_tasks(user_id);
CREATE INDEX idx_post_sale_tasks_due_date ON post_sale_tasks(due_date, status) WHERE status = 'pending';
CREATE INDEX idx_post_sale_tasks_status ON post_sale_tasks(status, user_id);

-- ============================================
-- GOOGLE CALENDAR INTEGRATIONS (Estrutura preparada)
-- ============================================
CREATE TABLE IF NOT EXISTS google_calendar_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT, -- Will be encrypted
    access_token TEXT, -- Will be encrypted
    token_expires_at TIMESTAMP WITH TIME ZONE,
    calendar_id VARCHAR(255),
    is_active BOOLEAN DEFAULT false,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'not_connected',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT google_calendar_sync_status_check CHECK (sync_status IN ('not_connected', 'connected', 'syncing', 'error'))
);

CREATE INDEX idx_google_calendar_user_id ON google_calendar_integrations(user_id);

-- Adicionar campos aos appointments existentes
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS google_meet_link TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_sync_status VARCHAR(50) DEFAULT 'not_synced',
ADD COLUMN IF NOT EXISTS requires_video_call BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_invitation_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_invitation_sent_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_appointments_google_event_id ON appointments(google_calendar_event_id);
CREATE INDEX IF NOT EXISTS idx_appointments_sync_status ON appointments(google_calendar_sync_status);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Deals trigger
CREATE OR REPLACE FUNCTION update_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION update_deals_updated_at();

-- Purchases trigger
CREATE OR REPLACE FUNCTION update_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_purchases_updated_at
    BEFORE UPDATE ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_purchases_updated_at();

-- Contact notes trigger
CREATE OR REPLACE FUNCTION update_contact_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_notes_updated_at
    BEFORE UPDATE ON contact_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_notes_updated_at();

-- Post sale tasks trigger
CREATE OR REPLACE FUNCTION update_post_sale_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_sale_tasks_updated_at
    BEFORE UPDATE ON post_sale_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_post_sale_tasks_updated_at();

-- Post sale task templates trigger
CREATE OR REPLACE FUNCTION update_post_sale_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_sale_templates_updated_at
    BEFORE UPDATE ON post_sale_task_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_post_sale_templates_updated_at();

-- Google calendar integrations trigger
CREATE OR REPLACE FUNCTION update_google_calendar_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_google_calendar_integrations_updated_at
    BEFORE UPDATE ON google_calendar_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_google_calendar_integrations_updated_at();

-- ============================================
-- TRIGGER: Auto-create deal stage history
-- ============================================
CREATE OR REPLACE FUNCTION track_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only track if stage actually changed
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
        INSERT INTO deal_stage_history (deal_id, from_stage, to_stage, changed_by)
        VALUES (NEW.id, OLD.stage, NEW.stage, NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_deal_stage_change
    AFTER UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION track_deal_stage_change();

-- ============================================
-- TRIGGER: Auto-create post-sale tasks from templates
-- ============================================
CREATE OR REPLACE FUNCTION create_post_sale_tasks_from_templates()
RETURNS TRIGGER AS $$
DECLARE
    template_record RECORD;
BEGIN
    -- Get all active templates for this product
    FOR template_record IN
        SELECT * FROM post_sale_task_templates
        WHERE product_id = NEW.product_id
        AND is_active = true
        ORDER BY order_index
    LOOP
        -- Create task based on template
        INSERT INTO post_sale_tasks (
            purchase_id,
            contact_id,
            user_id,
            template_id,
            title,
            description,
            task_type,
            due_date,
            status
        ) VALUES (
            NEW.id,
            NEW.contact_id,
            NEW.user_id,
            template_record.id,
            template_record.title,
            template_record.description,
            template_record.task_type,
            NEW.purchase_date + (template_record.days_after_purchase || ' days')::INTERVAL,
            'pending'
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_post_sale_tasks
    AFTER INSERT ON purchases
    FOR EACH ROW
    EXECUTE FUNCTION create_post_sale_tasks_from_templates();

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Pipeline summary by stage
CREATE OR REPLACE VIEW pipeline_summary AS
SELECT
    user_id,
    stage,
    COUNT(*) as deal_count,
    COALESCE(SUM(value), 0) as total_value,
    COALESCE(AVG(value), 0) as avg_value,
    COALESCE(AVG(probability), 0) as avg_probability
FROM deals
WHERE stage NOT IN ('won', 'lost')
GROUP BY user_id, stage;

-- Sales summary
CREATE OR REPLACE VIEW sales_summary AS
SELECT
    user_id,
    DATE_TRUNC('month', purchase_date) as month,
    COUNT(*) as total_sales,
    SUM(total_price) as total_revenue,
    AVG(total_price) as avg_ticket,
    COUNT(DISTINCT contact_id) as unique_customers
FROM purchases
WHERE payment_status IN ('paid', 'partial')
GROUP BY user_id, DATE_TRUNC('month', purchase_date);

-- Post-sale tasks summary
CREATE OR REPLACE VIEW post_sale_summary AS
SELECT
    user_id,
    status,
    COUNT(*) as task_count,
    COUNT(*) FILTER (WHERE due_date < CURRENT_DATE) as overdue_count
FROM post_sale_tasks
GROUP BY user_id, status;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE deals IS 'Pipeline de vendas - oportunidades de negócio';
COMMENT ON TABLE purchases IS 'Vendas efetivadas com detalhes de pagamento';
COMMENT ON TABLE contact_notes IS 'Observações sobre leads/clientes';
COMMENT ON TABLE post_sale_task_templates IS 'Templates de tarefas de pós-venda por produto';
COMMENT ON TABLE post_sale_tasks IS 'Tarefas de pós-venda geradas automaticamente';
COMMENT ON TABLE google_calendar_integrations IS 'Integrações com Google Calendar (OAuth)';

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Inserir templates padrão de pós-venda (exemplo)
-- Estes serão personalizáveis pelo usuário
COMMENT ON TABLE post_sale_task_templates IS 'Templates são criados pelo usuário por produto';
