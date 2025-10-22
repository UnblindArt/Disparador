# 🔍 Como Obter a Database URL do Supabase

## 📋 Passo a Passo Visual

### 1️⃣ Acesse o Dashboard
```
https://supabase.com/dashboard/project/dkcslaxnlecnpmatpbyr
```

### 2️⃣ No menu lateral esquerdo, clique em:
```
⚙️ Settings (ícone de engrenagem)
```

### 3️⃣ No submenu que aparece, clique em:
```
🗄️ Database
```

### 4️⃣ Role a página até encontrar a seção:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Connection string
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5️⃣ Você verá várias abas, selecione:
```
[URI] [Postgres] [Prisma] [JDBC] [Golang] [.NET]
  ↑
Clique aqui
```

### 6️⃣ Procure por uma linha que comece com:
```
postgresql://postgres.dkcslaxnlecnpmatpbyr:[YOUR-PASSWORD]@...
```

### 7️⃣ Copie a string COMPLETA que aparece no campo

---

## 🎯 Formato Esperado

A URL deve seguir este formato:

```
postgresql://postgres.dkcslaxnlecnpmatpbyr:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**OU** pode ser assim (conexão direta):

```
postgresql://postgres:[PASSWORD]@db.dkcslaxnlecnpmatpbyr.supabase.co:5432/postgres
```

---

## 🔑 Sobre a Senha

A senha (`[PASSWORD]`) é a que você definiu quando **criou o projeto**.

### ⚠️ Esqueceu a senha?

**Opção 1 - Resetar senha do database:**
1. Vá em: `Settings` → `Database`
2. Role até: `Database password`
3. Clique em: `Reset database password`
4. Defina nova senha
5. Atualize a connection string

**Opção 2 - Usar password do .env local (se tiver):**
- Se você configurou Supabase localmente antes, a senha pode estar em um `.env` antigo

---

## 📸 Exemplo Visual

```
Settings → Database → Connection string

┌─────────────────────────────────────────────────────────────────┐
│  Connection string                                              │
│                                                                 │
│  [URI] [Postgres] [Prisma] [JDBC] [Golang] [.NET]             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ postgresql://postgres.dkcslaxnlecnpmatpbyr:[PASSWORD]@... │ │
│  │                                                           │ │
│  │ [Copy]                                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ⚠️ Use pooler for serverless/edge functions                   │
│  Transaction mode is recommended                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Depois de Copiar

### Me envie a string completa (exemplo):

```
postgresql://postgres.dkcslaxnlecnpmatpbyr:minha_senha_123@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### OU apenas a senha se preferir:

```
minha_senha_123
```

E eu atualizo o .env.production para você.

---

## 🚨 Alternativa Rápida

Se não encontrar facilmente, me forneça:

1. **A senha do database** (que você usou ao criar o projeto)

E eu monto a connection string completa para você!

A estrutura será:
```
postgresql://postgres.dkcslaxnlecnpmatpbyr:[SUA-SENHA]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

---

## 🔐 Segurança

⚠️ **IMPORTANTE:**
- Esta senha é **diferente** da senha da sua conta Supabase
- É a senha do **banco de dados PostgreSQL**
- Foi definida quando você criou o projeto
- Nunca compartilhe publicamente

---

**Após obter, me envie e prosseguiremos para criar as tabelas! 🚀**
