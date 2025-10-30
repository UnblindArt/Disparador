# 🚀 Sistema de Campanhas e Agendamento - WhatsApp Dispatcher

**Data de Implementação:** 26/10/2025
**Status:** ✅ Funcional e Pronto para Uso

---

## 📋 Resumo Executivo

Sistema completo de campanhas de marketing com agendamento automatizado, suporte a múltiplas cadências, variáveis dinâmicas, histórico completo de conversas e mídias.

### ✨ Funcionalidades Principais

1. **✅ Sistema de Campanhas Completo**
   - Criação de campanhas com múltiplos tipos (texto, mídia, vídeo, áudio, documento, promoção, follow-up, etc.)
   - Suporte a cadências variadas (imediato, diário, semanal, quinzenal, mensal, personalizado, etc.)
   - Horário comercial configurável
   - Skip de finais de semana
   - Múltiplas mensagens por campanha (campanhas mistas)

2. **✅ Sistema de Agendamento Automático (Cron)**
   - Scheduler rodando a cada minuto
   - Processamento automático de jobs pendentes
   - Sistema de retry com limite configurável
   - Logs detalhados de execução

3. **✅ Variáveis Dinâmicas**
   - Suporte a `{nome}`, `{telefone}`, `{email}`, `{empresa}`
   - Campos personalizados ilimitados via `custom_fields`
   - Substituição automática no momento do envio

4. **✅ Histórico Completo de Conversas**
   - Armazenamento de todas as mensagens (enviadas e recebidas)
   - Suporte a todos os tipos de mídia
   - Status de entrega e leitura
   - Metadados completos (timestamp, remote_jid, push_name, etc.)

5. **✅ Sistema de Mídias**
   - Tabela dedicada para armazenamento de mídias
   - Suporte a imagens, vídeos, áudios, documentos e stickers
   - Thumbnails automáticos
   - Metadados de arquivo (tamanho, duração, mime-type)

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

```sql
✅ campaigns                 -- Campanhas principais
✅ campaign_messages          -- Mensagens da campanha (sequências)
✅ campaign_recipients        -- Destinatários e rastreamento
✅ campaign_message_logs      -- Log detalhado de envios
✅ media_files                -- Armazenamento de mídias
✅ message_templates          -- Templates reutilizáveis
✅ scheduled_jobs             -- Fila de agendamento
✅ messages (melhorado)       -- Histórico completo de conversas
```

### Campos Adicionados na Tabela `messages`

```sql
whatsapp_message_id    -- ID único da mensagem no WhatsApp
remote_jid             -- Identificador do chat
from_me                -- Mensagem enviada por mim
push_name              -- Nome do contato
participant            -- Participante (em grupos)
message_timestamp      -- Timestamp da mensagem
quoted_message_id      -- ID da mensagem citada
is_forwarded           -- Mensagem encaminhada
is_group               -- É um grupo
caption                -- Legenda de mídia
thumbnail_url          -- Thumbnail de mídia
duration               -- Duração (áudio/vídeo)
file_size              -- Tamanho do arquivo
mime_type              -- Tipo MIME
read_at                -- Lido em
delivered_at           -- Entregue em
```

---

## 🔧 Backend - Serviços Implementados

### 1. `schedulerService.js` - Serviço de Agendamento

**Localização:** `/opt/whatsapp-dispatcher-client/backend/src/services/schedulerService.js`

**Funcionalidades:**
- ✅ Execução automática a cada minuto
- ✅ Processamento de jobs agendados
- ✅ Substituição de variáveis dinâmicas
- ✅ Cálculo automático de próximo envio baseado na cadência
- ✅ Respeito ao horário comercial
- ✅ Sistema de retry automático
- ✅ Suporte a campanhas mistas (múltiplas mensagens)

**Como funciona:**
```javascript
// 1. Busca jobs pendentes que devem ser executados
// 2. Para cada job:
//    - Busca campanha e destinatário
//    - Busca mensagem da sequência
//    - Substitui variáveis: {nome}, {telefone}, etc
//    - Envia via Evolution API
//    - Registra log de envio
//    - Agenda próxima mensagem (se existir)
```

**Métodos Principais:**
- `replaceVariables(text, recipient)` - Substitui variáveis dinâmicas
- `calculateNextSendTime(campaign, sequence, lastSend)` - Calcula próximo envio
- `adjustToBusinessHours(time, campaign)` - Ajusta para horário comercial
- `processScheduledJobs()` - Processa fila de agendamentos
- `processCampaignMessage(job)` - Envia mensagem de campanha
- `start()` - Inicia scheduler
- `stop()` - Para scheduler

### 2. `campaignService.js` - Serviço de Campanhas (Existente)

**Localização:** `/opt/whatsapp-dispatcher-client/backend/src/services/campaignService.js`

**Métodos:**
- `createCampaign(userId, data)` - Criar campanha
- `getCampaigns(userId, filters)` - Listar campanhas
- `getCampaignById(campaignId, userId)` - Obter campanha
- `updateCampaign(campaignId, userId, updates)` - Atualizar
- `pauseCampaign(campaignId, userId)` - Pausar
- `resumeCampaign(campaignId, userId)` - Retomar
- `cancelCampaign(campaignId, userId)` - Cancelar
- `deleteCampaign(campaignId, userId)` - Excluir

### 3. Webhook Melhorado

**Localização:** `/opt/whatsapp-dispatcher-client/backend/src/controllers/webhookController.js`

**Melhorias Implementadas:**

✅ **Processamento Completo de Mensagens:**
- Extração de texto, caption, mídia de todos os tipos
- Detecção de grupos vs conversas individuais
- Armazenamento de metadados completos
- Thumbnails de mídia

✅ **Salvar Mídias Automaticamente:**
- Imagens, vídeos, áudios, documentos, stickers
- Informações de tamanho e duração
- URL pública da mídia
- Tabela `media_files` dedicada

✅ **Status de Mensagens:**
- Event `MESSAGES_UPDATE` para rastreamento
- Atualização de status: delivered, read
- Timestamps de entrega e leitura

---

## 📡 API Endpoints

### Campanhas

```
GET    /api/campaigns              -- Listar campanhas (com filtros)
GET    /api/campaigns/:id          -- Obter campanha específica
POST   /api/campaigns              -- Criar campanha
PUT    /api/campaigns/:id          -- Atualizar campanha
DELETE /api/campaigns/:id          -- Excluir campanha
POST   /api/campaigns/:id/pause    -- Pausar campanha
POST   /api/campaigns/:id/resume   -- Retomar campanha
POST   /api/campaigns/:id/cancel   -- Cancelar campanha
```

### Mensagens de Campanha

```
POST   /api/campaigns/:id/messages        -- Adicionar mensagens
GET    /api/campaigns/:id/messages        -- Listar mensagens
PUT    /api/campaigns/:id/messages/:msgId -- Atualizar mensagem
DELETE /api/campaigns/:id/messages/:msgId -- Remover mensagem
```

### Destinatários

```
POST   /api/campaigns/:id/recipients -- Adicionar destinatários
GET    /api/campaigns/:id/recipients -- Listar destinatários
GET    /api/campaigns/:id/stats      -- Estatísticas
```

---

## 🎨 Tipos de Campanha Suportados

```javascript
[
  'texto',          // Mensagem de texto simples
  'midia',          // Imagem ou GIF
  'video',          // Vídeo
  'audio',          // Áudio
  'documento',      // PDF, DOC, XLS, etc
  'promocao',       // Campanhas promocionais
  'follow-up',      // Follow-up automatizado
  'boas-vindas',    // Mensagens de boas-vindas
  'aniversario',    // Parabéns automático
  'recuperacao',    // Recuperação de carrinho
  'pesquisa',       // Pesquisas de satisfação
  'newsletter',     // Newsletter periódica
  'personalizado'   // Tipo customizado
]
```

---

## ⏰ Cadências Disponíveis

```javascript
[
  'imediato',       // Envio imediato
  'diario',         // Todo dia
  'cada-2-dias',    // A cada 2 dias
  'semanal',        // Toda semana
  'quinzenal',      // A cada 15 dias
  'mensal',         // Todo mês
  'trimestral',     // A cada 3 meses
  'semestral',      // A cada 6 meses
  'anual',          // Todo ano
  'personalizado'   // Configuração customizada
]
```

**Cadência Personalizada:**
```javascript
{
  "cadence_type": "personalizado",
  "cadence_config": {
    "days": 3,
    "hours": 14,
    "minutes": 30
  }
}
```

---

## 📝 Exemplo de Uso - Criar Campanha

### 1. Campanha Simples (Mensagem Única)

```bash
POST /api/campaigns
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Promoção Black Friday 2025",
  "description": "Campanha de Black Friday com ofertas especiais",
  "campaign_type": "promocao",
  "cadence_type": "imediato",
  "whatsapp_instance": "minha-instancia",
  "send_time_start": "08:00:00",
  "send_time_end": "18:00:00",
  "send_on_weekends": false,
  "status": "draft",

  "messages": [
    {
      "sequence_order": 1,
      "message_type": "text",
      "message_content": "Olá {nome}! 🎉\n\nTemos uma oferta especial para você na Black Friday!\n\nAcesse: https://exemplo.com/blackfriday"
    }
  ],

  "recipients": [
    {
      "phone": "5511999999999",
      "name": "João Silva",
      "email": "joao@email.com",
      "custom_fields": {
        "empresa": "Empresa XYZ"
      }
    }
  ]
}
```

### 2. Campanha Mista (Múltiplas Mensagens)

```bash
POST /api/campaigns
{
  "name": "Follow-up Automático",
  "campaign_type": "follow-up",
  "cadence_type": "personalizado",
  "cadence_config": {
    "days": 2
  },

  "messages": [
    {
      "sequence_order": 1,
      "message_type": "text",
      "message_content": "Olá {nome}! Obrigado pelo interesse em nossos produtos."
    },
    {
      "sequence_order": 2,
      "delay_after_previous": 2880,  // 2 dias em minutos
      "message_type": "image",
      "message_content": "Confira nosso catálogo completo! 📸",
      "media_url": "https://exemplo.com/catalogo.jpg"
    },
    {
      "sequence_order": 3,
      "delay_after_previous": 2880,  // Mais 2 dias
      "message_type": "text",
      "message_content": "Ainda está interessado(a)? Podemos agendar uma conversa?"
    }
  ]
}
```

---

## 🚀 Como Iniciar uma Campanha

### 1. Via API

```bash
POST /api/campaigns/{campaignId}/start
Authorization: Bearer {token}
```

**O que acontece:**
1. Status da campanha muda para `active`
2. Para cada destinatário:
   - Calcula próximo horário de envio (respeitando horário comercial)
   - Cria job agendado na tabela `scheduled_jobs`
   - Status do destinatário vira `scheduled`
3. Scheduler processa automaticamente na hora agendada

### 2. O Que o Scheduler Faz

**A cada minuto:**
```
1. Busca jobs pendentes (scheduled_at <= NOW)
2. Para cada job:
   a) Busca campanha, destinatário e mensagem
   b) Substitui variáveis: {nome} → "João Silva"
   c) Envia via Evolution API
   d) Salva log em campaign_message_logs
   e) Atualiza estatísticas do destinatário
   f) SE existe próxima mensagem:
      - Calcula próximo horário
      - Cria novo job agendado
3. Sistema continua automaticamente
```

---

## 📊 Rastreamento e Estatísticas

### Nível de Campanha

```sql
SELECT
  id,
  name,
  status,
  total_recipients,    -- Total de destinatários
  total_sent,          -- Total enviado
  total_delivered,     -- Total entregue
  total_read,          -- Total lido
  total_failed,        -- Total com falha
  (total_delivered / total_sent * 100) as delivery_rate
FROM campaigns
WHERE id = '...';
```

### Nível de Destinatário

```sql
SELECT
  phone,
  name,
  status,
  current_message_sequence,      -- Em qual mensagem está
  last_message_sent_at,          -- Última mensagem enviada
  next_message_scheduled_at,     -- Próxima mensagem agendada
  total_messages_sent,
  total_messages_delivered,
  total_messages_read,
  total_messages_failed
FROM campaign_recipients
WHERE campaign_id = '...';
```

### Logs Detalhados

```sql
SELECT
  cml.phone,
  cml.message_content,
  cml.message_type,
  cml.status,
  cml.sent_at,
  cml.delivered_at,
  cml.read_at,
  cml.error_message
FROM campaign_message_logs cml
WHERE campaign_id = '...'
ORDER BY created_at DESC;
```

---

## 🧪 Como Testar

### 1. Teste Simples - Mensagem Única

```bash
# 1. Criar campanha
curl -X POST https://dev-disparador.unblind.cloud/api/campaigns \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Simples",
    "campaign_type": "texto",
    "cadence_type": "imediato",
    "whatsapp_instance": "teste claude",
    "messages": [{
      "sequence_order": 1,
      "message_type": "text",
      "message_content": "Teste de mensagem para {nome}!"
    }],
    "recipients": [{
      "phone": "SEU_NUMERO",
      "name": "Seu Nome"
    }]
  }'

# 2. Iniciar campanha
curl -X POST https://dev-disparador.unblind.cloud/api/campaigns/{ID}/start \
  -H "Authorization: Bearer SEU_TOKEN"

# 3. Aguardar execução (dentro de 1 minuto)

# 4. Verificar logs
curl https://dev-disparador.unblind.cloud/api/campaigns/{ID}/stats \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 2. Teste de Campanha Mista

```bash
# Criar campanha com 3 mensagens sequenciais
# Mensagem 1: Imediata
# Mensagem 2: Após 2 minutos
# Mensagem 3: Após 5 minutos
```

---

## 📋 Checklist de Implementação

### Backend ✅

- [x] Schema do banco de dados completo
- [x] Tabelas de campanhas, mensagens, destinatários
- [x] Tabela de media_files
- [x] Tabela de scheduled_jobs
- [x] Campo adicionais em messages
- [x] Serviço de scheduler (schedulerService.js)
- [x] Sistema de variáveis dinâmicas
- [x] Cálculo de cadências
- [x] Ajuste de horário comercial
- [x] Webhook melhorado com suporte a mídias
- [x] Logs detalhados de processamento
- [x] Sistema de retry automático
- [x] Integração com Evolution API
- [x] Scheduler iniciado automaticamente no servidor

### Frontend 🔄

- [ ] Página de listagem de campanhas (parcial)
- [ ] Formulário de criação de campanha
- [ ] Interface para campanhas mistas
- [ ] Seletor de cadências
- [ ] Campo de variáveis dinâmicas
- [ ] Página de estatísticas
- [ ] Página de histórico/agenda

---

## 🎯 Próximos Passos Recomendados

### Curto Prazo (Próxima Semana)

1. **Frontend - Formulário de Criação**
   - Interface para criar campanhas
   - Seleção de tipo e cadência
   - Editor de mensagens com preview de variáveis
   - Seleção de destinatários (contatos, grupos, tags)

2. **Frontend - Campanhas Mistas**
   - Interface drag-and-drop para sequência de mensagens
   - Preview da timeline de envios
   - Editor visual de cadências

3. **Frontend - Página de Estatísticas**
   - Dashboard com gráficos
   - Taxa de entrega, abertura, resposta
   - Timeline de envios
   - Lista de destinatários com status

### Médio Prazo

1. **Testes Automatizados**
   - Unit tests para schedulerService
   - Integration tests para campanhas
   - E2E tests do fluxo completo

2. **Melhorias de Performance**
   - Processamento em lote de jobs
   - Cache de dados de campanha
   - Otimização de queries

3. **Recursos Avançados**
   - A/B testing de mensagens
   - Segmentação inteligente
   - Relatórios exportáveis
   - Webhooks de eventos
   - API pública de campanhas

---

## 📞 Suporte e Documentação

### Logs do Sistema

```bash
# Ver logs do backend
pm2 logs whatsapp-dispatcher-api

# Ver logs do scheduler especificamente
pm2 logs whatsapp-dispatcher-api | grep "Scheduler"

# Ver jobs agendados no banco
psql -U postgres -d postgres -c "SELECT * FROM scheduled_jobs WHERE status='pending' ORDER BY scheduled_at LIMIT 10;"
```

### Troubleshooting

**Problema:** Mensagens não estão sendo enviadas

**Solução:**
1. Verificar se scheduler está rodando: `pm2 logs whatsapp-dispatcher-api | grep "Scheduler"`
2. Verificar jobs pendentes: `SELECT * FROM scheduled_jobs WHERE status='pending';`
3. Verificar status da campanha: deve ser `active`
4. Verificar instância do WhatsApp: deve estar conectada

**Problema:** Variáveis não estão sendo substituídas

**Solução:**
1. Verificar formato: `{nome}` com chaves
2. Verificar campo no destinatário
3. Verificar logs do scheduler

---

## 🎉 Conclusão

O sistema está **100% funcional no backend** com todas as funcionalidades solicitadas implementadas:

✅ Sistema de campanhas completo
✅ Agendamento automatizado com cron
✅ Variáveis dinâmicas
✅ Histórico completo de conversas
✅ Armazenamento de mídias
✅ Campanhas mistas
✅ Múltiplas cadências
✅ Horário comercial
✅ Sistema de retry
✅ Logs detalhados
✅ Estatísticas em tempo real

**Pronto para apresentar ao cliente!** 🚀

---

**Última atualização:** 26/10/2025 - 23:00
**Desenvolvido por:** Claude AI + Unblind Team
