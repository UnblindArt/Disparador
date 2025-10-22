#!/bin/bash

# Script para push do projeto WhatsApp Dispatcher para GitHub
# Dr. Denis Tuma - Cirurgia Plástica

echo "🚀 Push para GitHub - WhatsApp Dispatcher"
echo "=========================================="
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: Execute este script do diretório raiz do projeto"
    exit 1
fi

# Verificar se git está configurado
if ! git config user.name > /dev/null 2>&1; then
    echo "⚙️  Configurando Git..."
    git config user.name "Dr. Denis Tuma System"
    git config user.email "apps@unblind.art"
    echo "✅ Git configurado"
fi

# Verificar status
echo "📊 Status atual do Git:"
git status --short
echo ""

# Verificar se há mudanças não commitadas
if [[ -n $(git status -s) ]]; then
    echo "⚠️  Há arquivos não commitados. Deseja commitar? (s/n)"
    read -r resposta
    if [[ "$resposta" == "s" || "$resposta" == "S" ]]; then
        git add .
        echo "Digite a mensagem do commit:"
        read -r mensagem
        git commit -m "$mensagem"
        echo "✅ Commit realizado"
    fi
fi

# Verificar se remote está configurado
if ! git remote get-url origin > /dev/null 2>&1; then
    echo ""
    echo "📝 Remote 'origin' não configurado."
    echo ""
    echo "Por favor, siga estes passos:"
    echo ""
    echo "1. Crie um repositório no GitHub:"
    echo "   https://github.com/new"
    echo ""
    echo "2. Nome sugerido: whatsapp-dispatcher-dr-denis-tuma"
    echo "3. Visibilidade: Private (recomendado)"
    echo "4. NÃO inicialize com README, .gitignore ou license"
    echo ""
    echo "5. Após criar, execute:"
    echo "   git remote add origin https://github.com/SEU_USUARIO/whatsapp-dispatcher-dr-denis-tuma.git"
    echo ""
    echo "6. Execute este script novamente"
    exit 0
else
    echo "✅ Remote configurado:"
    git remote -v | head -n 2
fi

echo ""
echo "🔄 Preparando push..."
echo ""

# Verificar branch
BRANCH=$(git branch --show-current)
echo "📌 Branch atual: $BRANCH"

# Confirmar push
echo ""
echo "⚠️  Você está prestes a fazer push de todos os commits para o GitHub."
echo "Deseja continuar? (s/n)"
read -r confirma

if [[ "$confirma" != "s" && "$confirma" != "S" ]]; then
    echo "❌ Push cancelado"
    exit 0
fi

# Fazer push
echo ""
echo "🚀 Fazendo push..."
if git push -u origin "$BRANCH"; then
    echo ""
    echo "✅ Push realizado com sucesso!"
    echo ""
    echo "📊 Estatísticas:"
    echo "   Total de commits: $(git rev-list --count HEAD)"
    echo "   Último commit: $(git log -1 --pretty=format:'%h - %s')"
    echo ""
    echo "🌐 Acesse seu repositório no GitHub:"
    REMOTE_URL=$(git remote get-url origin)
    # Converter SSH para HTTPS para exibição
    HTTPS_URL=${REMOTE_URL/git@github.com:/https://github.com/}
    HTTPS_URL=${HTTPS_URL/.git/}
    echo "   $HTTPS_URL"
    echo ""
    echo "🎉 Projeto disponível no GitHub!"
else
    echo ""
    echo "❌ Erro no push. Possíveis causas:"
    echo ""
    echo "1. Autenticação falhou:"
    echo "   - Se usando HTTPS: use Personal Access Token (PAT)"
    echo "   - Se usando SSH: configure chave SSH"
    echo ""
    echo "2. Repositório não existe:"
    echo "   - Verifique se criou o repositório no GitHub"
    echo "   - Verifique a URL do remote: git remote -v"
    echo ""
    echo "3. Branch protegida:"
    echo "   - Verifique configurações de proteção no GitHub"
    echo ""
    echo "📖 Consulte DEPLOY_GITHUB.md para mais detalhes"
    exit 1
fi
