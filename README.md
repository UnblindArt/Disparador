# 📱 WhatsApp Dispatcher v2.0 - Unblind

Sistema profissional de disparador de mensagens WhatsApp com preparação para evolução para IA.

---

## 📊 Status Atual

**Versão:** 2.0.0-alpha
**Ambiente:** Production Ready (Fase 0 completa)
**Porta:** 3000
**Progresso:** 90% - Aguardando credenciais Supabase

---

## 🎯 Características

- ✅ **Segurança**: JWT, Rate Limiting, Helmet.js
- ✅ **LGPD Compliance**: Opt-out, Data retention, Audit logs
- ✅ **Escalabilidade**: BullMQ, Redis, PM2 Cluster
- ✅ **Resiliência**: Circuit breaker, Retry logic, Graceful shutdown
- ✅ **Observabilidade**: Logs estruturados, Metrics, Health checks
- 🔄 **IA Ready**: Estrutura preparada para módulos de IA

---

## 🏗️ Arquitetura

### Stack Tecnológica

**Backend:**
- Node.js v20.18.1
- Express.js
- BullMQ (Queue)
- Redis 7
- PM2 (Process Manager)

**Frontend:**
- React + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Query

**Database:**
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Real-time subscriptions

**Integrações:**
- Evolution API v2.2.3 (WhatsApp)
- Redis (Cache/Queue)

---

## 📦 Containers Docker Ativos

| Container | Porta | Status | Finalidade |
|-----------|-------|--------|------------|
| redis-whatsapp | 6379 | ✅ Running | Cache & Queue |
| postgres-evolution | 5433 | ✅ Running | Evolution DB |
| evolution-api-whatsapp | 8080 | ✅ Running | WhatsApp API |

---

## 🚀 Quick Start

### Pré-requisitos Instalados

- ✅ Node.js v20.18.1
- ✅ NPM v9.2.0
- ✅ PM2 v6.0.13
- ✅ Docker containers rodando
- ✅ Git v2.48.1

### 1. Configurar Credenciais Supabase

⚠️ **AÇÃO NECESSÁRIA:** Antes de prosseguir, configure o Supabase.

**Opção A - Via Dashboard:**
```bash
# 1. Acesse: https://supabase.com/dashboard
# 2. Login: apps@unblind.art / TZFV@supa_
# 3. Obtenha as credenciais (veja docs/SUPABASE_SETUP.md)
# 4. Atualize .env.production
nano /opt/whatsapp-dispatcher-client/.env.production
```

**Opção B - Forneça o Project ID:**
Se já tem projeto Supabase ativo, forneça apenas o Project ID.

### 2. Executar Migrations SQL

```bash
cd /opt/whatsapp-dispatcher-client
# Após configurar Supabase
npm run db:migrate
```

### 3. Instalar Dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Iniciar Aplicação

```bash
# Com PM2 (produção)
pm2 start ecosystem.config.js

# Desenvolvimento
npm run dev
```

---

## 📁 Estrutura do Projeto

```
/opt/whatsapp-dispatcher-client/
├── backend/               # API Node.js
│   ├── src/
│   │   ├── config/       # Configurações
│   │   ├── controllers/  # Lógica de controle
│   │   ├── middlewares/  # Auth, validation, etc
│   │   ├── models/       # Modelos de dados
│   │   ├── routes/       # Rotas da API
│   │   ├── services/     # Lógica de negócio
│   │   ├── utils/        # Helpers
│   │   ├── validators/   # Joi/Zod schemas
│   │   └── workers/      # Queue workers
│   └── tests/            # Testes automatizados
├── frontend/             # React App
│   └── src/
│       ├── components/   # Componentes UI
│       ├── contexts/     # Context API
│       ├── hooks/        # Custom hooks
│       ├── pages/        # Páginas
│       └── services/     # API clients
├── ai-modules/           # Preparado para IA
├── database/
│   ├── migrations/       # SQL migrations
│   └── seeds/            # Dados iniciais
├── logs/                 # Logs estruturados
├── backups/              # Backups automáticos
├── docs/                 # Documentação
└── scripts/              # Scripts de manutenção
```

---

## 🔐 Segurança

### Credenciais Admin

**Email:** apps@unblind.art
**Senha:** `m+0aGjQ6UX7d0wovuTvNphc3vQNbHHDM`
**Telefone:** +55 47 99952-4758

⚠️ **IMPORTANTE:** Altere a senha após primeiro login!

### Chaves Geradas

Todas as chaves de segurança estão em `.env.production`:
- ✅ JWT_SECRET (128 chars)
- ✅ ENCRYPTION_KEY (64 chars)
- ✅ SESSION_SECRET (64 chars)
- ✅ EVOLUTION_API_KEY

---

## 📋 Limites WhatsApp

```javascript
const WHATSAPP_LIMITS = {
  messagesPerSecond: 1,        // 1 msg/seg
  messagesPerMinute: 30,       // 30 msgs/min
  dailyLimit: 1000,           // 1k msgs/dia (tier inicial)
  sessionTimeout: 300000,      // 5 min timeout
  retryAfter429: 60000,       // 1 min se rate limited
  maxMessageLength: 4096      // caracteres
};
```

---

## 🛡️ LGPD Compliance

- ✅ **Consentimento:** Registro obrigatório com timestamp
- ✅ **Opt-out:** Descadastro imediato
- ✅ **Retenção:** Logs anonimizados após 90 dias
- ✅ **Portabilidade:** Export em 48h
- ✅ **Esquecimento:** Exclusão em 72h

---

## 🔧 Scripts Disponíveis

### Backup
```bash
# Backup completo
/opt/whatsapp-dispatcher-client/scripts/backup.sh

# Verificar backups
ls -lh /opt/whatsapp-dispatcher-client/backups/
```

### Monitoramento
```bash
# Status containers
docker ps

# Logs Evolution API
docker logs evolution-api-whatsapp --tail 50 -f

# Logs Redis
docker logs redis-whatsapp --tail 50

# PM2 status
pm2 list
pm2 monit
```

### Health Check
```bash
# Testar serviços
curl http://localhost:8080          # Evolution API
curl http://localhost:3000/health   # Backend (após iniciar)

# Testar Redis
docker exec redis-whatsapp redis-cli PING

# Testar PostgreSQL
docker exec postgres-evolution pg_isready
```

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| `SETUP_STATUS.md` | Status completo da instalação |
| `docs/SUPABASE_SETUP.md` | Como configurar Supabase |
| `.env.example` | Template de variáveis de ambiente |
| `docs/API.md` | Documentação da API (em breve) |
| `docs/RUNBOOK.md` | Guia operacional (em breve) |
| `docs/TROUBLESHOOTING.md` | Resolução de problemas (em breve) |

---

## 🚨 Troubleshooting

### Redis não responde
```bash
docker restart redis-whatsapp
docker logs redis-whatsapp
```

### Evolution API offline
```bash
docker restart evolution-api-whatsapp
docker logs evolution-api-whatsapp --tail 100
```

### PostgreSQL não conecta
```bash
docker exec postgres-evolution pg_isready
docker restart postgres-evolution
```

### Limpar cache Redis
```bash
docker exec redis-whatsapp redis-cli FLUSHDB
```

---

## 🎯 Próximos Passos

1. ⏳ **Configurar Supabase** (credenciais pendentes)
2. 🔄 **Executar migrations SQL** (criar tabelas)
3. 🔄 **Implementar Backend** (Fase 1-8)
4. 🔄 **Implementar Frontend** (Fase 9-13)
5. 🔄 **Testes automatizados** (Fase 15)
6. 🔄 **Deploy e CI/CD** (Fase 16)

**Progresso:** `[████████████████████░░] 90%`

---

## 📞 Suporte

**Admin/Dev:**
📧 apps@unblind.art
📱 +55 47 99952-4758

**Issues:** GitHub (a definir)
**Docs:** https://doc.evolution-api.com (Evolution API)

---

## 📄 Licença

Proprietário - Unblind
© 2025 - Todos os direitos reservados

---

## 🔄 Changelog

### v2.0.0-alpha (2025-10-22)

**Adicionado:**
- ✅ Estrutura completa do projeto
- ✅ Docker containers (Redis, PostgreSQL, Evolution API)
- ✅ Chaves de segurança geradas
- ✅ Scripts de backup
- ✅ Documentação inicial

**Aguardando:**
- ⏳ Credenciais Supabase
- 🔄 Implementação backend
- 🔄 Implementação frontend

---

**Última atualização:** 2025-10-22 11:25
**Revisão:** v1.0
