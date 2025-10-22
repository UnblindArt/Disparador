# 🗄️ Configuração do Supabase

## Como obter as credenciais do Supabase

### Opção 1: Via Dashboard (Recomendado)

1. **Acesse:** https://supabase.com/dashboard
2. **Login:** apps@unblind.art / TZFV@supa_

3. **Criar ou selecionar projeto:**
   - Se já tem projeto: Selecione-o
   - Se novo projeto:
     - Clique em "New Project"
     - Nome: `whatsapp-dispatcher`
     - Database Password: `[gere uma senha forte]`
     - Region: South America (São Paulo) ou mais próximo
     - Clique em "Create new project" (aguarde ~2 min)

4. **Obter credenciais:**

   **A) Project URL:**
   - Vá em: `Settings` → `API`
   - Copie: `Project URL`
   - Exemplo: `https://xxxxxxxxxxx.supabase.co`

   **B) Anon Key (Public):**
   - Na mesma página `Settings` → `API`
   - Copie: `anon` `public` key
   - Exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

   **C) Service Role Key (Secret):**
   - Na mesma página `Settings` → `API`
   - Copie: `service_role` `secret` key
   - ⚠️ **NUNCA exponha esta chave!**

   **D) Database URL:**
   - Vá em: `Settings` → `Database`
   - Procure: `Connection string` → `URI`
   - Copie a URI completa
   - Exemplo: `postgresql://postgres:[password]@db.xxxxxxxxxxx.supabase.co:5432/postgres`

### Opção 2: Via CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Listar projetos
supabase projects list

# Selecionar projeto e ver detalhes
supabase link --project-ref [project-id]
supabase status
```

---

## Atualizar .env.production

Após obter as credenciais, execute:

```bash
cd /opt/whatsapp-dispatcher-client

# Editar .env.production
nano .env.production
```

Atualize as linhas:

```bash
SUPABASE_URL=https://[seu-project-id].supabase.co
SUPABASE_ANON_KEY=[sua-anon-key]
SUPABASE_SERVICE_KEY=[sua-service-role-key]
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
```

**Salve:** `Ctrl+O` → `Enter` → `Ctrl+X`

---

## Testar conexão

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
console.log('Supabase conectado!');
"
```

---

## Próximos passos

Após configurar credenciais:

1. ✅ Executar migrations SQL
2. ✅ Criar usuário admin
3. ✅ Testar CRUD de contatos
4. ✅ Configurar RLS (Row Level Security)

---

## 🆘 Problemas comuns

**Erro: "Invalid API key"**
- Verifique se copiou a chave completa
- Confirme que não há espaços extras

**Erro: "Project not found"**
- Verifique a URL do projeto
- Confirme que o projeto está ativo

**Erro: "Connection refused"**
- Verifique se o IP da VPS está na whitelist
- Supabase: `Settings` → `Database` → `Connection pooling` → Add IP

---

## Segurança

⚠️ **IMPORTANTE:**
- NUNCA commite `.env.production` no Git
- NUNCA exponha `SERVICE_ROLE_KEY` no frontend
- Use `ANON_KEY` apenas para operações públicas
- Configure RLS para todas as tabelas

---

**Documentação oficial:** https://supabase.com/docs
