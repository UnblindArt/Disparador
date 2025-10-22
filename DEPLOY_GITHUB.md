# 🚀 Deploy para GitHub - Guia Completo

## 📋 Pré-requisitos

1. Conta no GitHub: https://github.com
2. Git configurado no servidor (✅ já está)
3. Token de acesso pessoal do GitHub (se usar autenticação por token)

---

## 🔑 Opção 1: Criar Repositório via Interface Web

### Passo 1: Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Preencha:
   - **Repository name:** `whatsapp-dispatcher-dr-denis-tuma`
   - **Description:** `Sistema profissional de gestão de pacientes e disparos de mensagens WhatsApp para clínica de cirurgia plástica`
   - **Visibility:** Private (recomendado para projeto comercial)
3. **NÃO** marque nenhuma opção de inicialização (README, .gitignore, license)
4. Clique em **"Create repository"**

### Passo 2: Configurar Remote e Push

Após criar o repositório, o GitHub mostrará instruções. Use este comando no servidor:

```bash
cd /opt/whatsapp-dispatcher-client

# Adicionar remote (substitua SEU_USUARIO pelo seu username do GitHub)
git remote add origin https://github.com/SEU_USUARIO/whatsapp-dispatcher-dr-denis-tuma.git

# Verificar remote
git remote -v

# Push de todos os commits
git push -u origin master
```

### Passo 3: Autenticação

Se solicitado usuário e senha:
- **Username:** Seu username do GitHub
- **Password:** Use um Personal Access Token (PAT), não a senha da conta

**Como criar PAT:**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Selecione scopes: `repo` (acesso completo a repositórios)
4. Copie o token e use como senha

---

## 🔑 Opção 2: Usar GitHub CLI

Se você tiver o GitHub CLI instalado:

```bash
cd /opt/whatsapp-dispatcher-client

# Login no GitHub
gh auth login

# Criar repositório e fazer push
gh repo create whatsapp-dispatcher-dr-denis-tuma --private --source=. --push

# Verificar
gh repo view --web
```

---

## 🔑 Opção 3: SSH (Mais Seguro)

### Configurar SSH Key

```bash
# Gerar chave SSH (se não tiver)
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"

# Copiar chave pública
cat ~/.ssh/id_ed25519.pub
```

**Adicionar no GitHub:**
1. GitHub → Settings → SSH and GPG keys → New SSH key
2. Cole a chave pública
3. Salve

**Configurar remote com SSH:**

```bash
cd /opt/whatsapp-dispatcher-client

# Adicionar remote SSH
git remote add origin git@github.com:SEU_USUARIO/whatsapp-dispatcher-dr-denis-tuma.git

# Push
git push -u origin master
```

---

## ✅ Verificação Pós-Deploy

Após o push bem-sucedido:

```bash
# Ver histórico de commits
git log --oneline

# Ver remote configurado
git remote -v

# Ver branch atual
git branch -a
```

**Acessar repositório:**
```
https://github.com/SEU_USUARIO/whatsapp-dispatcher-dr-denis-tuma
```

---

## 📦 O que será enviado ao GitHub

### Estrutura do Repositório

```
whatsapp-dispatcher-dr-denis-tuma/
├── backend/                    # Backend Node.js completo
│   ├── src/                   # Código-fonte (39 arquivos)
│   ├── package.json
│   └── package-lock.json
├── frontend/                   # Frontend React completo
│   ├── src/                   # Código-fonte (27 arquivos)
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── database/
│   └── migrations/            # SQL migrations
├── scripts/                   # Scripts de utilidade
├── ecosystem.config.js        # PM2 config
├── .env.example              # Template de variáveis
├── .gitignore                # Arquivos ignorados
├── README_GITHUB.md          # Documentação principal
├── TESTE_FRONTEND.md         # Guia de testes
├── GUIA_RAPIDO.md           # Guia rápido
├── FINAL_STATUS.md          # Status completo
├── DEPLOY_GITHUB.md         # Este arquivo
└── exemplo_pacientes.csv    # Dados de exemplo
```

### O que NÃO será enviado (protegido pelo .gitignore)

- ❌ `node_modules/` - Dependências (serão instaladas via npm install)
- ❌ `.env` e `.env.production` - Variáveis de ambiente (SENSÍVEL)
- ❌ `postgres-data/` - Dados do PostgreSQL
- ❌ `redis-data/` - Dados do Redis
- ❌ `evolution-data/` - Dados da Evolution API
- ❌ `logs/` - Arquivos de log
- ❌ `dist/` e `build/` - Builds compilados

---

## 🔒 Segurança e Boas Práticas

### ✅ Verificações Antes do Push

```bash
# Verificar se não há .env nos commits
git log --all --full-history -- "**/.env*"

# Verificar arquivos que serão enviados
git ls-files

# Verificar .gitignore
cat .gitignore
```

### 🚨 IMPORTANTE: Proteger Credenciais

O arquivo `.env.production` está protegido pelo `.gitignore`, mas **NUNCA** commite:
- Senhas
- API Keys
- Tokens
- Credenciais de banco de dados
- Chaves JWT

Use o arquivo `.env.example` como template sem valores reais.

### 📝 Configurar Variáveis no Servidor de Produção

Após clonar o repositório em outro servidor:

```bash
# Copiar template
cp .env.example .env.production

# Editar e adicionar credenciais reais
nano .env.production
```

---

## 🔄 Atualizações Futuras

### Fazer alterações e push

```bash
# Fazer alterações no código
# ...

# Ver o que mudou
git status
git diff

# Adicionar arquivos alterados
git add .

# Commit
git commit -m "Descrição das alterações"

# Push para GitHub
git push origin master
```

### Criar branches para features

```bash
# Criar branch para nova feature
git checkout -b feature/nova-funcionalidade

# Fazer alterações e commit
git add .
git commit -m "Adiciona nova funcionalidade"

# Push da branch
git push origin feature/nova-funcionalidade

# Criar Pull Request no GitHub
# (via interface web)
```

---

## 🌐 Clonar em Outro Servidor

Para instalar o sistema em outro servidor:

```bash
# Clonar repositório
git clone https://github.com/SEU_USUARIO/whatsapp-dispatcher-dr-denis-tuma.git
cd whatsapp-dispatcher-dr-denis-tuma

# Instalar dependências backend
cd backend
npm install

# Instalar dependências frontend
cd ../frontend
npm install

# Configurar .env
cp .env.example .env.production
nano .env.production

# Executar migrations
# (conectar ao banco e executar database/migrations/*.sql)

# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save

# Iniciar frontend (dev)
cd frontend
npm run dev
```

---

## 📊 Estatísticas do Projeto

**Commits atuais:**
- ✅ Initial project setup
- ✅ Backend v2.0 production
- ✅ Frontend completo
- ✅ Add comprehensive documentation

**Total de arquivos versionados:** ~70 arquivos
**Linhas de código:** ~5.000+
**Tamanho estimado:** ~500KB (sem node_modules)

---

## 🆘 Troubleshooting

### Erro: "remote origin already exists"

```bash
# Ver remotes existentes
git remote -v

# Remover remote antigo
git remote remove origin

# Adicionar novo
git remote add origin https://github.com/SEU_USUARIO/whatsapp-dispatcher-dr-denis-tuma.git
```

### Erro: "Permission denied (publickey)"

Se usando SSH:
```bash
# Testar conexão SSH
ssh -T git@github.com

# Se falhar, verificar chave
ls -la ~/.ssh/
cat ~/.ssh/id_ed25519.pub
```

### Erro: "Authentication failed"

Se usando HTTPS:
- Use Personal Access Token (PAT) em vez da senha
- Ou configure SSH

### Push muito lento

Se o push estiver muito lento:
```bash
# Verificar tamanho do repositório
du -sh .git

# Limpar cache se necessário
git gc --aggressive
```

---

## 📞 Suporte

Para mais informações sobre Git e GitHub:
- Git: https://git-scm.com/doc
- GitHub Docs: https://docs.github.com
- GitHub CLI: https://cli.github.com

---

## ✅ Checklist Final

Antes de considerar deploy completo:

- [ ] Repositório criado no GitHub
- [ ] Remote configurado localmente
- [ ] Push realizado com sucesso
- [ ] README.md visível no GitHub
- [ ] Verificado que .env não foi commitado
- [ ] Testado clone em outro diretório
- [ ] Documentação completa disponível

---

**🎉 Pronto! Seu projeto estará no GitHub e poderá ser clonado e testado em qualquer lugar!**
