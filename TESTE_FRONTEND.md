# 🧪 GUIA DE TESTE COMPLETO - Frontend Dr. Denis Tuma

## ✅ SISTEMA ESTÁ ONLINE E PRONTO!

### 🔗 URLs Ativas
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Evolution API:** http://localhost:8080

---

## 🎯 PASSO A PASSO PARA TESTAR

### 1️⃣ ACESSAR O SISTEMA

**Abra seu navegador e acesse:**
```
http://localhost:5173
```

Você verá a tela de login com:
- Logo "Dr. Denis Tuma - Cirurgia Plástica"
- Campo de Email
- Campo de Senha
- Botão "Entrar"

---

### 2️⃣ FAZER LOGIN

**Credenciais:**
```
Email: apps@unblind.art
Senha: m+0aGjQ6UX7d0wovuTvNphc3vQNbHHDM
```

**O que testar:**
- ✅ Digite o email
- ✅ Digite a senha (pode copiar/colar)
- ✅ Clique em "Entrar"
- ✅ Deve aparecer notificação "Login realizado com sucesso!"
- ✅ Deve redirecionar para o Dashboard

---

### 3️⃣ EXPLORAR O DASHBOARD

**Você verá:**
- 📊 4 Cards de estatísticas:
  - Total de Pacientes
  - Mensagens Enviadas
  - Taxa de Entrega
  - Agendamentos Hoje

- 📈 Gráfico de Atividade Recente
- 🟢 Status do Sistema (tudo verde)

**O que testar:**
- ✅ Verifique se os números aparecem
- ✅ Veja o status "Online" dos serviços
- ✅ Navegue pela sidebar à esquerda

---

### 4️⃣ TESTAR GESTÃO DE PACIENTES

**Clique em "Pacientes" na sidebar**

#### A) Adicionar Paciente Individual

1. Clique no botão **"Novo Paciente"**
2. Preencha:
   - Nome: `Maria Silva`
   - Telefone: `5547999999999`
   - Email: `maria@teste.com`
3. Clique em **"Salvar"**
4. ✅ Deve aparecer notificação de sucesso
5. ✅ Paciente aparece na lista

#### B) Testar Upload de Arquivo CSV

1. Crie um arquivo `teste.csv` com este conteúdo:
```csv
nome,telefone,email
João Santos,5547988888888,joao@teste.com
Ana Costa,5547977777777,ana@teste.com
Pedro Alves,5547966666666,pedro@teste.com
```

2. Arraste o arquivo para a área de **"Upload de Lista"**
   - Ou clique e selecione o arquivo

3. ✅ Deve aparecer notificação "Arquivo importado com sucesso!"
4. ✅ Os 3 novos pacientes aparecem na lista

#### C) Testar Busca

1. Digite no campo de busca: `Maria`
2. ✅ Deve filtrar e mostrar só a Maria Silva

#### D) Deletar Paciente

1. Clique no ícone de lixeira 🗑️ ao lado de um paciente
2. ✅ Paciente é removido da lista

---

### 5️⃣ TESTAR CAMPANHAS

**Clique em "Campanhas" na sidebar**

#### Criar Campanha

1. Clique em **"Nova Campanha"**
2. Preencha:
   - Nome: `Lembrete de Consulta`
   - Mensagem: `Olá! Lembramos que você tem consulta marcada conosco. Aguardamos você! Dr. Denis Tuma`
3. Clique em **"Criar e Enviar"**
4. ✅ Campanha aparece na lista
5. ✅ Status aparece como "active" ou "scheduled"

#### Controlar Campanha

1. ✅ Clique em **Pausar** (ícone ⏸️) - Status muda para "paused"
2. ✅ Clique em **Retomar** (ícone ▶️) - Status volta para "active"
3. ✅ Clique em **Cancelar** (ícone ✖️) - Status muda para "cancelled"

---

### 6️⃣ TESTAR MENSAGENS INDIVIDUAIS

**Clique em "Mensagens" na sidebar**

#### Enviar Mensagem

1. Preencha:
   - Telefone: `5547999999999`
   - Mensagem: `Olá! Esta é uma mensagem de teste do sistema Dr. Denis Tuma.`
2. Clique em **"Enviar"**
3. ✅ Botão mostra "Enviando..."
4. ✅ Notificação de sucesso aparece
5. ✅ Mensagem aparece no histórico abaixo

#### Verificar Histórico

1. ✅ Veja as mensagens enviadas
2. ✅ Cada mensagem mostra:
   - Telefone
   - Data/hora
   - Status (pending, sent, delivered)
   - Conteúdo da mensagem

---

### 7️⃣ TESTAR AGENDA INTELIGENTE

**Clique em "Agenda" na sidebar**

#### Visualizar Agendamentos

1. ✅ Veja os cards de estatísticas:
   - Agendados Hoje: 2
   - Confirmados: 1
   - Aguardando: 1

2. ✅ Lista de agendamentos mostra:
   - Nome do paciente
   - Telefone
   - Data e hora
   - Serviço
   - Status (badge colorido)

#### Interagir com Agendamentos

1. ✅ Botão "Confirmar via WhatsApp" (para agendados)
2. ✅ Botão "Reagendar"
3. ✅ Botão "Lembrete WhatsApp" (para confirmados)

---

### 8️⃣ TESTAR NAVEGAÇÃO

**Teste a Sidebar:**
- ✅ Clique em cada item do menu
- ✅ Verifique que a página muda
- ✅ Item ativo fica destacado em azul royal
- ✅ Hover mostra efeito visual

**Teste o Logout:**
1. Clique no ícone de logout (↪️) no rodapé da sidebar
2. ✅ Deve voltar para a tela de login
3. ✅ Tente acessar uma página protegida: http://localhost:5173/contacts
4. ✅ Deve redirecionar para login

---

### 9️⃣ TESTAR RESPONSIVIDADE

**Redimensione a janela do navegador:**
- ✅ Desktop (grande): tudo visível
- ✅ Tablet (médio): layout se ajusta
- ✅ Mobile (pequeno): cards empilham verticalmente

---

### 🔟 TESTAR INTEGRAÇÕES

#### Verificar Conexão com Backend

1. Abra o DevTools do navegador (F12)
2. Vá para a aba "Network"
3. Faça qualquer ação (ex: carregar pacientes)
4. ✅ Veja requisições para `/api/...`
5. ✅ Status 200 (sucesso)
6. ✅ Dados retornando corretamente

#### Verificar Console de Erros

1. DevTools → Console
2. ✅ Não deve haver erros em vermelho
3. ⚠️ Avisos (warnings) em amarelo são normais

---

## 🎨 VERIFICAR DESIGN

### Cores Implementadas
- ⚫ **Background:** Gradiente preto → cinza → azul petróleo
- 🔵 **Botões Principais:** Azul Royal (#0038A8)
- 🔷 **Botões Secundários:** Azul Petróleo (#006B7D)
- ⚪ **Cards:** Branco com transparência (glassmorphism)
- ⚪ **Texto:** Branco/Cinza para legibilidade

### Efeitos Visuais
- ✨ Cards com efeito de vidro (backdrop-blur)
- 💫 Transições suaves em hover
- 🌟 Sombras nos botões ativos
- 🎭 Sidebar com blur e transparência

---

## 📱 FORMATOS DE ARQUIVO SUPORTADOS

### Upload de Pacientes

**CSV (Comma Separated Values):**
```csv
nome,telefone,email
Maria Silva,5547999999999,maria@teste.com
João Santos,5547988888888,joao@teste.com
```

**XLSX (Excel):**
- Mesmo formato, salvo como Excel
- Colunas: `nome`, `telefone`, `email`

**Variações Aceitas:**
- `nome` ou `name`
- `telefone` ou `phone`
- `email`

**Telefone:**
- Com código do país: `5547999999999`
- Formatado: `(47) 99999-9999`
- Somente números: `47999999999`

---

## ✅ CHECKLIST COMPLETO

### Login e Autenticação
- [ ] Login com credenciais corretas
- [ ] Notificação de sucesso
- [ ] Redirecionamento para dashboard
- [ ] Logout funciona
- [ ] Rotas protegidas bloqueiam acesso sem login

### Dashboard
- [ ] Estatísticas carregam
- [ ] Cards mostram números
- [ ] Status do sistema verde
- [ ] Atividades recentes aparecem

### Pacientes
- [ ] Adicionar paciente individual
- [ ] Upload de CSV funciona
- [ ] Upload de XLSX funciona
- [ ] Busca filtra resultados
- [ ] Deletar paciente funciona
- [ ] Status opt-in aparece

### Campanhas
- [ ] Criar campanha
- [ ] Pausar campanha
- [ ] Retomar campanha
- [ ] Cancelar campanha
- [ ] Status atualiza visualmente

### Mensagens
- [ ] Enviar mensagem individual
- [ ] Mensagem aparece no histórico
- [ ] Status de entrega mostra
- [ ] Data/hora formatada corretamente

### Agenda
- [ ] Agendamentos aparecem
- [ ] Estatísticas corretas
- [ ] Botões de ação presentes
- [ ] Status visual correto

### Visual/UX
- [ ] Cores conforme especificado
- [ ] Efeitos de glassmorphism
- [ ] Transições suaves
- [ ] Responsivo em todos os tamanhos
- [ ] Sem erros no console
- [ ] Loading states aparecem
- [ ] Notificações toast funcionam

---

## 🐛 SE ALGO NÃO FUNCIONAR

### Frontend não carrega
```bash
cd /opt/whatsapp-dispatcher-client/frontend
npm run dev
```

### Login dá erro
```bash
# Verificar backend
pm2 list
curl http://localhost:3000/api/health

# Restart se necessário
pm2 restart all
```

### Upload não funciona
- Verifique o formato do arquivo
- Máximo 1000 contatos por vez
- Colunas obrigatórias: `nome` e `telefone`

### Mensagens não enviam
- Verifique se Evolution API está conectada
- Dashboard → Status do Sistema → "Evolution API: Online"

---

## 📞 ACESSO RÁPIDO

```bash
# Ver status de tudo
pm2 list

# Logs do backend
pm2 logs

# Acessar frontend
http://localhost:5173

# Acessar API
http://localhost:3000/api/health
```

---

## 🎊 RESULTADO ESPERADO

Após completar todos os testes, você deve ter:

✅ Sistema totalmente funcional
✅ Design elegante e profissional
✅ Todas as páginas operando
✅ Upload de arquivos funcionando
✅ Integração backend/frontend perfeita
✅ Interface responsiva
✅ Sem erros

**O sistema está pronto para gerenciar os pacientes da clínica Dr. Denis Tuma!**

---

**🚀 Bons testes! 🚀**
