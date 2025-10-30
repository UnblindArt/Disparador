-- =====================================================
-- SISTEMA DE CAMPANHAS E AGENDAMENTO
-- WhatsApp Dispatcher - Unblind
-- Data: 2025-10-26
-- =====================================================

-- 1. TABELA DE CAMPANHAS
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Informações básicas da campanha
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Tipo de campanha
    campaign_type VARCHAR(50) NOT NULL CHECK (campaign_type IN (
        'texto',
        'midia',
        'video',
        'audio',
        'documento',
        'promocao',
        'follow-up',
        'boas-vindas',
        'aniversario',
        'recuperacao',
        'pesquisa',
        'newsletter',
        'personalizado'
    )),

    -- Cadência de envio
    cadence_type VARCHAR(50) NOT NULL CHECK (cadence_type IN (
        'imediato',
        'diario',
        'cada-2-dias',
        'semanal',
        'quinzenal',
        'mensal',
        'trimestral',
        'semestral',
        'anual',
        'personalizado'
    )),

    -- Configurações de cadência personalizada
    cadence_config JSONB DEFAULT '{}', -- { days: 3, hours: 14, minutes: 30 }

    -- Status da campanha
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
        'draft',      -- Rascunho
        'active',     -- Ativa
        'paused',     -- Pausada
        'completed',  -- Concluída
        'cancelled'   -- Cancelada
    )),

    -- Configurações de envio
    whatsapp_instance VARCHAR(255), -- Instância do WhatsApp a usar
    send_immediately BOOLEAN DEFAULT false,
    scheduled_start TIMESTAMP WITH TIME ZONE, -- Início do agendamento
    scheduled_end TIMESTAMP WITH TIME ZONE,   -- Fim do agendamento (opcional)

    -- Horários de envio permitidos
    send_time_start TIME DEFAULT '08:00:00', -- Início do horário comercial
    send_time_end TIME DEFAULT '18:00:00',   -- Fim do horário comercial
    send_on_weekends BOOLEAN DEFAULT false,

    -- Estatísticas
    total_recipients INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_read INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Índices para busca
    CONSTRAINT campaigns_name_user_unique UNIQUE(user_id, name)
);

-- 2. TABELA DE MENSAGENS DA CAMPANHA (Campanhas Mistas)
CREATE TABLE IF NOT EXISTS campaign_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

    -- Ordem e cadência da mensagem
    sequence_order INTEGER NOT NULL DEFAULT 1, -- Ordem de envio (1, 2, 3...)
    delay_after_previous INTEGER DEFAULT 0, -- Delay em minutos após mensagem anterior

    -- Conteúdo da mensagem
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN (
        'text',
        'image',
        'video',
        'audio',
        'document',
        'sticker',
        'contact',
        'location'
    )),

    -- Conteúdo (suporta variáveis: {nome}, {telefone}, {email}, {empresa}, etc)
    message_content TEXT NOT NULL,

    -- Mídia (se aplicável)
    media_url TEXT,
    media_type VARCHAR(50), -- image/jpeg, video/mp4, etc
    media_caption TEXT,
    media_filename VARCHAR(255),

    -- Metadados adicionais
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT campaign_messages_order_unique UNIQUE(campaign_id, sequence_order)
);

-- 3. TABELA DE DESTINATÁRIOS DA CAMPANHA
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

    -- Informações do destinatário
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    custom_fields JSONB DEFAULT '{}', -- Campos personalizados para variáveis

    -- Status do envio
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',    -- Aguardando envio
        'scheduled',  -- Agendado
        'sending',    -- Enviando
        'sent',       -- Enviado
        'delivered',  -- Entregue
        'read',       -- Lido
        'failed',     -- Falhou
        'cancelled'   -- Cancelado
    )),

    -- Rastreamento de mensagens
    current_message_sequence INTEGER DEFAULT 1, -- Qual mensagem da sequência está
    last_message_sent_at TIMESTAMP WITH TIME ZONE,
    next_message_scheduled_at TIMESTAMP WITH TIME ZONE,

    -- Estatísticas individuais
    total_messages_sent INTEGER DEFAULT 0,
    total_messages_delivered INTEGER DEFAULT 0,
    total_messages_read INTEGER DEFAULT 0,
    total_messages_failed INTEGER DEFAULT 0,

    -- Erro (se houver)
    error_message TEXT,
    error_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT campaign_recipients_unique UNIQUE(campaign_id, phone)
);

-- 4. TABELA DE HISTÓRICO DE ENVIOS
CREATE TABLE IF NOT EXISTS campaign_message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    campaign_recipient_id UUID NOT NULL REFERENCES campaign_recipients(id) ON DELETE CASCADE,
    campaign_message_id UUID REFERENCES campaign_messages(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL, -- Link para tabela messages

    -- Informações do envio
    phone VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    media_url TEXT,

    -- Status do envio
    status VARCHAR(20) DEFAULT 'pending',

    -- IDs externos (Evolution API)
    external_message_id VARCHAR(255),
    whatsapp_message_id VARCHAR(255),

    -- Timestamps de rastreamento
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,

    -- Erro
    error_message TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. MELHORIAS NA TABELA MESSAGES (Histórico Completo)
-- Adicionar campos para rastreamento completo de conversas

ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS whatsapp_message_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS remote_jid VARCHAR(255),
    ADD COLUMN IF NOT EXISTS from_me BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS push_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS participant VARCHAR(255),
    ADD COLUMN IF NOT EXISTS message_timestamp BIGINT,
    ADD COLUMN IF NOT EXISTS quoted_message_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS is_forwarded BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS forwarded_times INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS group_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS caption TEXT,
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
    ADD COLUMN IF NOT EXISTS duration INTEGER,
    ADD COLUMN IF NOT EXISTS file_size BIGINT,
    ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- 6. TABELA DE MÍDIAS (Armazenamento de arquivos recebidos/enviados)
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,

    -- Informações do arquivo
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    file_path TEXT NOT NULL, -- Caminho no servidor ou URL
    file_url TEXT, -- URL pública (se aplicável)

    -- Tipo e tamanho
    mime_type VARCHAR(100),
    media_type VARCHAR(50), -- image, video, audio, document
    file_size BIGINT,

    -- Metadados de mídia
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- Para áudio/vídeo em segundos
    thumbnail_url TEXT,

    -- Informações de origem
    source VARCHAR(50) DEFAULT 'whatsapp', -- whatsapp, upload, campaign
    whatsapp_instance VARCHAR(255),
    remote_jid VARCHAR(255),

    -- Metadados adicionais
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA DE TEMPLATES DE MENSAGEM (Reutilizáveis)
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Informações do template
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- saudacao, follow-up, promocao, etc

    -- Conteúdo
    message_type VARCHAR(50) NOT NULL,
    message_content TEXT NOT NULL,
    media_url TEXT,

    -- Variáveis disponíveis
    available_variables TEXT[], -- ['nome', 'telefone', 'empresa', etc]

    -- Uso
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT templates_name_user_unique UNIQUE(user_id, name)
);

-- 8. TABELA DE AGENDAMENTOS (Schedule/Cron Jobs)
CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Tipo de job
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN (
        'campaign_message',
        'campaign_start',
        'report',
        'sync',
        'cleanup',
        'custom'
    )),

    -- Referências
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    campaign_recipient_id UUID REFERENCES campaign_recipients(id) ON DELETE CASCADE,

    -- Agendamento
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE,

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled'
    )),

    -- Payload (dados do job)
    payload JSONB DEFAULT '{}',

    -- Resultado
    result JSONB,
    error_message TEXT,

    -- Retry
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_start ON campaigns(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_campaigns_instance ON campaigns(whatsapp_instance);

-- Campaign Messages
CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign_id ON campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_order ON campaign_messages(campaign_id, sequence_order);

-- Campaign Recipients
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_phone ON campaign_recipients(phone);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_next_scheduled ON campaign_recipients(next_message_scheduled_at);

-- Campaign Message Logs
CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign_id ON campaign_message_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_recipient_id ON campaign_message_logs(campaign_recipient_id);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_status ON campaign_message_logs(status);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_scheduled_at ON campaign_message_logs(scheduled_at);

-- Messages (histórico)
CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_id ON messages(whatsapp_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_remote_jid ON messages(remote_jid);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(message_timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_user_phone ON messages(user_id, phone);

-- Media Files
CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_message_id ON media_files(message_id);
CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(media_type);
CREATE INDEX IF NOT EXISTS idx_media_files_instance ON media_files(whatsapp_instance);

-- Message Templates
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON message_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON message_templates(category);

-- Scheduled Jobs
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_status ON scheduled_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_scheduled_at ON scheduled_jobs(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_campaign_id ON scheduled_jobs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_type ON scheduled_jobs(job_type);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Campaigns
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Campaign Messages
DROP TRIGGER IF EXISTS update_campaign_messages_updated_at ON campaign_messages;
CREATE TRIGGER update_campaign_messages_updated_at
    BEFORE UPDATE ON campaign_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Campaign Recipients
DROP TRIGGER IF EXISTS update_campaign_recipients_updated_at ON campaign_recipients;
CREATE TRIGGER update_campaign_recipients_updated_at
    BEFORE UPDATE ON campaign_recipients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Campaign Message Logs
DROP TRIGGER IF EXISTS update_campaign_logs_updated_at ON campaign_message_logs;
CREATE TRIGGER update_campaign_logs_updated_at
    BEFORE UPDATE ON campaign_message_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Media Files
DROP TRIGGER IF EXISTS update_media_files_updated_at ON media_files;
CREATE TRIGGER update_media_files_updated_at
    BEFORE UPDATE ON media_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Message Templates
DROP TRIGGER IF EXISTS update_templates_updated_at ON message_templates;
CREATE TRIGGER update_templates_updated_at
    BEFORE UPDATE ON message_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Scheduled Jobs
DROP TRIGGER IF EXISTS update_scheduled_jobs_updated_at ON scheduled_jobs;
CREATE TRIGGER update_scheduled_jobs_updated_at
    BEFORE UPDATE ON scheduled_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para calcular próximo horário de envio baseado na cadência
CREATE OR REPLACE FUNCTION calculate_next_send_time(
    p_cadence_type VARCHAR,
    p_cadence_config JSONB,
    p_last_send TIMESTAMP WITH TIME ZONE,
    p_send_time_start TIME,
    p_send_time_end TIME,
    p_send_on_weekends BOOLEAN
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    v_next_time TIMESTAMP WITH TIME ZONE;
    v_interval INTERVAL;
BEGIN
    -- Calcular intervalo baseado no tipo de cadência
    CASE p_cadence_type
        WHEN 'imediato' THEN
            v_interval := INTERVAL '0 minutes';
        WHEN 'diario' THEN
            v_interval := INTERVAL '1 day';
        WHEN 'cada-2-dias' THEN
            v_interval := INTERVAL '2 days';
        WHEN 'semanal' THEN
            v_interval := INTERVAL '7 days';
        WHEN 'quinzenal' THEN
            v_interval := INTERVAL '14 days';
        WHEN 'mensal' THEN
            v_interval := INTERVAL '1 month';
        WHEN 'trimestral' THEN
            v_interval := INTERVAL '3 months';
        WHEN 'semestral' THEN
            v_interval := INTERVAL '6 months';
        WHEN 'anual' THEN
            v_interval := INTERVAL '1 year';
        WHEN 'personalizado' THEN
            v_interval := (
                COALESCE((p_cadence_config->>'days')::INTEGER, 0) || ' days ' ||
                COALESCE((p_cadence_config->>'hours')::INTEGER, 0) || ' hours ' ||
                COALESCE((p_cadence_config->>'minutes')::INTEGER, 0) || ' minutes'
            )::INTERVAL;
        ELSE
            v_interval := INTERVAL '1 day';
    END CASE;

    -- Calcular próximo horário
    v_next_time := COALESCE(p_last_send, NOW()) + v_interval;

    -- Ajustar para horário comercial
    IF v_next_time::TIME < p_send_time_start THEN
        v_next_time := v_next_time::DATE + p_send_time_start;
    ELSIF v_next_time::TIME > p_send_time_end THEN
        v_next_time := (v_next_time::DATE + INTERVAL '1 day') + p_send_time_start;
    END IF;

    -- Pular finais de semana se necessário
    IF NOT p_send_on_weekends THEN
        WHILE EXTRACT(DOW FROM v_next_time) IN (0, 6) LOOP
            v_next_time := v_next_time + INTERVAL '1 day';
        END LOOP;
    END IF;

    RETURN v_next_time;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View: Estatísticas de campanhas
CREATE OR REPLACE VIEW campaign_statistics AS
SELECT
    c.id,
    c.name,
    c.campaign_type,
    c.status,
    c.created_at,
    COUNT(DISTINCT cr.id) as total_recipients,
    COUNT(DISTINCT CASE WHEN cr.status = 'sent' THEN cr.id END) as sent_count,
    COUNT(DISTINCT CASE WHEN cr.status = 'delivered' THEN cr.id END) as delivered_count,
    COUNT(DISTINCT CASE WHEN cr.status = 'read' THEN cr.id END) as read_count,
    COUNT(DISTINCT CASE WHEN cr.status = 'failed' THEN cr.id END) as failed_count,
    ROUND(
        CASE
            WHEN COUNT(DISTINCT cr.id) > 0
            THEN (COUNT(DISTINCT CASE WHEN cr.status = 'sent' THEN cr.id END)::DECIMAL / COUNT(DISTINCT cr.id)) * 100
            ELSE 0
        END,
        2
    ) as delivery_rate
FROM campaigns c
LEFT JOIN campaign_recipients cr ON c.id = cr.campaign_id
GROUP BY c.id, c.name, c.campaign_type, c.status, c.created_at;

-- View: Próximos envios agendados
CREATE OR REPLACE VIEW upcoming_scheduled_messages AS
SELECT
    sj.id,
    sj.job_type,
    sj.scheduled_at,
    c.name as campaign_name,
    cr.phone,
    cr.name as recipient_name,
    sj.status
FROM scheduled_jobs sj
LEFT JOIN campaigns c ON sj.campaign_id = c.id
LEFT JOIN campaign_recipients cr ON sj.campaign_recipient_id = cr.id
WHERE sj.status = 'pending'
    AND sj.scheduled_at > NOW()
ORDER BY sj.scheduled_at ASC;

-- =====================================================
-- DADOS INICIAIS / SEEDS
-- =====================================================

-- Inserir categorias padrão de templates (se necessário no futuro)

COMMENT ON TABLE campaigns IS 'Tabela principal de campanhas de marketing/comunicação';
COMMENT ON TABLE campaign_messages IS 'Mensagens individuais de uma campanha (suporta campanhas mistas)';
COMMENT ON TABLE campaign_recipients IS 'Destinatários de cada campanha com status de envio';
COMMENT ON TABLE campaign_message_logs IS 'Log detalhado de cada mensagem enviada';
COMMENT ON TABLE media_files IS 'Armazenamento de mídias enviadas/recebidas pelo WhatsApp';
COMMENT ON TABLE message_templates IS 'Templates reutilizáveis de mensagens';
COMMENT ON TABLE scheduled_jobs IS 'Fila de jobs agendados para processamento';
