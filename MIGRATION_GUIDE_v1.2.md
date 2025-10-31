# 🔧 Guia de Migração - Versão 1.2

## ⚠️ IMPORTANTE: Executar ANTES de fazer deploy da v1.2

Esta migração adiciona campos essenciais para previsão financeira e pipeline de vendas.

---

## 📋 Passo a Passo

### 1. Acessar o Supabase SQL Editor

1. Acesse: https://supabase.com/dashboard/project/paqouvslrflvtwzvukdo
2. Menu lateral → **SQL Editor**
3. Clique em **New Query**

### 2. Executar a Migração 011

Copie e cole o conteúdo do arquivo:
```
/opt/whatsapp-dispatcher-client/backend/migrations/011_expected_close_date.sql
```

Ou execute linha por linha:

```sql
-- 1. Adicionar campos na tabela products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS default_close_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS default_close_date DATE;

-- 2. Adicionar campos na tabela contact_products
ALTER TABLE contact_products
ADD COLUMN IF NOT EXISTS expected_close_date DATE,
ADD COLUMN IF NOT EXISTS deal_value DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS deal_probability INTEGER DEFAULT 50 CHECK (deal_probability >= 0 AND deal_probability <= 100),
ADD COLUMN IF NOT EXISTS deal_status VARCHAR(50) DEFAULT 'lead' CHECK (deal_status IN ('lead', 'qualified', 'negotiating', 'proposal', 'closing', 'won', 'lost'));

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_contact_products_expected_close_date
ON contact_products(expected_close_date)
WHERE expected_close_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contact_products_deal_status
ON contact_products(deal_status);
```

### 3. Verificar Sucesso

Execute esta query para verificar:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'contact_products'
  AND column_name IN ('expected_close_date', 'deal_value', 'deal_probability', 'deal_status')
ORDER BY column_name;
```

**Resultado esperado:**
```
deal_probability    | integer
deal_status         | character varying
deal_value          | numeric
expected_close_date | date
```

---

## 🎯 O que essa migração adiciona?

### Tabela `products`:
- `default_close_days`: Dias padrão até fechamento (ex: 30 dias)
- `default_close_date`: Data padrão de fechamento (opcional)

### Tabela `contact_products`:
- `expected_close_date`: Data esperada de fechamento da oportunidade
- `deal_value`: Valor negociado (pode ser diferente do preço padrão)
- `deal_probability`: Probabilidade de fechamento (0-100%)
- `deal_status`: Status no pipeline (lead, qualified, negotiating, proposal, closing, won, lost)

### Views Criadas:
- `financial_forecast`: Previsão financeira agregada
- `sales_pipeline`: Pipeline de vendas completo

### Funções:
- `calculate_close_date_from_appointment()`: Calcula data de fechamento baseado em agendamentos
- `get_monthly_forecast()`: Obtém previsão de um mês específico

---

## 📊 Novos Endpoints da API (após deploy)

### Previsão Financeira
```bash
GET /api/forecast/monthly?months=3
GET /api/forecast/pipeline?status=negotiating
GET /api/forecast/stats
PUT /api/forecast/opportunities/:id
```

### Exemplo de Uso

**Obter previsão dos próximos 3 meses:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  https://dev-disparador.unblind.cloud/api/forecast/monthly?months=3
```

**Atualizar oportunidade:**
```bash
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "expected_close_date": "2025-11-15",
    "deal_value": 500,
    "deal_probability": 75,
    "deal_status": "negotiating"
  }' \
  https://dev-disparador.unblind.cloud/api/forecast/opportunities/{id}
```

---

## 🔍 Lógica de Inteligência Financeira

### Como funciona:

1. **Lead com Produto + Agendamento**
   ```
   → expected_close_date = data do agendamento
   → Aparece na previsão do mês do agendamento
   ```

2. **Lead com Produto SEM Agendamento**
   ```
   → deal_status = 'lead' ou 'negotiating'
   → Aparece como "em negociação"
   ```

3. **Cálculo de Valor Ponderado**
   ```javascript
   weighted_value = deal_value * (deal_probability / 100)

   Exemplo:
   - Produto: R$ 500
   - Probabilidade: 75%
   - Valor ponderado: R$ 375
   ```

4. **Pipeline de Status**
   ```
   lead → qualified → negotiating → proposal → closing → won/lost
   ```

---

## ⚡ Trigger Automático

Quando um agendamento é criado/atualizado:
- Se o contato tem produtos associados
- E NÃO tem `expected_close_date`
- Sistema automaticamente define `expected_close_date = data do agendamento`

---

## 🧪 Testando a Migração

1. Execute a migração no Supabase
2. Restart do backend: `pm2 restart whatsapp-dispatcher-api`
3. Teste os endpoints:

```bash
TOKEN="seu-token-aqui"

# Ver estatísticas
curl -H "Authorization: Bearer $TOKEN" \
  https://dev-disparador.unblind.cloud/api/forecast/stats

# Ver previsão mensal
curl -H "Authorization: Bearer $TOKEN" \
  https://dev-disparador.unblind.cloud/api/forecast/monthly
```

---

## 🔄 Rollback (se necessário)

Para reverter a migração:

```sql
-- Remover colunas de products
ALTER TABLE products
DROP COLUMN IF EXISTS default_close_days,
DROP COLUMN IF EXISTS default_close_date;

-- Remover colunas de contact_products
ALTER TABLE contact_products
DROP COLUMN IF EXISTS expected_close_date,
DROP COLUMN IF EXISTS deal_value,
DROP COLUMN IF EXISTS deal_probability,
DROP COLUMN IF EXISTS deal_status;

-- Remover índices
DROP INDEX IF EXISTS idx_contact_products_expected_close_date;
DROP INDEX IF EXISTS idx_contact_products_deal_status;

-- Remover views e funções
DROP VIEW IF EXISTS financial_forecast;
DROP VIEW IF EXISTS sales_pipeline;
DROP FUNCTION IF EXISTS calculate_close_date_from_appointment();
DROP FUNCTION IF EXISTS get_monthly_forecast(DATE);
```

---

## ✅ Checklist de Deploy

- [ ] Migração 011 executada no Supabase
- [ ] Verificação de colunas OK
- [ ] Views criadas
- [ ] Índices criados
- [ ] Backend restart (PM2)
- [ ] Teste de endpoints
- [ ] Deploy do frontend (quando pronto)

---

**Data de criação:** 2025-10-31
**Versão alvo:** 1.2
**Status:** 🚧 Aguardando execução manual
