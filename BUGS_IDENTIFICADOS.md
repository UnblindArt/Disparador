# 🐛 Bugs Identificados pelo Usuário - 2025-10-29

## STATUS: 🔴 **CRÍTICOS - NECESSITAM CORREÇÃO IMEDIATA**

---

## 1. ❌ **TELEFONE DUPLICADO**

### Problema:
Contatos aparecem duplicados na listagem.

### Causa Provável:
- Sincronização WhatsApp pode criar duplicatas
- Contatos criados manualmente + sincronizados do WhatsApp
- Falta validação de unicidade no frontend

### Solução:
1. **Backend:** Adicionar constraint UNIQUE em `contacts.phone + user_id`
2. **Backend:** Melhorar lógica de merge na sincronização
3. **Frontend:** Adicionar função de detectar/mesclar duplicatas
4. **Frontend:** Exibir aviso se telefone já existe

### Prioridade: 🔴 **ALTA**

---

## 2. ❌ **BOTÕES DE TAG E PRODUTO NÃO FAZEM NADA**

### Problema:
Ao clicar nos botões de adicionar tag ou produto em um contato, nada acontece.

### Causa:
- Função não implementada no frontend
- Modal/dropdown não foi criado
- Endpoints existem mas não estão conectados

### Solução:
1. Criar modal de seleção de tags
2. Criar modal de seleção de produtos
3. Conectar com endpoints:
   - `POST /api/contacts/:id/tags`
   - `POST /api/contacts/:id/products`
4. Atualizar lista após adicionar

### Prioridade: 🔴 **ALTA**

---

## 3. ❌ **SINCRONIZAÇÃO WHATSAPP TRAZ CONTATOS ERRADOS/DUPLICADOS**

### Problema:
Sincronização traz contatos que não deveriam aparecer e cria duplicatas.

### Causa Provável:
- Evolution API retorna TODOS os chats (incluindo não salvos)
- Contatos temporários/não salvos sendo importados
- Números que apenas enviaram mensagem uma vez

### Solução:
1. **Filtrar apenas contatos salvos no WhatsApp**
2. **Adicionar opção:** "Sincronizar apenas contatos salvos" vs "Todos os chats"
3. **Melhorar detecção de duplicatas** antes de inserir
4. **Pedir confirmação** antes de sincronizar (mostrar preview)

### Prioridade: 🔴 **CRÍTICA**

---

## 4. ❌ **CAMPANHAS SÓ TEM CRIAR E ENVIAR, NÃO SELECIONA ALVOS**

### Problema:
Ao criar campanha, não é possível selecionar:
- Contatos específicos
- Tags
- Produtos
- Apenas envia para "todos"

### Causa:
Interface incompleta - apenas campos básicos implementados.

### Solução:
1. **Adicionar seletor de tipo de alvo:**
   - ⚪ Todos os contatos
   - ⚪ Contatos específicos (multi-select)
   - ⚪ Por tags (multi-select)
   - ⚪ Por produtos (multi-select)

2. **Implementar componentes:**
   - Multi-select de contatos (com busca)
   - Multi-select de tags (colorido)
   - Multi-select de produtos
   - Preview: "X contatos serão impactados"

3. **Backend:** Já está preparado (campo `target_type`, `tags`, etc)

### Prioridade: 🔴 **CRÍTICA**

---

## 5. ❌ **CHAT NÃO EXIBE MENSAGENS ENVIADAS PELO CELULAR**

### Problema:
Chat só mostra mensagens enviadas pelo sistema, não mostra mensagens que o usuário enviou pelo celular.

### Causa:
- Webhook não está capturando mensagens `fromMe: true`
- Ou está capturando mas o código filtra apenas `fromMe: false`
- Chat não busca mensagens do celular

### Solução:
1. **Backend - webhookController:** Remover filtro `fromMe`
2. **Backend - chatController:** Buscar TODAS as mensagens (sistema + celular)
3. **Frontend:** Exibir corretamente com indicador visual:
   - 🟢 Mensagens enviadas (você)
   - 🔵 Mensagens recebidas (contato)

### Código a Verificar:
```javascript
// backend/src/controllers/webhookController.js
// Linha ~150: if (message.key.fromMe) continue; // ❌ REMOVER ESTA LINHA
```

### Prioridade: 🔴 **CRÍTICA**

---

## 6. ❌ **ÍCONES DE MENSAGENS NÃO LIDAS NÃO SOMEM AO ABRIR**

### Problema:
Badge de mensagens não lidas (contador) não desaparece quando você abre a conversa.

### Causa:
- Não há endpoint para "marcar como lida"
- Frontend não chama API para atualizar status
- Evolution API não está sendo notificada

### Solução:
1. **Backend:** Criar endpoint `POST /api/chat/:instanceName/:phone/mark-read`
2. **Backend:** Chamar Evolution API para marcar como lida
3. **Frontend:** Chamar endpoint ao abrir conversa
4. **Frontend:** Atualizar badge local imediatamente (otimistic update)

### Endpoint Evolution API:
```
POST /chat/markMessageAsRead/{instanceName}
Body: { key: { remoteJid, id, fromMe } }
```

### Prioridade: 🟡 **MÉDIA**

---

## 7. ❌ **BOTÃO "CONFIRMAR VIA WHATSAPP" NÃO FAZ NADA**

### Problema:
Na agenda, ao clicar em "Confirmar via WhatsApp" nada acontece.

### Causa:
Função está com TODO/mock - não foi implementada.

### Solução:
1. **Backend:** Criar endpoint `POST /api/appointments/:id/confirm-whatsapp`
2. **Backend:** Enviar mensagem via Evolution API com texto de confirmação
3. **Frontend:** Conectar botão ao endpoint
4. **Adicionar:** Template de mensagem personalizável

### Exemplo de mensagem:
```
Olá {nome}!

Confirmamos seu agendamento:
📅 Data: {data}
🕐 Horário: {hora}
📍 Local: {local}

Responda SIM para confirmar ou CANCELAR para reagendar.
```

### Prioridade: 🟡 **MÉDIA**

---

## 📊 RESUMO POR PRIORIDADE

### 🔴 Críticas (Impedem uso normal):
1. Sincronização WhatsApp (contatos errados/duplicados)
2. Campanhas sem seleção de alvos
3. Chat não mostra mensagens do celular

### 🔴 Altas (Afetam experiência):
4. Telefones duplicados
5. Botões de tag/produto não funcionam

### 🟡 Médias (Podem esperar):
6. Badge não lida não some
7. Confirmar WhatsApp não funciona

---

## 🎯 PLANO DE CORREÇÃO SUGERIDO

### FASE 1 - Bugs Críticos (2-3 horas)
1. ✅ Corrigir chat para mostrar TODAS as mensagens
2. ✅ Adicionar seleção de alvos em campanhas
3. ✅ Melhorar sincronização WhatsApp (filtros + preview)

### FASE 2 - Bugs Altos (1-2 horas)
4. ✅ Implementar modais de tag/produto
5. ✅ Adicionar detecção e merge de duplicatas
6. ✅ Validação de telefone único

### FASE 3 - Bugs Médios (1 hora)
7. ✅ Marcar como lida no chat
8. ✅ Confirmar agendamento via WhatsApp

---

## 🧪 COMO TESTAR CADA CORREÇÃO

### 1. Duplicatas:
- [ ] Criar contato com telefone X
- [ ] Tentar criar outro com mesmo telefone
- [ ] Deve avisar que já existe

### 2. Tags/Produtos:
- [ ] Abrir contato
- [ ] Clicar em "Adicionar Tag"
- [ ] Selecionar tags
- [ ] Ver tags aparecendo no contato

### 3. Sincronização WhatsApp:
- [ ] Clicar em "Sincronizar"
- [ ] Ver preview dos contatos
- [ ] Desmarcar indesejados
- [ ] Confirmar
- [ ] Verificar se não criou duplicatas

### 4. Campanhas:
- [ ] Criar campanha
- [ ] Selecionar "Por Tags"
- [ ] Escolher tags
- [ ] Ver "10 contatos serão impactados"
- [ ] Enviar
- [ ] Verificar quem recebeu

### 5. Chat:
- [ ] Abrir chat
- [ ] Enviar mensagem pelo celular
- [ ] Atualizar página
- [ ] Mensagem do celular deve aparecer

### 6. Badge não lida:
- [ ] Receber mensagem (badge aparece)
- [ ] Abrir conversa
- [ ] Badge deve sumir imediatamente

### 7. Confirmar WhatsApp:
- [ ] Abrir agendamento
- [ ] Clicar "Confirmar via WhatsApp"
- [ ] Contato deve receber mensagem
- [ ] Status deve mudar para "confirmado"

---

**Documentado em:** 2025-10-29
**Por:** Claude Code AI
**Status:** 🔴 Aguardando correção
