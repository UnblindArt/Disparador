# 📢 Guia de Campanhas - WhatsApp Dispatcher

## ✅ Funcionalidades JÁ Implementadas

### 1. ⏱️ Delay Anti-Block
**Status:** ✅ FUNCIONANDO

O sistema já implementa delay randômico entre mensagens para evitar bloqueio do WhatsApp.

**Como funciona:**
```javascript
// Backend: campaignService.js (linhas 23-24, 202)
delayMin = 3,  // segundos
delayMax = 10, // segundos

// Cálculo: delay aleatório entre 3-10 segundos
delaySeconds = random(delayMin, delayMax)
```

**Como usar no Frontend:**
```typescript
// Ao criar campanha, enviar:
{
  minDelay: 3,  // Mínimo 3 segundos
  maxDelay: 10, // Máximo 10 segundos
  // ...outros campos
}
```

**Recomendações de Delay:**
- **Teste/Demo**: 3-5 segundos
- **Produção normal**: 5-15 segundos
- **Campanha grande**: 10-30 segundos
- **Extra seguro**: 30-60 segundos

---

### 2. 📊 Tipos de Segmentação
**Status:** ✅ FUNCIONANDO

- ✅ **Todos os contatos** (`targetType: 'all'`)
- ✅ **Por tags** (`targetType: 'tag'`)
- ✅ **Por produtos** (`targetType: 'product'`)
- ✅ **Contatos individuais** (`targetType: 'individual'`)
- ✅ **Upload de lista** (`targetType: 'upload'`)

---

### 3. 📅 Agendamento
**Status:** ✅ FUNCIONANDO

- ✅ Envio imediato
- ✅ Agendamento para data/hora específica
- ✅ Fila de processamento

---

### 4. 📎 Mídia
**Status:** ✅ FUNCIONANDO

- ✅ Imagens
- ✅ Vídeos
- ✅ Documentos
- ✅ Áudios

---

### 5. 🔄 Cadências (Sequências)
**Status:** ✅ FUNCIONANDO

Sistema de mensagens em sequência (Dia 1, Dia 2, Dia 3...) com:
- ✅ Múltiplas mensagens
- ✅ Intervalos personalizados
- ✅ Mídias por mensagem

---

## 🧪 Como Testar Campanhas

### Teste 1: Campanha Simples

1. Acesse: https://dev-disparador.unblind.cloud/campaigns
2. Clique em **"Nova Campanha"**
3. Preencha:
   ```
   Nome: Teste Simples
   Mensagem: Olá! Esta é uma mensagem de teste.
   Segmentação: Contatos Individuais
   Delay Mín: 3 segundos
   Delay Máx: 10 segundos
   ```
4. Selecione 2-3 contatos
5. **Enviar Imediatamente**

**Resultado esperado:**
- ✅ Mensagens enviadas com intervalo de 3-10s entre cada
- ✅ Status atualizado em tempo real
- ✅ Contador de mensagens enviadas

---

### Teste 2: Campanha com Mídia

1. Nova Campanha
2. Adicionar **imagem ou vídeo**
3. Mensagem: "Confira nossa novidade!"
4. Enviar

**Resultado esperado:**
- ✅ Mídia enviada corretamente
- ✅ Legenda junto com mídia

---

### Teste 3: Campanha Agendada

1. Nova Campanha
2. **Agendar para**: 5 minutos no futuro
3. Criar campanha

**Resultado esperado:**
- ✅ Status: "scheduled"
- ✅ Envio automático no horário agendado
- ✅ Status muda para "active" → "completed"

---

### Teste 4: Campanha por Tags

1. Certifique-se de ter tags criadas
2. Atribua tags a alguns contatos
3. Nova Campanha → **Segmentar por Tags**
4. Selecione uma tag
5. **Estimativa de contatos** deve aparecer
6. Enviar

**Resultado esperado:**
- ✅ Apenas contatos com a tag recebem
- ✅ Contagem correta

---

### Teste 5: Cadência (Sequência)

1. Nova Campanha
2. Modo: **Cadência**
3. Adicionar 3 dias:
   ```
   Dia 1: "Bem-vindo ao nosso serviço!"
   Dia 2: "Conheça nossas funcionalidades"
   Dia 3: "Tem alguma dúvida?"
   ```
4. Criar

**Resultado esperado:**
- ✅ Mensagens enviadas nos intervalos corretos
- ✅ Cada contato segue a sequência

---

## 🎨 Melhorias Visuais Sugeridas (v1.2.1)

### 1. Indicador Visual de Delay

**Adicionar no formulário de campanha:**
```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <h4 className="font-medium text-blue-900 mb-2">
    ⏱️ Delay Anti-Block
  </h4>
  <p className="text-sm text-blue-700 mb-3">
    Intervalo aleatório entre mensagens para evitar bloqueio
  </p>

  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="text-sm text-blue-900">Mínimo (segundos)</label>
      <input type="number" value={minDelay} min="1" max="300" />
    </div>
    <div>
      <label className="text-sm text-blue-900">Máximo (segundos)</label>
      <input type="number" value={maxDelay} min="1" max="300" />
    </div>
  </div>

  <div className="mt-3 text-sm text-blue-600">
    💡 Recomendado: 5-15 segundos para segurança
  </div>
</div>
```

### 2. Preview de Velocidade

**Mostrar estimativa:**
```tsx
{estimatedContacts > 0 && (
  <div className="bg-gray-100 p-3 rounded">
    <p className="text-sm">
      📊 <strong>{estimatedContacts}</strong> contatos
    </p>
    <p className="text-sm text-gray-600">
      ⏱️ Tempo estimado: {calculateDuration(estimatedContacts, minDelay, maxDelay)}
    </p>
  </div>
)}
```

### 3. Alertas de Segurança

```tsx
{estimatedContacts > 50 && maxDelay < 10 && (
  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
    <p className="text-sm text-yellow-800">
      ⚠️ Atenção: Campanha grande com delay curto pode causar bloqueio.
      Recomendamos aumentar o delay máximo para pelo menos 15 segundos.
    </p>
  </div>
)}
```

---

## 🎲 Variação de Mensagens (v1.2.1)

### Como Funciona Atualmente

O sistema já suporta **variáveis**:
```javascript
// Backend: campaignService.js (linha 22)
variables: {
  name: 'João',
  company: 'ABC Ltd'
}
```

### Como Usar

**Mensagem com variáveis:**
```
Olá {{name}}!

Somos da {{company}} e temos uma proposta especial para você.

Agende sua consulta: bit.ly/agendar
```

**Será enviado:**
```
Olá João!

Somos da ABC Ltd e temos uma proposta especial para você.

Agende sua consulta: bit.ly/agendar
```

### Variáveis Disponíveis

- `{{name}}` - Nome do contato
- `{{phone}}` - Telefone
- `{{email}}` - Email
- Custom: Qualquer variável definida

---

## 🚦 Status de Campanhas

| Status | Descrição |
|--------|-----------|
| `draft` | Rascunho (não iniciada) |
| `scheduled` | Agendada para envio futuro |
| `active` | Em execução |
| `processing` | Processando mensagens |
| `completed` | Finalizada com sucesso |
| `paused` | Pausada manualmente |
| `cancelled` | Cancelada |
| `failed` | Falha no processamento |

---

## 🛡️ Boas Práticas Anti-Block

### 1. Delay Adequado
```javascript
// ❌ PERIGOSO
{ minDelay: 1, maxDelay: 2 }

// ✅ SEGURO
{ minDelay: 5, maxDelay: 15 }

// ✅ EXTRA SEGURO (campanhas grandes)
{ minDelay: 10, maxDelay: 30 }
```

### 2. Limite Diário
- **Máximo recomendado**: 200-300 mensagens/dia por número
- **Novo número**: Começar com 50-100/dia
- **Número estabelecido**: Até 500/dia (com cuidado)

### 3. Conteúdo
- ✅ Variar mensagens (usar variáveis)
- ✅ Evitar palavras spam: "Grátis", "Promoção", etc.
- ✅ Personalizar com nome do contato
- ❌ Não enviar a mesma mensagem para todos

### 4. Horário
- ✅ **Melhor horário**: 9h-18h (comercial)
- ⚠️ **Evitar**: 22h-8h (pode ser invasivo)
- ❌ **Nunca**: Madrugada (alto risco de bloqueio)

---

## 📊 Monitoramento

### Ver Status em Tempo Real
```bash
# Acessar dashboard
https://dev-disparador.unblind.cloud/campaigns

# Ver detalhes da campanha
- Total de contatos
- Mensagens enviadas
- Mensagens entregues
- Falhas
- Taxa de sucesso
```

### Logs do Backend
```bash
pm2 logs whatsapp-dispatcher-api | grep campaign
```

---

## ⚙️ Configurações Avançadas

### Editar Delays Padrão

**Frontend**: `frontend/src/pages/Campaigns.tsx`
```typescript
// Linha 37-38
minDelay: 5,  // Alterar padrão
maxDelay: 15, // Alterar padrão
```

**Backend**: `backend/src/services/campaignService.js`
```javascript
// Linha 23-24
delayMin = 5,  // Alterar padrão
delayMax = 15, // Alterar padrão
```

---

## 🐛 Troubleshooting

### Problema: Mensagens não são enviadas
**Soluções:**
1. Verificar instância WhatsApp conectada
2. Verificar contatos com `opt_in_status = 'opted_in'`
3. Ver logs: `pm2 logs whatsapp-dispatcher-api`

### Problema: Delay não está funcionando
**Verificar:**
1. Frontend está enviando `minDelay` e `maxDelay`
2. Backend está recebendo os valores
3. Logs mostram delay sendo aplicado

### Problema: Taxa alta de falha
**Causas possíveis:**
1. Delay muito curto
2. Número bloqueado pelo WhatsApp
3. Muitas mensagens em curto período

---

## ✅ Checklist de Campanha Segura

- [ ] Delay mínimo de 5 segundos
- [ ] Delay máximo de pelo menos 15 segundos
- [ ] Mensagem personalizada (usar {{name}})
- [ ] Máximo 200-300 mensagens/dia
- [ ] Horário comercial (9h-18h)
- [ ] Testar com 5-10 contatos primeiro
- [ ] Monitorar taxa de entrega
- [ ] Verificar se número não foi bloqueado

---

**Última atualização:** 2025-10-31
**Versão:** 1.2
