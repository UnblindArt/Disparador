# 🚀 Guia Rápido de Deploy - WhatsApp Dispatcher

## 📦 Versões Disponíveis

### ✅ Produção Atual
- **Versão**: v1.1.1
- **Status**: Estável e testada
- **Branch**: master
- **Funcionalidades**:
  - Sistema de tags e produtos completo
  - Filtro por tags
  - Botão de confirmar agendamentos
  - Dashboard financeiro
  - Multi-instâncias WhatsApp

### 🚧 Em Desenvolvimento
- **Versão**: v1.2 (dev/v1.2)
- **Status**: Backend pronto, frontend pendente
- **NÃO FAZER DEPLOY EM PRODUÇÃO**
- **Funcionalidades novas**:
  - Previsão financeira automática
  - Pipeline de vendas inteligente
  - Data de fechamento em produtos
  - Lógica: Lead + Produto + Agendamento = Forecast

---

## 🎯 Deploy Rápido

### Opção 1: Deploy de Versão Específica
```bash
cd /opt/whatsapp-dispatcher-client
./deploy.sh v1.1.1
```

### Opção 2: Deploy da Última Versão Estável
```bash
cd /opt/whatsapp-dispatcher-client
./deploy.sh latest
```

### Opção 3: Rollback para Versão Anterior
```bash
cd /opt/whatsapp-dispatcher-client
./deploy.sh v1.1
```

---

## 📋 Comandos Úteis

### Ver versão atual em produção
```bash
docker service inspect dispatcher-frontend_dispatcher-frontend \
  --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}'
```

### Listar todas as versões disponíveis
```bash
cd /opt/whatsapp-dispatcher-client
git tag -l
```

### Ver status dos serviços
```bash
docker service ls | grep dispatcher
pm2 list
```

### Logs do frontend
```bash
docker service logs dispatcher-frontend_dispatcher-frontend --tail 50 --follow
```

### Logs do backend
```bash
pm2 logs whatsapp-dispatcher-api
```

### Restart backend
```bash
pm2 restart whatsapp-dispatcher-api
```

---

## 🔄 Fluxo de Trabalho

### 1. Desenvolvimento em Branch
```bash
# Criar nova branch de feature
git checkout -b dev/v1.x

# Fazer alterações...
git add .
git commit -m "feat: nova funcionalidade"
git push origin dev/v1.x
```

### 2. Testar Localmente (Opcional)
```bash
cd frontend
npm run dev  # Desenvolvimento local

npm run build  # Testar build
```

### 3. Merge para Master
```bash
git checkout master
git merge dev/v1.x

# Criar tag de versão
git tag -a v1.x -m "Descrição da versão"
git push origin master --tags
```

### 4. Deploy em Produção
```bash
./deploy.sh v1.x
```

---

## 📊 Estrutura de Versionamento

### Semantic Versioning
```
v1.2.3
│ │ └─ Patch: Bug fixes
│ └─── Minor: Novas features (compatível)
└───── Major: Breaking changes
```

### Exemplos
- `v1.1.0` → `v1.1.1`: Bug fix (botão confirmar)
- `v1.1.1` → `v1.2.0`: Nova feature (forecast financeiro)
- `v1.2.0` → `v2.0.0`: Mudança incompatível

---

## ⚠️ Checklist Antes do Deploy

### Deploy de Patch (v1.x.x)
- [ ] Código testado localmente
- [ ] Build frontend sem erros
- [ ] Backend funcionando
- [ ] Commit e tag criados

### Deploy de Minor (v1.x.0)
- [ ] Todos os itens do Patch
- [ ] Migração de banco (se houver) executada
- [ ] Endpoints testados
- [ ] Documentação atualizada
- [ ] Frontend buildado e testado

### Deploy de Major (v2.0.0)
- [ ] Todos os itens do Minor
- [ ] Backup do banco de dados
- [ ] Plano de rollback testado
- [ ] Comunicação com usuários
- [ ] Janela de manutenção agendada

---

## 🔧 Troubleshooting

### Frontend não atualiza após deploy
```bash
# Forçar rebuild da imagem
cd /opt/whatsapp-dispatcher-client/frontend
docker build -t whatsapp-dispatcher-frontend:latest . --no-cache

# Forçar atualização do serviço
docker service update --force --image whatsapp-dispatcher-frontend:latest \
  dispatcher-frontend_dispatcher-frontend
```

### Backend com erro após deploy
```bash
# Ver logs
pm2 logs whatsapp-dispatcher-api --err

# Restart
pm2 restart whatsapp-dispatcher-api

# Se necessário, reverter migração e voltar versão anterior
```

### Rollback Completo
```bash
# 1. Voltar versão do frontend
./deploy.sh v1.1.1

# 2. Se houve migração, reverter no Supabase
# (Ver MIGRATION_GUIDE para SQL de rollback)

# 3. Restart backend
pm2 restart whatsapp-dispatcher-api
```

---

## 📁 Estrutura do Projeto

```
/opt/whatsapp-dispatcher-client/
├── deploy.sh                    # Script de deploy rápido
├── VERSIONS.md                  # Documentação de versões
├── README_DEPLOY.md            # Este arquivo
├── MIGRATION_GUIDE_v1.2.md     # Guias de migração
├── backend/
│   ├── migrations/             # Migrações SQL
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── ...
│   └── run-migration.sh
└── frontend/
    ├── src/
    ├── dist/                   # Build de produção
    └── Dockerfile
```

---

## 🌐 URLs Importantes

- **Produção**: https://dev-disparador.unblind.cloud
- **GitHub**: https://github.com/UnblindArt/Disparador
- **Supabase**: https://supabase.com/dashboard/project/paqouvslrflvtwzvukdo

---

## 🆘 Suporte

### Logs Importantes
```bash
# Backend
tail -f /opt/whatsapp-dispatcher-client/backend/logs/error.log

# PM2
pm2 logs whatsapp-dispatcher-api

# Docker Swarm
docker service logs dispatcher-frontend_dispatcher-frontend --tail 100
```

### Verificar Saúde dos Serviços
```bash
# Backend health
curl https://dev-disparador.unblind.cloud/api/health

# Frontend
curl -I https://dev-disparador.unblind.cloud
```

---

## 📝 Notas

1. **Sempre** manter pelo menos 3 versões estáveis com tags
2. **Nunca** fazer deploy direto da master sem tag
3. **Sempre** testar em dev antes de produção
4. **Documentar** breaking changes no CHANGELOG.md
5. **Backup** do banco antes de migrações major

---

**Última atualização:** 2025-10-31
**Versão do guia:** 1.0
