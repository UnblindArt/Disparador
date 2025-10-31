# 📋 Controle de Versões - WhatsApp Dispatcher

## 🚀 Como fazer deploy de uma versão específica

```bash
# Deploy de versão específica
./deploy.sh v1.1.1

# Deploy da versão mais recente (master)
./deploy.sh latest

# Voltar para versão anterior
./deploy.sh v1.1
```

---

## 📦 Versões Disponíveis

### v1.2.1 (Atual em Produção) 🎯
**Data:** 2025-10-31 14:00
**Status:** ✅ Estável e em Produção
**Commit:** `df5c00b`

**Novidades - Campaign Safety Enhancements:**
- ✅ **UI melhorada** para delay anti-bloqueio com indicadores visuais
- ✅ **Alertas de segurança** em tempo real (danger/warning/good/excellent)
- ✅ **Calculadora automática** de duração da campanha
- ✅ **Botões rápidos** para configurações recomendadas (3-5s, 5-15s, 10-30s)
- ✅ **Dicas de personalização** com variáveis {{name}}, {{phone}}, {{email}}
- ✅ **Documentação completa** de campanhas (CAMPAIGNS_GUIDE.md)
- ✅ **Guia de deploy** rápido (README_DEPLOY.md)

**Lógica de Segurança:**
- >100 contatos + <10s delay = 🔴 PERIGO
- >50 contatos + <5s delay = 🔴 PERIGO
- >50 contatos + <10s delay = 🟡 AVISO
- 5-15s delay = 🟢 SEGURO (recomendado)
- >15s delay = 🟢 EXTRA SEGURO

**Backend v1.2 (não deployado ainda):**
- ⚙️ API de previsão financeira
- ⚙️ Pipeline de vendas
- ⚙️ Cálculo de probabilidade de fechamento
- ⚠️ Requer migração 011 antes do deploy

**Deploy:**
```bash
./deploy.sh v1.2.1
```

---

### v1.1.1
**Data:** 2025-10-31 12:45
**Status:** ✅ Estável (substituída por v1.2.1)
**Commit:** `6dc6efe`

**Novidades:**
- ✅ Botão "Confirmar" em agendamentos
- ✅ Fluxo de status: Agendado → Confirmado → Concluído
- ✅ Funciona no perfil do chat e página de agendamentos

**Deploy:**
```bash
./deploy.sh v1.1.1
```

---

### v1.1
**Data:** 2025-10-31 12:30
**Status:** ✅ Estável
**Commit:** `321c06a`

**Novidades:**
- ✅ Formulário de agendamento com labels claros
- ✅ Filtro por tags na lista de contatos
- ✅ Sistema de tags/produtos completo (backend + frontend)
- ✅ Dashboard financeiro com previsibilidade
- 🐛 Correção de mensagens duplicadas no chat

**Deploy:**
```bash
./deploy.sh v1.1
```

---

### v1.0 (v0)
**Data:** 2025-10-22
**Status:** ✅ Estável
**Commit:** `83b5034`

**Funcionalidades Base:**
- Sistema de autenticação
- Gerenciamento de contatos
- Chat WhatsApp integrado
- Campanhas de mensagens
- Sistema de agendamentos
- Multi-instâncias WhatsApp

**Deploy:**
```bash
./deploy.sh v0
```

---

## 🔄 Em Desenvolvimento

### v1.2 (dev/v1.2)
**Status:** 🚧 Em desenvolvimento
**Previsão:** 2025-10-31 14:00+

**Planejado:**
- [ ] Campo `expected_close_date` em produtos
- [ ] Lógica de previsão financeira automática
- [ ] Template de mensagens configurável
- [ ] Envio automático ao confirmar agendamento
- [ ] Melhorias na visualização da agenda

**Não fazer deploy em produção até finalizar!**

---

## 🛠️ Comandos Úteis

### Ver versão atual em produção
```bash
docker service inspect dispatcher-frontend_dispatcher-frontend --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}'
```

### Listar todas as versões
```bash
git tag -l
```

### Ver diferenças entre versões
```bash
git diff v1.1..v1.1.1
```

### Criar nova versão
```bash
git tag -a v1.x.x -m "Descrição da versão"
git push origin v1.x.x
```

---

## 📊 Histórico de Deploys

| Versão | Data | Horário | Deployado por | Status |
|--------|------|---------|---------------|--------|
| v1.1.1 | 2025-10-31 | 12:45 | Claude | ✅ Produção |
| v1.1   | 2025-10-31 | 12:30 | Claude | ✅ Estável |
| v1.0   | 2025-10-22 | 23:00 | Claude | ✅ Estável |

---

## ⚠️ Notas Importantes

1. **Sempre testar em dev antes de fazer deploy em produção**
2. **Manter pelo menos 3 versões estáveis no histórico**
3. **Fazer backup do banco antes de deploy de versão major**
4. **Documentar breaking changes em CHANGELOG.md**
5. **Nunca fazer deploy direto da branch master sem tag**

---

**Última atualização:** 2025-10-31 12:50
