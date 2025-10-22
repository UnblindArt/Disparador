# 📱 WhatsApp Dispatcher - Dr. Denis Tuma

Sistema profissional de gestão de pacientes e disparos de mensagens WhatsApp para clínica de cirurgia plástica.

![Status](https://img.shields.io/badge/Status-Production-success)
![Version](https://img.shields.io/badge/Version-2.0.0-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)

## 🎨 Design Elegante

Interface moderna com cores da clínica:
- **Preto** - Background principal
- **Azul Royal (#0038A8)** - Botões primários
- **Azul Petróleo (#006B7D)** - Elementos secundários
- **Branco e Cinza** - Conteúdo e detalhes

## ✨ Funcionalidades

### 👥 Gestão de Pacientes
- ✅ CRUD completo de pacientes
- ✅ Upload em massa (CSV, XLS, XLSX, XML, PDF)
- ✅ Busca em tempo real
- ✅ Tags e campos customizados
- ✅ Controle de opt-in/opt-out (LGPD)

### 📤 Campanhas e Disparos
- ✅ Envio em massa de mensagens
- ✅ Agendamento de campanhas
- ✅ Controle de status (pausar/retomar/cancelar)
- ✅ Estatísticas de entrega
- ✅ Rate limiting inteligente

### 💬 Mensagens
- ✅ Envio individual via WhatsApp
- ✅ Histórico completo
- ✅ Status de entrega em tempo real
- ✅ Suporte a mídia

### 📅 Agenda Inteligente
- ✅ Agendamentos integrados ao WhatsApp
- ✅ Confirmação automática
- ✅ Lembretes personalizados
- ✅ Reagendamento fácil

### 📊 Dashboard
- ✅ Estatísticas em tempo real
- ✅ Métricas de performance
- ✅ Status do sistema
- ✅ Atividades recentes

## 🏗️ Tecnologias

### Backend
- **Node.js** v20+ com Express.js
- **TypeScript/JavaScript**
- **PostgreSQL** (via Supabase)
- **Redis** (cache e filas)
- **BullMQ** (processamento assíncrono)
- **JWT** (autenticação)
- **PM2** (gerenciamento de processos)

### Frontend
- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (estilização)
- **React Query** (cache e estado)
- **Zustand** (state management)
- **React Router** (navegação)
- **Axios** (HTTP client)

### Integrações
- **Evolution API v2.2.3** (WhatsApp)
- **Supabase** (banco de dados)
- **Redis** (cache e filas)

## 🚀 Instalação

### Pré-requisitos

```bash
# Node.js 20+
node --version

# PM2
npm install -g pm2

# Docker (para serviços)
docker --version
```

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/whatsapp-dispatcher-dr-denis-tuma.git
cd whatsapp-dispatcher-dr-denis-tuma
```

### 2. Configure Variáveis de Ambiente

```bash
cp .env.example .env.production
nano .env.production
```

**Variáveis importantes:**
- `SUPABASE_URL` - URL do Supabase
- `SUPABASE_SERVICE_KEY` - Chave de serviço
- `EVOLUTION_API_KEY` - Chave da Evolution API
- `JWT_SECRET` - Segredo para tokens
- `REDIS_HOST` - Host do Redis

### 3. Inicie os Serviços Docker

```bash
# Redis
docker run -d --name redis-whatsapp -p 6379:6379 redis:7-alpine

# Evolution API
docker run -d --name evolution-api-whatsapp \
  -p 8080:8080 \
  -e EVOLUTION_API_KEY=sua-chave-aqui \
  atendai/evolution-api:v2.2.3
```

### 4. Execute Migrations

```bash
# Conecte ao seu PostgreSQL/Supabase e execute:
psql -h seu-host -U postgres -d postgres -f database/migrations/001_initial_schema.sql
```

### 5. Instale Dependências

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 6. Crie Usuário Admin

```bash
cd backend
node -e "
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
(async () => {
  const hash = await bcrypt.hash('sua-senha-aqui', 12);
  const { data, error } = await supabase.from('users').insert([{
    email: 'admin@email.com',
    password_hash: hash,
    name: 'Admin',
    role: 'admin',
    is_active: true
  }]).select().single();
  console.log(error || data);
  process.exit(0);
})();
"
```

### 7. Inicie a Aplicação

```bash
# Com PM2 (produção)
pm2 start ecosystem.config.js

# Ou desenvolvimento
cd backend && npm run dev &
cd frontend && npm run dev
```

## 🔧 Configuração

### PM2 Ecosystem

O arquivo `ecosystem.config.js` já está configurado com:
- 2 instâncias da API (cluster mode)
- 1 worker para processamento de filas
- Auto-restart
- Logs estruturados

### Rate Limiting

Configurado para respeitar limites do WhatsApp:
- 1 mensagem/segundo
- 30 mensagens/minuto
- 1000 mensagens/dia (tier inicial)

### LGPD Compliance

Sistema implementa:
- Consentimento obrigatório
- Opt-out imediato
- Retenção de dados (90 dias)
- Logs de auditoria
- Export e exclusão de dados

## 📖 Documentação

- `GUIA_RAPIDO.md` - Início rápido
- `TESTE_FRONTEND.md` - Guia de testes
- `FINAL_STATUS.md` - Status completo
- `PRODUCTION_STATUS.md` - Detalhes técnicos

## 🔐 Segurança

- ✅ JWT com refresh tokens
- ✅ Bcrypt para senhas (12 rounds)
- ✅ Rate limiting em todos os endpoints
- ✅ Helmet.js (headers de segurança)
- ✅ CORS configurado
- ✅ Validação de inputs (Joi)
- ✅ SQL injection protection (Supabase)
- ✅ XSS protection

## 📊 Endpoints API

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/auth/profile

GET    /api/contacts
POST   /api/contacts
POST   /api/contacts/bulk-import
GET    /api/contacts/stats

GET    /api/campaigns
POST   /api/campaigns
POST   /api/campaigns/:id/pause
POST   /api/campaigns/:id/resume

POST   /api/messages/send
GET    /api/messages
GET    /api/messages/stats

GET    /api/health
```

## 🧪 Testes

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test

# E2E (se implementado)
npm run test:e2e
```

## 📦 Build para Produção

```bash
# Frontend
cd frontend
npm run build
# Arquivos em: dist/

# Backend já está em JS
cd backend
npm start
```

## 🐛 Troubleshooting

### Backend não inicia
```bash
pm2 logs
pm2 restart all
```

### Frontend não conecta
- Verifique se backend está rodando: `curl http://localhost:3000/api/health`
- Verifique proxy no `vite.config.ts`

### Mensagens não enviam
- Verifique Evolution API: `curl http://localhost:8080`
- Veja logs: `pm2 logs whatsapp-dispatcher-worker`

## 📄 Licença

Proprietário - Uso exclusivo Dr. Denis Tuma

## 👨‍💻 Desenvolvimento

Desenvolvido com ❤️ usando Claude Code

## 🤝 Contribuindo

Este é um projeto privado. Para sugestões ou problemas, entre em contato.

## 📞 Suporte

Para suporte técnico, consulte a documentação ou entre em contato.

---

**© 2025 Dr. Denis Tuma - Todos os direitos reservados**
