# 🚀 GUIA RÁPIDO - Dr. Denis Tuma WhatsApp Dispatcher

## ⚡ ACESSO IMEDIATO

### 1. Abra o Navegador
```
URL: http://localhost:5173
```

### 2. Faça Login
```
Email: apps@unblind.art
Senha: m+0aGjQ6UX7d0wovuTvNphc3vQNbHHDM
```

### 3. Comece a Usar!

---

## 📋 FUNCIONALIDADES PRINCIPAIS

### 🏠 Dashboard
- Veja estatísticas gerais
- Total de pacientes, mensagens, taxa de entrega
- Status do sistema em tempo real

### 👥 Pacientes
**Adicionar Individual:**
1. Clique em "Novo Paciente"
2. Preencha nome, telefone, email
3. Clique em "Salvar"

**Importar Lista em Massa:**
1. Prepare seu arquivo (CSV ou XLSX)
2. Arraste o arquivo para a área de upload
3. Aguarde a importação

**Formato CSV Exemplo:**
```csv
nome,telefone,email
Maria Silva,5547999999999,maria@email.com
João Santos,5547988888888,joao@email.com
```

**Formato XLSX:**
- Colunas: `nome`, `telefone`, `email`
- Telefone: somente números ou com formatação

### 📤 Campanhas
**Criar Campanha:**
1. Clique em "Nova Campanha"
2. Digite o nome da campanha
3. Escreva a mensagem
4. Clique em "Criar e Enviar"

**Controles:**
- **Pausar:** Interrompe envios
- **Retomar:** Continua envios
- **Cancelar:** Para definitivamente

### 💬 Mensagens
**Enviar Mensagem Individual:**
1. Digite o telefone (ex: 5547999999999)
2. Escreva a mensagem
3. Clique em "Enviar"

### 📅 Agenda
- Veja agendamentos do dia
- Confirme via WhatsApp
- Envie lembretes
- Reagende consultas

---

## 🎨 CORES DO SISTEMA

- **Azul Royal:** Botões principais, links importantes
- **Azul Petróleo:** Botões secundários, destaques
- **Preto/Cinza:** Background, sidebar
- **Branco:** Cards, conteúdo
- **Verde:** Sucesso, confirmações
- **Vermelho:** Erros, cancelamentos

---

## 🔧 COMANDOS TÉCNICOS

### Verificar Status
```bash
# Backend
pm2 list
curl http://localhost:3000/api/health

# Frontend
# Abra http://localhost:5173
```

### Restart Sistema
```bash
# Restart Backend
pm2 restart all

# Restart Frontend
cd /opt/whatsapp-dispatcher-client/frontend
npm run dev
```

### Ver Logs
```bash
# Logs Backend
pm2 logs whatsapp-dispatcher-api

# Logs Worker
pm2 logs whatsapp-dispatcher-worker
```

---

## 📱 INTEGRAÇÃO WHATSAPP

O sistema está conectado à Evolution API que gerencia o WhatsApp.

**Status da Conexão:**
- Veja no Dashboard em "Status do Sistema"
- Deve mostrar "Evolution API: ● Conectado"

**QR Code (se necessário):**
```bash
# Acesse a Evolution API
http://localhost:8080
```

---

## 💾 BACKUP

Backups automáticos estão configurados em:
```
/opt/whatsapp-dispatcher-client/backups/
```

---

## ❓ SOLUÇÃO DE PROBLEMAS

### Frontend não abre
```bash
cd /opt/whatsapp-dispatcher-client/frontend
npm run dev
```

### Backend não responde
```bash
pm2 restart all
pm2 logs
```

### Erro de login
- Verifique se o backend está online: `pm2 list`
- Teste a API: `curl http://localhost:3000/api/health`
- Use as credenciais corretas

### Upload de arquivo não funciona
- Formatos aceitos: CSV, XLS, XLSX
- Máximo 1000 contatos por vez
- Colunas obrigatórias: `nome` e `telefone`

---

## 📞 INFORMAÇÕES TÉCNICAS

**Portas:**
- Frontend: 5173
- Backend API: 3000
- Evolution API: 8080
- Redis: 6379

**Processos PM2:**
- whatsapp-dispatcher-api (2 instâncias)
- whatsapp-dispatcher-worker (1 instância)

**Database:** Supabase PostgreSQL
**Cache:** Redis
**WhatsApp:** Evolution API v2.2.3

---

## 🎯 DICAS DE USO

1. **Sempre confirme opt-in** antes de enviar campanhas
2. **Use mensagens personalizadas** para melhor engajamento
3. **Agende envios** para horários apropriados
4. **Monitore a taxa de entrega** no Dashboard
5. **Faça backup regular** da lista de pacientes

---

## ✅ CHECKLIST DIÁRIO

- [ ] Verificar status do sistema (Dashboard)
- [ ] Confirmar agendamentos do dia
- [ ] Enviar lembretes automáticos
- [ ] Revisar mensagens recebidas
- [ ] Atualizar cadastro de novos pacientes

---

**Sistema pronto para uso profissional!** 🚀

Para suporte técnico, consulte `FINAL_STATUS.md` ou `PRODUCTION_STATUS.md`
