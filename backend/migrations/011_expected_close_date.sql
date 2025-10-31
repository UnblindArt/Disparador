-- Migration 011: Add expected_close_date to products and contact_products
-- Version: 1.2
-- Description: Adiciona campo de data esperada de fechamento para previsão financeira

-- 1. Adicionar campo na tabela products (data padrão do produto)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS default_close_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS default_close_date DATE;

COMMENT ON COLUMN products.default_close_days IS 'Número padrão de dias até fechamento (ex: 30 dias)';
COMMENT ON COLUMN products.default_close_date IS 'Data padrão de fechamento para este produto (opcional)';

-- 2. Adicionar campo na tabela contact_products (data específica por contato)
ALTER TABLE contact_products
ADD COLUMN IF NOT EXISTS expected_close_date DATE,
ADD COLUMN IF NOT EXISTS deal_value DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS deal_probability INTEGER DEFAULT 50 CHECK (deal_probability >= 0 AND deal_probability <= 100),
ADD COLUMN IF NOT EXISTS deal_status VARCHAR(50) DEFAULT 'lead' CHECK (deal_status IN ('lead', 'qualified', 'negotiating', 'proposal', 'closing', 'won', 'lost'));

COMMENT ON COLUMN contact_products.expected_close_date IS 'Data esperada de fechamento desta oportunidade';
COMMENT ON COLUMN contact_products.deal_value IS 'Valor negociado (pode ser diferente do preço padrão)';
COMMENT ON COLUMN contact_products.deal_probability IS 'Probabilidade de fechamento (0-100%)';
COMMENT ON COLUMN contact_products.deal_status IS 'Status da oportunidade no pipeline';

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_contact_products_expected_close_date
ON contact_products(expected_close_date)
WHERE expected_close_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contact_products_deal_status
ON contact_products(deal_status);

-- 4. Criar view para previsão financeira
CREATE OR REPLACE VIEW financial_forecast AS
SELECT
  DATE_TRUNC('month', expected_close_date) as forecast_month,
  DATE_TRUNC('week', expected_close_date) as forecast_week,
  deal_status,
  COUNT(*) as deal_count,
  SUM(COALESCE(deal_value, p.price)) as total_value,
  SUM(COALESCE(deal_value, p.price) * (deal_probability / 100.0)) as weighted_value,
  AVG(deal_probability) as avg_probability
FROM contact_products cp
JOIN products p ON cp.product_id = p.id
WHERE expected_close_date IS NOT NULL
  AND deal_status NOT IN ('won', 'lost')
  AND expected_close_date >= CURRENT_DATE
GROUP BY DATE_TRUNC('month', expected_close_date),
         DATE_TRUNC('week', expected_close_date),
         deal_status
ORDER BY forecast_month, forecast_week;

COMMENT ON VIEW financial_forecast IS 'Previsão financeira agregada por mês e semana';

-- 5. Criar view para pipeline de vendas
CREATE OR REPLACE VIEW sales_pipeline AS
SELECT
  cp.id,
  cp.contact_id,
  c.name as contact_name,
  c.phone as contact_phone,
  cp.product_id,
  p.name as product_name,
  p.category as product_category,
  COALESCE(cp.deal_value, p.price) as value,
  cp.deal_probability,
  cp.deal_status,
  cp.expected_close_date,
  cp.notes,
  cp.created_at,
  cp.updated_at,
  -- Calcular dias até fechamento
  CASE
    WHEN cp.expected_close_date IS NOT NULL
    THEN cp.expected_close_date - CURRENT_DATE
    ELSE NULL
  END as days_to_close,
  -- Valor ponderado por probabilidade
  COALESCE(cp.deal_value, p.price) * (COALESCE(cp.deal_probability, 50) / 100.0) as weighted_value
FROM contact_products cp
JOIN contacts c ON cp.contact_id = c.id
JOIN products p ON cp.product_id = p.id
WHERE cp.deal_status NOT IN ('won', 'lost')
ORDER BY cp.expected_close_date NULLS LAST, cp.created_at DESC;

COMMENT ON VIEW sales_pipeline IS 'Pipeline de vendas com todas as oportunidades ativas';

-- 6. Função para calcular data de fechamento baseada em agendamento
CREATE OR REPLACE FUNCTION calculate_close_date_from_appointment()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o contato tem agendamento e produto, mas não tem data de fechamento
  -- usar a data do agendamento como estimativa
  IF NEW.start_time IS NOT NULL AND NEW.contact_id IS NOT NULL THEN
    UPDATE contact_products
    SET expected_close_date = DATE(NEW.start_time)
    WHERE contact_id = NEW.contact_id
      AND expected_close_date IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar automaticamente
DROP TRIGGER IF EXISTS trg_appointment_close_date ON appointments;
CREATE TRIGGER trg_appointment_close_date
  AFTER INSERT OR UPDATE ON appointments
  FOR EACH ROW
  WHEN (NEW.status IN ('scheduled', 'confirmed'))
  EXECUTE FUNCTION calculate_close_date_from_appointment();

COMMENT ON FUNCTION calculate_close_date_from_appointment IS 'Atualiza data de fechamento baseado em agendamentos';

-- 7. Função helper para obter forecast do mês
CREATE OR REPLACE FUNCTION get_monthly_forecast(target_month DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  month DATE,
  total_deals BIGINT,
  total_value NUMERIC,
  weighted_value NUMERIC,
  avg_probability NUMERIC,
  by_status JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('month', target_month)::DATE as month,
    SUM(deal_count)::BIGINT as total_deals,
    SUM(total_value) as total_value,
    SUM(weighted_value) as weighted_value,
    AVG(avg_probability) as avg_probability,
    jsonb_object_agg(
      deal_status,
      jsonb_build_object(
        'count', deal_count,
        'value', total_value,
        'weighted', weighted_value
      )
    ) as by_status
  FROM financial_forecast
  WHERE forecast_month = DATE_TRUNC('month', target_month)
  GROUP BY DATE_TRUNC('month', target_month);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_monthly_forecast IS 'Obtém previsão financeira de um mês específico';
