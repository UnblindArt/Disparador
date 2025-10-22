#!/bin/bash
# ============================================
# WhatsApp Dispatcher - Backup Script v1.0
# ============================================

set -e

# Load environment variables
if [ -f "/opt/whatsapp-dispatcher-client/.env.production" ]; then
    set -a
    source /opt/whatsapp-dispatcher-client/.env.production
    set +a
fi

# Configuration
BACKUP_DIR="${BACKUP_PATH:-/opt/whatsapp-dispatcher-client/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="whatsapp-dispatcher-$TIMESTAMP"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}WhatsApp Dispatcher - Backup Iniciado${NC}"
echo -e "${GREEN}============================================${NC}"
echo "Timestamp: $TIMESTAMP"
echo "Destino: $BACKUP_DIR/$BACKUP_NAME"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup subdirectory
BACKUP_PATH_FULL="$BACKUP_DIR/$BACKUP_NAME"
mkdir -p "$BACKUP_PATH_FULL"

# ==================== DOCKER CONTAINERS ====================
echo -e "${YELLOW}[1/7] Backup containers Docker...${NC}"

# Redis
if docker ps | grep -q redis-whatsapp; then
    echo "  → Backup Redis..."
    docker exec redis-whatsapp redis-cli SAVE
    docker cp redis-whatsapp:/data/dump.rdb "$BACKUP_PATH_FULL/redis-dump.rdb" 2>/dev/null || echo "    ⚠ Redis backup failed"
fi

# PostgreSQL (Evolution)
if docker ps | grep -q postgres-evolution; then
    echo "  → Backup PostgreSQL Evolution..."
    docker exec postgres-evolution pg_dump -U postgres evolution > "$BACKUP_PATH_FULL/postgres-evolution.sql" 2>/dev/null || echo "    ⚠ PostgreSQL backup failed"
fi

# Evolution data
if [ -d "/opt/whatsapp-dispatcher-client/evolution-data" ]; then
    echo "  → Backup Evolution data..."
    tar -czf "$BACKUP_PATH_FULL/evolution-data.tar.gz" -C /opt/whatsapp-dispatcher-client evolution-data 2>/dev/null || echo "    ⚠ Evolution data backup failed"
fi

echo -e "${GREEN}✓ Containers backup completo${NC}"
echo ""

# ==================== APPLICATION FILES ====================
echo -e "${YELLOW}[2/7] Backup arquivos da aplicação...${NC}"

# Backend
if [ -d "/opt/whatsapp-dispatcher-client/backend" ]; then
    tar -czf "$BACKUP_PATH_FULL/backend.tar.gz" -C /opt/whatsapp-dispatcher-client backend --exclude=node_modules --exclude=dist 2>/dev/null
    echo "  ✓ Backend"
fi

# Frontend
if [ -d "/opt/whatsapp-dispatcher-client/frontend" ]; then
    tar -czf "$BACKUP_PATH_FULL/frontend.tar.gz" -C /opt/whatsapp-dispatcher-client frontend --exclude=node_modules --exclude=build --exclude=dist 2>/dev/null
    echo "  ✓ Frontend"
fi

echo -e "${GREEN}✓ Arquivos da aplicação backup completo${NC}"
echo ""

# ==================== CONFIGURATION ====================
echo -e "${YELLOW}[3/7] Backup configurações...${NC}"

# .env files (CUIDADO: contém dados sensíveis)
if [ -f "/opt/whatsapp-dispatcher-client/.env.production" ]; then
    cp /opt/whatsapp-dispatcher-client/.env.production "$BACKUP_PATH_FULL/.env.production"
    chmod 600 "$BACKUP_PATH_FULL/.env.production"
    echo "  ✓ .env.production"
fi

# PM2 ecosystem
if [ -f "/opt/whatsapp-dispatcher-client/ecosystem.config.js" ]; then
    cp /opt/whatsapp-dispatcher-client/ecosystem.config.js "$BACKUP_PATH_FULL/ecosystem.config.js"
    echo "  ✓ ecosystem.config.js"
fi

echo -e "${GREEN}✓ Configurações backup completo${NC}"
echo ""

# ==================== LOGS ====================
echo -e "${YELLOW}[4/7] Backup logs (últimos 7 dias)...${NC}"

if [ -d "/opt/whatsapp-dispatcher-client/logs" ]; then
    find /opt/whatsapp-dispatcher-client/logs -type f -mtime -7 -print0 | tar -czf "$BACKUP_PATH_FULL/logs-recent.tar.gz" --null -T - 2>/dev/null || echo "  ⚠ Nenhum log recente"
    echo "  ✓ Logs recentes"
fi

echo -e "${GREEN}✓ Logs backup completo${NC}"
echo ""

# ==================== UPLOADS ====================
echo -e "${YELLOW}[5/7] Backup uploads...${NC}"

if [ -d "/opt/whatsapp-dispatcher-client/uploads" ]; then
    tar -czf "$BACKUP_PATH_FULL/uploads.tar.gz" -C /opt/whatsapp-dispatcher-client uploads 2>/dev/null
    echo "  ✓ Uploads"
else
    echo "  ⚠ Pasta uploads não existe ainda"
fi

echo -e "${GREEN}✓ Uploads backup completo${NC}"
echo ""

# ==================== DATABASE MIGRATIONS ====================
echo -e "${YELLOW}[6/7] Backup migrations e seeds...${NC}"

if [ -d "/opt/whatsapp-dispatcher-client/database" ]; then
    tar -czf "$BACKUP_PATH_FULL/database.tar.gz" -C /opt/whatsapp-dispatcher-client database 2>/dev/null
    echo "  ✓ Database migrations"
fi

echo -e "${GREEN}✓ Database backup completo${NC}"
echo ""

# ==================== COMPRESS FINAL ====================
echo -e "${YELLOW}[7/7] Compactação final...${NC}"

cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

# Calculate size
BACKUP_SIZE=$(du -h "$BACKUP_NAME.tar.gz" | cut -f1)

echo -e "${GREEN}✓ Backup compactado: $BACKUP_SIZE${NC}"
echo ""

# ==================== CLEANUP OLD BACKUPS ====================
echo -e "${YELLOW}Limpando backups antigos (> $RETENTION_DAYS dias)...${NC}"

find "$BACKUP_DIR" -name "whatsapp-dispatcher-*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "whatsapp-dispatcher-*.tar.gz" -type f | wc -l)
echo "  ✓ Backups mantidos: $REMAINING_BACKUPS"
echo ""

# ==================== SUMMARY ====================
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}BACKUP CONCLUÍDO COM SUCESSO!${NC}"
echo -e "${GREEN}============================================${NC}"
echo "Arquivo: $BACKUP_NAME.tar.gz"
echo "Tamanho: $BACKUP_SIZE"
echo "Localização: $BACKUP_DIR"
echo ""
echo "Para restaurar:"
echo "  cd $BACKUP_DIR"
echo "  tar -xzf $BACKUP_NAME.tar.gz"
echo ""
echo -e "${YELLOW}⚠ IMPORTANTE: Backup contém dados sensíveis!${NC}"
echo -e "${YELLOW}  Mantenha em local seguro e criptografado.${NC}"
echo ""

# Log to syslog
logger -t whatsapp-dispatcher "Backup completed: $BACKUP_NAME.tar.gz ($BACKUP_SIZE)"

exit 0
