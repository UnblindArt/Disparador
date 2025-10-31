-- Migration 008: Campaign Cadences
-- Adiciona suporte a cadências (sequências de mensagens) nas campanhas

-- Tabela de cadências (dias da campanha)
CREATE TABLE IF NOT EXISTS campaign_cadences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL, -- Dia 1, 2, 3, etc.
  message TEXT NOT NULL,
  send_time TIME NOT NULL DEFAULT '09:00:00', -- Horário de envio (ex: 09:00, 14:30)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_campaign_day UNIQUE (campaign_id, day_number),
  CONSTRAINT positive_day_number CHECK (day_number > 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_campaign_cadences_campaign_id ON campaign_cadences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_cadences_day_number ON campaign_cadences(day_number);

-- Tabela de mídias das cadências
CREATE TABLE IF NOT EXISTS campaign_cadence_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cadence_id UUID NOT NULL REFERENCES campaign_cadences(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'audio', 'document'
  caption TEXT,
  display_order INTEGER DEFAULT 0, -- Ordem de exibição dos anexos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_media_type CHECK (media_type IN ('image', 'video', 'audio', 'document'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_campaign_cadence_media_cadence_id ON campaign_cadence_media(cadence_id);
CREATE INDEX IF NOT EXISTS idx_campaign_cadence_media_order ON campaign_cadence_media(cadence_id, display_order);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_campaign_cadences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaign_cadences_updated_at
BEFORE UPDATE ON campaign_cadences
FOR EACH ROW
EXECUTE FUNCTION update_campaign_cadences_updated_at();

-- Adicionar colunas nas campanhas para suportar cadências
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS has_cadence BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cadence_interval_days INTEGER DEFAULT 1, -- Intervalo entre envios (padrão: 1 dia)
ADD COLUMN IF NOT EXISTS min_send_delay_seconds INTEGER DEFAULT 3, -- Delay mínimo entre envios
ADD COLUMN IF NOT EXISTS max_send_delay_seconds INTEGER DEFAULT 10; -- Delay máximo entre envios

-- Adicionar constraints (sem IF NOT EXISTS, funcionalidade não suportada em ALTER TABLE ADD CONSTRAINT)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_send_delay_min') THEN
    ALTER TABLE campaigns ADD CONSTRAINT valid_send_delay_min CHECK (min_send_delay_seconds >= 1 AND min_send_delay_seconds <= 30);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_send_delay_max') THEN
    ALTER TABLE campaigns ADD CONSTRAINT valid_send_delay_max CHECK (max_send_delay_seconds >= min_send_delay_seconds AND max_send_delay_seconds <= 60);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_cadence_interval') THEN
    ALTER TABLE campaigns ADD CONSTRAINT valid_cadence_interval CHECK (cadence_interval_days >= 1);
  END IF;
END $$;

-- View para campanhas com cadências
CREATE OR REPLACE VIEW campaigns_with_cadences AS
SELECT
  c.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', cc.id,
        'day_number', cc.day_number,
        'message', cc.message,
        'send_time', cc.send_time,
        'media', (
          SELECT json_agg(
            json_build_object(
              'id', ccm.id,
              'media_url', ccm.media_url,
              'media_type', ccm.media_type,
              'caption', ccm.caption,
              'display_order', ccm.display_order
            )
            ORDER BY ccm.display_order
          )
          FROM campaign_cadence_media ccm
          WHERE ccm.cadence_id = cc.id
        )
      )
      ORDER BY cc.day_number
    ) FILTER (WHERE cc.id IS NOT NULL),
    '[]'::json
  ) as cadences
FROM campaigns c
LEFT JOIN campaign_cadences cc ON cc.campaign_id = c.id
GROUP BY c.id;

-- Comentários
COMMENT ON TABLE campaign_cadences IS 'Dias de cadência das campanhas (sequência de mensagens)';
COMMENT ON TABLE campaign_cadence_media IS 'Mídias anexadas em cada dia da cadência';
COMMENT ON COLUMN campaigns.has_cadence IS 'Se TRUE, campanha usa sistema de cadências ao invés de mensagem única';
COMMENT ON COLUMN campaigns.cadence_interval_days IS 'Intervalo em dias entre cada envio da cadência';
COMMENT ON COLUMN campaigns.min_send_delay_seconds IS 'Delay mínimo (em segundos) entre envios individuais';
COMMENT ON COLUMN campaigns.max_send_delay_seconds IS 'Delay máximo (em segundos) entre envios individuais';
