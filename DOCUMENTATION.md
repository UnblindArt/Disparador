# WhatsApp Dispatcher - Documentação Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Backend](#backend)
5. [Frontend](#frontend)
6. [Evolution API v2](#evolution-api-v2)
7. [Fluxos de Dados](#fluxos-de-dados)
8. [Padrões de Código](#padrões-de-código)
9. [Guia de Desenvolvimento](#guia-de-desenvolvimento)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

**WhatsApp Dispatcher** é uma plataforma completa para gerenciamento de mensagens WhatsApp em massa, permitindo:

- Conexão de múltiplas instâncias WhatsApp via Evolution API v2
- Gerenciamento de contatos e conversas
- Envio de campanhas de mensagens
- Chat em tempo real estilo WhatsApp Web
- Sistema de agendamento de mensagens
- Importação de contatos (CSV, Excel)

### Tecnologias Principais

**Backend:**
- Node.js + Express.js
- Supabase (PostgreSQL)
- Redis (cache e filas)
- Evolution API v2 (WhatsApp)
- PM2 (process manager)

**Frontend:**
- React + TypeScript
- Vite
- TailwindCSS
- TanStack Query (React Query)
- Zustand (state management)

---

## 🏗️ Arquitetura

```
┌─────────────────┐
│   Frontend      │
│  (React + TS)   │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐      ┌──────────────┐
│   Backend API   │◄────►│    Redis     │
│  (Express.js)   │      │ (Cache/Queue)│
└────────┬────────┘      └──────────────┘
         │
         ├──────────────┬────────────────┐
         ▼              ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Evolution   │  │  Supabase    │  │   Worker     │
│   API v2     │  │  (Postgres)  │  │   (Filas)    │
│  (WhatsApp)  │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Componentes

1. **Frontend**: Interface web responsiva
2. **Backend API**: REST API + webhook receiver
3. **Evolution API v2**: Gateway para WhatsApp
4. **Supabase**: Banco de dados + autenticação
5. **Redis**: Cache de sessões e fila de mensagens
6. **Worker**: Processamento assíncrono de campanhas

---

## 📁 Estrutura do Projeto

```
/opt/whatsapp-dispatcher-client/
├── backend/
│   ├── src/
│   │   ├── config/           # Configurações (env, database, logger)
│   │   ├── controllers/      # Controladores REST
│   │   ├── services/         # Lógica de negócio
│   │   ├── routes/           # Definição de rotas
│   │   ├── middlewares/      # Auth, error handling, etc
│   │   ├── workers/          # Processamento de filas
│   │   └── server.js         # Entry point
│   ├── .env.production       # Variáveis de ambiente
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── pages/            # Páginas (Login, Chat, Campaigns, etc)
│   │   ├── services/         # API clients
│   │   ├── store/            # Estado global (Zustand)
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Utilitários
│   └── package.json
├── DOCUMENTATION.md          # Este arquivo
└── README.md
```

---

## 🔧 Backend

### Services

#### 1. `evolutionService.js`

**Responsabilidade**: Comunicação com Evolution API v2

**Funções principais:**

```javascript
// Normalização de nomes de contatos
normalizeContactName(contact)
// Retorna: Nome formatado priorizando pushName > name > número formatado

// Criação de instância
createInstance(instanceName, options)
// POST /instance/create

// Gerar QR Code
generateQRCode(instanceName)
// GET /instance/connect/{instanceName}

// Buscar contatos (normalizado, sem duplicatas)
fetchContacts(instanceName)
// POST /chat/findContacts/{instanceName}
// Retorna: Array de contatos normalizados e ordenados por nome

// Buscar chats (normalizado, sem duplicatas, ordenado)
fetchChats(instanceName)
// POST /chat/findChats/{instanceName}
// Retorna: Array de chats com lastMessage parseado, ordenados por timestamp

// Enviar mensagem
sendTextMessage(instanceName, number, text)
// POST /message/sendText/{instanceName}
```

**Importante - Normalização de Dados:**

A função `normalizeContactName()` é crucial para resolver o problema de IDs técnicos:

```javascript
normalizeContactName(contact) {
  // 1. Prioriza pushName (nome salvo no WhatsApp)
  if (contact.pushName) return contact.pushName.trim();

  // 2. Usa name se disponível
  if (contact.name) return contact.name.trim();

  // 3. Identifica grupos
  if (jid.includes('@g.us')) return contact.subject || 'Grupo sem nome';

  // 4. Formata número de telefone (+55 44 99999-9999)
  // ...
}
```

**Correções Evolution API v2:**

- `fetchChats()` e `fetchContacts()` usam **POST** ao invés de GET
- Requerem body: `{ where: {} }`
- Campos `lastMessage` podem vir flattened (`lastmessageid`, `lastmessagetext`, etc)
- Remove duplicatas usando `Map` com `remoteJid` como chave única
- Ordena chats por `conversationTimestamp` (mais recente primeiro)

#### 2. `contactController.js`

**Endpoints:**

- `POST /api/contacts/sync-whatsapp/:instanceName` - Sincroniza contatos do WhatsApp
- `GET /api/contacts/whatsapp-chats/:instanceName` - Lista conversas

**Estrutura de resposta do `getWhatsAppChats`:**

```json
{
  "success": true,
  "data": [
    {
      "id": "5544999999999@s.whatsapp.net",
      "remoteJid": "5544999999999@s.whatsapp.net",
      "name": "João Silva",  // Nome normalizado
      "phone": "5544999999999",
      "profilePicUrl": "https://...",
      "unreadCount": 3,
      "lastMessageTime": 1729785600000,
      "lastMessage": {
        "text": "Olá, tudo bem?",
        "timestamp": 1729785600000,
        "fromMe": false
      },
      "isGroup": false
    }
  ]
}
```

#### 3. `webhookController.js`

**Endpoint**: `POST /api/webhook/evolution`

**Eventos tratados:**

- `QRCODE_UPDATED`: Armazena QR Code no Redis
- `CONNECTION_UPDATE`: Atualiza status da instância
- `MESSAGES_UPSERT`: Armazena mensagens recebidas no banco

**Importante**: O webhook é configurado automaticamente ao criar instâncias.

### Database Schema (Supabase)

**Tabelas principais:**

```sql
-- Usuários (via Supabase Auth)
users (
  id UUID PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP
)

-- Instâncias WhatsApp
whatsapp_instances (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  instance_name TEXT UNIQUE,
  status TEXT,
  qr_code TEXT,
  phone_number TEXT,
  profile_name TEXT,
  created_at TIMESTAMP
)

-- Contatos
contacts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT,
  phone TEXT,
  tags TEXT[],
  custom_fields JSONB,
  created_at TIMESTAMP,
  deleted_at TIMESTAMP
)

-- Mensagens
messages (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  contact_id UUID REFERENCES contacts(id),
  phone TEXT,
  message TEXT,
  direction TEXT, -- 'inbound' | 'outbound'
  status TEXT,    -- 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  metadata JSONB, -- whatsapp_instance, push_name, etc
  created_at TIMESTAMP
)

-- Campanhas
campaigns (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT,
  message TEXT,
  status TEXT,
  scheduled_at TIMESTAMP,
  created_at TIMESTAMP
)
```

### Environment Variables

```bash
# .env.production
PORT=3001
NODE_ENV=production

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Evolution API
EVOLUTION_API_URL=https://evo.unblind.cloud
EVOLUTION_API_KEY=2b7da512cc3a808cc08d7217ee5cd661

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key

# Webhook
WEBHOOK_URL=https://dev-disparador.unblind.cloud/api/webhook/evolution
```

---

## 💻 Frontend

### Páginas

#### 1. `Chat.tsx` (/chat)

**Funcionalidades:**
- Lista de conversas do WhatsApp
- Chat em tempo real
- Envio de mensagens
- Auto-refresh configurável
- Badges de mensagens não lidas
- Preview da última mensagem

**Estrutura:**

```tsx
<Chat>
  ├── Header (seletor de instância + controles)
  ├── Sidebar (lista de conversas)
  │   └── ChatItem (avatar, nome, preview, unread badge)
  └── ChatArea
      ├── ChatHeader (contato selecionado)
      ├── Messages (histórico)
      └── MessageInput (enviar mensagem)
</Chat>
```

**Query Keys:**
- `['whatsapp-instances']` - Lista de instâncias
- `['whatsapp-chats', instanceName]` - Conversas
- `['chat-messages', instanceName, phone]` - Mensagens

**Correções implementadas:**

1. **Nomes corretos**: Usa `chat.name` normalizado ao invés de `chat.id`
2. **Preview de mensagem**: Exibe `chat.lastMessage.text` com indicador "Você:" se `fromMe`
3. **Badge de não lidas**: Exibe `chat.unreadCount` com visual melhorado
4. **Timestamp**: Formata `lastMessageTime` (hoje = HH:MM, ontem = "Ontem", outros = DD/MM)

#### 2. `Contacts.tsx` (/contacts)

**Funcionalidades:**
- Listagem de contatos
- Importação (CSV, Excel)
- Sincronização com WhatsApp
- Edição/exclusão

#### 3. `WhatsAppConnect.tsx` (/whatsapp)

**Funcionalidades:**
- Criar nova instância
- Exibir QR Code
- Gerenciar instâncias conectadas

### API Client (`services/api.ts`)

**Interface WhatsAppChat:**

```typescript
export interface WhatsAppChat {
  id: string
  remoteJid: string
  name: string              // Nome normalizado
  phone: string
  profilePicUrl?: string
  unreadCount: number
  lastMessageTime?: number
  lastMessage?: {
    text: string
    timestamp: number
    fromMe: boolean
  } | null
  isGroup: boolean
}
```

---

## 🔌 Evolution API v2

### Referência Oficial

- Docs: https://doc.evolution-api.com/v2
- Chat Controller: https://doc.evolution-api.com/v2/api-reference/chat-controller

### Diferenças v1 → v2

| Endpoint | v1 | v2 |
|----------|----|----|
| `findChats` | GET | **POST** com body `{where: {}}` |
| `findContacts` | GET | **POST** com body `{where: {}}` |
| `findMessages` | GET com query | **POST** com `{where: {key: {remoteJid}}}` |

### Estrutura de Chat (raw)

```json
{
  "id": "5544999999999@s.whatsapp.net",
  "remoteJid": "5544999999999@s.whatsapp.net",
  "pushName": "João Silva",
  "profilePicUrl": "https://...",
  "unreadCount": 3,
  "conversationTimestamp": 1729785600000,

  // lastMessage pode vir como objeto OU flattened
  "lastMessage": {
    "key": {
      "id": "msg123",
      "fromMe": false
    },
    "message": {
      "conversation": "Olá, tudo bem?"
    },
    "messageTimestamp": 1729785600000,
    "pushName": "João Silva"
  },

  // OU campos flattened:
  "lastmessageid": "msg123",
  "lastmessagetext": "Olá, tudo bem?",
  "lastmessagetimestamp": 1729785600000,
  "lastmessagefromme": false,
  "lastmessagepushname": "João Silva"
}
```

**Observação**: Nosso `evolutionService.js` trata ambos os casos!

---

## 🔄 Fluxos de Dados

### 1. Conectar WhatsApp

```
User → Frontend → Backend → Evolution API
                              ↓
                         QR Code gerado
                              ↓
                         Webhook notifica
                              ↓
                      Backend atualiza status
```

### 2. Carregar Conversas

```
Frontend → GET /api/contacts/whatsapp-chats/:instance
              ↓
         Backend → evolutionService.fetchChats()
                        ↓
                   POST /chat/findChats/:instance
                        ↓
                   Normalização:
                   - Remove duplicatas (Map por remoteJid)
                   - Normaliza nomes (pushName > name > telefone)
                   - Parseia lastMessage (objeto ou flattened)
                   - Ordena por timestamp
                        ↓
                   Frontend exibe lista ordenada
```

### 3. Enviar Mensagem

```
Frontend → POST /api/chat/:instance/:phone
              ↓
         Backend → evolutionService.sendTextMessage()
              ↓
         Evolution API envia
              ↓
         Webhook notifica sucesso
              ↓
         Backend armazena no banco
              ↓
         Frontend atualiza UI (React Query)
```

---

## 📐 Padrões de Código

### Backend

**1. Sempre use `asyncHandler` nos controllers:**

```javascript
export const getContacts = asyncHandler(async (req, res) => {
  const contacts = await contactService.getContacts(req.user.id);
  res.json({ success: true, data: contacts });
});
```

**2. Services retornam objetos estruturados:**

```javascript
return {
  success: true,
  data: normalizedData,
  error: null
};
```

**3. Logs estruturados:**

```javascript
logger.info('✅ Operação concluída', {
  userId,
  count: items.length
});
```

### Frontend

**1. Use React Query para chamadas API:**

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['key', param],
  queryFn: async () => {
    const res = await api.get('/endpoint');
    return res.data.data;
  },
  refetchInterval: 10000 // opcional
});
```

**2. Mutations para alterações:**

```typescript
const mutation = useMutation({
  mutationFn: async (data) => api.post('/endpoint', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['key'] });
    toast.success('Sucesso!');
  }
});
```

**3. TypeScript sempre:**

```typescript
interface Props {
  chat: WhatsAppChat;
  onSelect: (chat: WhatsAppChat) => void;
}

export function ChatItem({ chat, onSelect }: Props) {
  // ...
}
```

---

## 🛠️ Guia de Desenvolvimento

### Adicionar novo endpoint

**1. Backend:**

```javascript
// routes/myRoute.js
router.get('/my-endpoint', auth, myController.myFunction);

// controllers/myController.js
export const myFunction = asyncHandler(async (req, res) => {
  const result = await myService.doSomething(req.user.id);
  res.json({ success: true, data: result });
});

// services/myService.js
export async function doSomething(userId) {
  const { data, error } = await supabaseAdmin
    .from('table')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}
```

**2. Frontend:**

```typescript
// services/api.ts
export const myAPI = {
  getData: () => api.get<{ success: boolean; data: MyType[] }>('/my-endpoint')
};

// pages/MyPage.tsx
const { data } = useQuery({
  queryKey: ['my-data'],
  queryFn: async () => {
    const res = await myAPI.getData();
    return res.data.data;
  }
});
```

### Trabalhar com Evolution API

**SEMPRE consulte esta documentação antes de fazer chamadas à Evolution API!**

**Regras:**
1. Use `evolutionService.js` - nunca chame a API diretamente
2. Para listagens use POST com `{where: {}}`
3. Sempre normalize dados com `normalizeContactName()`
4. Remove duplicatas usando `Map`
5. Ordene resultados antes de retornar

**Exemplo:**

```javascript
async fetchMyData(instanceName) {
  const response = await this.client.post(
    `/chat/findSomething/${encodeURIComponent(instanceName)}`,
    { where: {} }  // Evolution v2 requer POST
  );

  // Normalizar
  const map = new Map();
  for (const item of response.data) {
    const normalized = {
      id: item.id,
      name: this.normalizeContactName(item),
      // ...
    };
    map.set(item.id, normalized);
  }

  // Ordenar
  return Array.from(map.values())
    .sort((a, b) => a.name.localeCompare(b.name));
}
```

### Debugging

**Backend logs:**

```bash
pm2 logs whatsapp-dispatcher-api --lines 100
pm2 logs whatsapp-dispatcher-api --lines 100 --nostream  # Sem follow
```

**Frontend dev:**

```bash
cd frontend
npm run dev  # http://localhost:5173
```

**Verificar Evolution API:**

```bash
curl -X POST https://evo.unblind.cloud/chat/findChats/instance-name \
  -H "apikey: 2b7da512cc3a808cc08d7217ee5cd661" \
  -H "Content-Type: application/json" \
  -d '{"where":{}}'
```

---

## 🐛 Troubleshooting

### Problema: Nomes técnicos (cmh4vd0kq...)

**Causa**: Evolution API retorna IDs ao invés de nomes

**Solução**: ✅ Implementada
- Função `normalizeContactName()` em `evolutionService.js`
- Prioriza `pushName` > `name` > número formatado

### Problema: Conversas duplicadas

**Causa**: API pode retornar mesma conversa múltiplas vezes

**Solução**: ✅ Implementada
- Uso de `Map` com `remoteJid` como chave única
- Remove duplicatas automaticamente em `fetchChats()`

### Problema: lastMessage não aparece

**Causa**: Campos podem vir flattened ou como objeto

**Solução**: ✅ Implementada
- Trata ambos os casos em `fetchChats()`:
  ```javascript
  if (rawChat.lastMessage) {
    // Objeto completo
  } else if (rawChat.lastmessageid) {
    // Campos flattened
  }
  ```

### Problema: Chats desordenados

**Causa**: API não ordena por padrão

**Solução**: ✅ Implementada
- Ordena por `conversationTimestamp` descendente
- Conversas mais recentes primeiro

### Problema: 401 Unauthorized na Evolution API

**Causa**: API Key incorreta

**Solução**:
1. Verificar `.env.production`:
   ```bash
   EVOLUTION_API_KEY=2b7da512cc3a808cc08d7217ee5cd661
   ```
2. Reiniciar backend:
   ```bash
   pm2 restart whatsapp-dispatcher-api --update-env
   ```

### Problema: Webhook não funciona

**Causa**: URL não configurada ou instância criada antes do sistema

**Solução**:
```bash
# Reconfigurar webhook manualmente
curl -X POST https://dev-disparador.unblind.cloud/api/whatsapp/instances/INSTANCE_NAME/configure-webhook \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎓 Convenções de Commit

```
feat: Nova funcionalidade
fix: Correção de bug
docs: Documentação
refactor: Refatoração de código
style: Formatação
test: Testes
chore: Tarefas de manutenção
```

**Exemplo:**
```
fix: Corrigir nomes de contatos na lista de chats

- Implementar normalizeContactName() em evolutionService
- Parsear lastMessage corretamente (flattened + objeto)
- Remover duplicatas usando Map por remoteJid
- Ordenar por conversationTimestamp
```

---

## 📚 Recursos Externos

- [Evolution API v2 Docs](https://doc.evolution-api.com/v2)
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

---

**Última atualização:** 2025-10-24
**Versão da documentação:** 1.0.0
