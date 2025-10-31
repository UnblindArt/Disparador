#!/bin/bash

# Script para executar migrações via Docker PostgreSQL client
MIGRATION_FILE=$1

if [ -z "$MIGRATION_FILE" ]; then
  echo "Uso: ./run-migration.sh <arquivo.sql>"
  exit 1
fi

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Erro: Arquivo $MIGRATION_FILE não encontrado"
  exit 1
fi

echo "🚀 Executando migração: $MIGRATION_FILE"

docker run --rm \
  -v "$(pwd)/migrations:/migrations:ro" \
  postgres:15-alpine \
  psql \
  "postgresql://postgres.paqouvslrflvtwzvukdo:a0cfab7bb86c403511b9bfc26a08e5fa@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" \
  -f "/migrations/$(basename $MIGRATION_FILE)"

echo "✅ Migração concluída!"
