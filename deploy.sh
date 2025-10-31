#!/bin/bash

# 🚀 Script de Deploy Rápido - WhatsApp Dispatcher
# Uso: ./deploy.sh [versão]
# Exemplo: ./deploy.sh v1.1.1

set -e

VERSION=${1:-latest}
PROJECT_DIR="/opt/whatsapp-dispatcher-client"
FRONTEND_IMAGE="whatsapp-dispatcher-frontend"
STACK_NAME="dispatcher-frontend"

echo "🚀 Iniciando deploy da versão: $VERSION"

cd $PROJECT_DIR

# 1. Checkout da versão solicitada
if [ "$VERSION" != "latest" ]; then
    echo "📦 Fazendo checkout da tag $VERSION..."
    git fetch --all --tags
    git checkout tags/$VERSION
else
    echo "📦 Usando versão latest (master)..."
    git checkout master
    git pull origin master
fi

# 2. Build do frontend
echo "🔨 Fazendo build do frontend..."
cd frontend
npm install --silent
npm run build

# 3. Build da imagem Docker
echo "🐳 Criando imagem Docker..."
docker build -t $FRONTEND_IMAGE:$VERSION -t $FRONTEND_IMAGE:latest . -q

# 4. Deploy no Swarm
echo "🚢 Fazendo deploy no Docker Swarm..."
docker service update --image $FRONTEND_IMAGE:$VERSION --force ${STACK_NAME}_dispatcher-frontend

# 5. Aguardar convergência
echo "⏳ Aguardando deploy..."
sleep 5

# 6. Verificar status
echo "✅ Status dos serviços:"
docker service ps ${STACK_NAME}_dispatcher-frontend --filter "desired-state=running" --format "{{.Name}}\t{{.CurrentState}}" | head -1

echo ""
echo "✨ Deploy concluído!"
echo "📍 URL: https://dev-disparador.unblind.cloud"
echo "🏷️  Versão deployada: $VERSION"
