#!/bin/bash

# ===========================================
# Script de Teste - Sistema de Campanhas
# WhatsApp Dispatcher
# ===========================================

BASE_URL="https://dev-disparador.unblind.cloud/api"
TOKEN=""  # Preencher após login

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "============================================"
echo "  TESTES - SISTEMA DE CAMPANHAS"
echo "============================================"
echo ""

# ===========================================
# 1. LOGIN
# ===========================================
echo -e "${BLUE}1. Fazendo login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apps@unblind.art",
    "password": "SUA_SENHA_AQUI"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Erro no login${NC}"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Login realizado com sucesso${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# ===========================================
# 2. TESTE 1: Campanha Simples
# ===========================================
echo -e "${BLUE}2. Criando campanha simples (mensagem única)...${NC}"

CAMPAIGN1=$(curl -s -X POST "$BASE_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Simples - '"$(date +%H:%M:%S)"'",
    "description": "Campanha de teste com mensagem única",
    "campaign_type": "texto",
    "cadence_type": "imediato",
    "whatsapp_instance": "teste claude",
    "send_time_start": "00:00:00",
    "send_time_end": "23:59:59",
    "send_on_weekends": true,
    "targetType": "upload",
    "message": "Olá {nome}! Esta é uma mensagem de teste enviada automaticamente pelo sistema de campanhas. 🚀",
    "uploadedContacts": [
      {
        "phone": "5511999999999",
        "name": "Teste Usuario"
      }
    ]
  }')

CAMPAIGN1_ID=$(echo $CAMPAIGN1 | jq -r '.data.id')

if [ "$CAMPAIGN1_ID" = "null" ] || [ -z "$CAMPAIGN1_ID" ]; then
  echo -e "${RED}❌ Erro ao criar campanha${NC}"
  echo $CAMPAIGN1 | jq '.'
else
  echo -e "${GREEN}✅ Campanha criada: $CAMPAIGN1_ID${NC}"
  echo ""

  # Iniciar campanha
  echo -e "${BLUE}   Iniciando campanha...${NC}"
  START1=$(curl -s -X POST "$BASE_URL/campaigns/$CAMPAIGN1_ID/resume" \
    -H "Authorization: Bearer $TOKEN")

  echo -e "${GREEN}   ✅ Campanha iniciada!${NC}"
  echo -e "${GREEN}   ⏰ Mensagem será enviada em até 1 minuto${NC}"
  echo ""
fi

# ===========================================
# 3. TESTE 2: Campanha com Mídia
# ===========================================
echo -e "${BLUE}3. Criando campanha com mídia...${NC}"

CAMPAIGN2=$(curl -s -X POST "$BASE_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste com Imagem - '"$(date +%H:%M:%S)"'",
    "description": "Campanha de teste com imagem",
    "campaign_type": "midia",
    "cadence_type": "imediato",
    "whatsapp_instance": "teste claude",
    "send_time_start": "00:00:00",
    "send_time_end": "23:59:59",
    "send_on_weekends": true,
    "targetType": "upload",
    "message": "Olá {nome}! Confira esta imagem de teste 📸",
    "mediaUrl": "https://picsum.photos/800/600",
    "mediaType": "image",
    "uploadedContacts": [
      {
        "phone": "5511999999999",
        "name": "Teste Usuario"
      }
    ]
  }')

CAMPAIGN2_ID=$(echo $CAMPAIGN2 | jq -r '.data.id')

if [ "$CAMPAIGN2_ID" = "null" ] || [ -z "$CAMPAIGN2_ID" ]; then
  echo -e "${RED}❌ Erro ao criar campanha com mídia${NC}"
else
  echo -e "${GREEN}✅ Campanha com mídia criada: $CAMPAIGN2_ID${NC}"
  echo ""
fi

# ===========================================
# 4. TESTE 3: Listar Campanhas
# ===========================================
echo -e "${BLUE}4. Listando campanhas...${NC}"

CAMPAIGNS=$(curl -s -X GET "$BASE_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN")

CAMPAIGNS_COUNT=$(echo $CAMPAIGNS | jq '.data | length')
echo -e "${GREEN}✅ Total de campanhas: $CAMPAIGNS_COUNT${NC}"
echo ""

# Mostrar últimas 5 campanhas
echo -e "${BLUE}   Últimas 5 campanhas:${NC}"
echo $CAMPAIGNS | jq -r '.data[0:5][] | "   - \(.name) [\(.status)]"'
echo ""

# ===========================================
# 5. TESTE 4: Ver Estatísticas
# ===========================================
if [ "$CAMPAIGN1_ID" != "null" ] && [ -n "$CAMPAIGN1_ID" ]; then
  echo -e "${BLUE}5. Aguardando 65 segundos para verificar estatísticas...${NC}"

  for i in {65..1}; do
    echo -ne "   ⏰ $i segundos restantes...\r"
    sleep 1
  done
  echo ""

  echo -e "${BLUE}   Buscando estatísticas da campanha...${NC}"
  STATS=$(curl -s -X GET "$BASE_URL/campaigns/$CAMPAIGN1_ID" \
    -H "Authorization: Bearer $TOKEN")

  echo $STATS | jq '{
    nome: .data.name,
    status: .data.status,
    total_contacts: .data.total_contacts,
    stats: .data.stats
  }'
  echo ""
fi

# ===========================================
# 6. Ver Jobs Agendados no Banco
# ===========================================
echo -e "${BLUE}6. Verificando jobs agendados (últimos 10)...${NC}"
echo ""

# Este comando requer acesso ao PostgreSQL
# Descomente se quiser ver os jobs do banco:

# docker exec -i $(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1) \
#   psql -U postgres -d postgres -c \
#   "SELECT id, job_type, status, scheduled_at, executed_at, error_message
#    FROM scheduled_jobs
#    ORDER BY created_at DESC
#    LIMIT 10;"

echo ""

# ===========================================
# RESUMO
# ===========================================
echo ""
echo "============================================"
echo -e "${GREEN}  ✅ TESTES CONCLUÍDOS${NC}"
echo "============================================"
echo ""
echo "Campanhas criadas:"
[ -n "$CAMPAIGN1_ID" ] && echo "  - Teste Simples: $CAMPAIGN1_ID"
[ -n "$CAMPAIGN2_ID" ] && echo "  - Teste com Mídia: $CAMPAIGN2_ID"
echo ""
echo "Para ver os resultados:"
echo "  1. Verifique seu WhatsApp"
echo "  2. Acesse: $BASE_URL/campaigns"
echo "  3. Ou veja logs: pm2 logs whatsapp-dispatcher-api"
echo ""
echo "Para ver jobs do scheduler:"
echo "  pm2 logs whatsapp-dispatcher-api | grep 'Scheduler'"
echo ""
