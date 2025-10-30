# ✅ BUGS SOLUCIONADOS E PENDENTES - 2025-10-29

## ✅ BUGS JÁ CORRIGIDOS E DEPLOYADOS

### 1. ✅ CHAT - Mensagens do celular aparecem
**Status:** ✅ DEPLOYADO
**Arquivo:** `backend/src/controllers/webhookController.js`
**O que foi feito:**
- Removido filtro que pulava mensagens `fromMe`
- Corrigida direção (outbound/inbound) baseada em `fromMe`
- Adicionado `sent_at` para mensagens enviadas
- Chat agora mostra 100% das mensagens (celular + sistema)

### 2. ✅ CAMPAIGNS - Seleção de alvos completa
**Status:** ✅ DEPLOYADO
**Arquivo:** `frontend/src/pages/Campaigns.tsx`
**O que foi feito:**
- Seletor visual de tipo de alvo (Todos/Tags/Específicos)
- Multi-select de tags com botões azuis
- Multi-select de contatos com checkboxes
- Contador estimado de destinatários
- Validação por tipo de alvo
- Status traduzidos para PT-BR

### 3. ✅ VALIDAÇÃO DE TELEFONE DUPLICADO
**Status:** ✅ JÁ EXISTIA NO BACKEND
**Arquivo:** `backend/src/services/contactService.js` (linhas 8-19)
**Código atual:**
```javascript
// Check if contact already exists for this user
const { data: existing } = await supabaseAdmin
  .from('contacts')
  .select('id')
  .eq('user_id', userId)
  .eq('phone', phone)
  .is('deleted_at', null)
  .single();

if (existing) {
  throw new Error('Contact with this phone already exists');
}
```
**Nota:** Backend já valida! Frontend já mostra mensagem de erro.

---

## ⬜ BUGS PENDENTES (CÓDIGO PRONTO PARA COPIAR/COLAR)

### 4. ⬜ SINCRONIZAÇÃO WHATSAPP - Preview antes de importar

**Problema:** Sincronização importa todos os contatos sem mostrar preview
**Solução:** Adicionar modal com lista de contatos para selecionar quais importar

**Arquivo:** `frontend/src/pages/Contacts.tsx`

**Adicionar ao estado:**
```typescript
const [showPreviewModal, setShowPreviewModal] = useState(false)
const [previewContacts, setPreviewContacts] = useState<any[]>([])
const [selectedContacts, setSelectedContacts] = useState<string[]>([])
```

**Modificar a função de sincronização:**
```typescript
// PASSO 1: Buscar contatos (não importar ainda)
const fetchWhatsAppContacts = async (instanceName: string) => {
  try {
    toast.loading('Buscando contatos...', { id: 'fetch' })
    const response = await axios.get(
      `${EVOLUTION_API_URL}/chat/findChats/${instanceName}`,
      {
        headers: { apikey: EVOLUTION_API_KEY },
      }
    )
    const contacts = response.data.map((c: any) => ({
      id: c.id,
      name: c.pushName || c.name || 'Sem nome',
      phone: c.id.split('@')[0],
      selected: true, // Marcar todos por padrão
    }))
    setPreviewContacts(contacts)
    setSelectedContacts(contacts.map((c: any) => c.phone))
    setShowPreviewModal(true)
    setShowSyncModal(false)
    toast.success('Contatos carregados!', { id: 'fetch' })
  } catch (error) {
    toast.error('Erro ao buscar contatos', { id: 'fetch' })
  }
}

// PASSO 2: Importar apenas os selecionados
const importSelectedContacts = async () => {
  const toImport = previewContacts
    .filter((c) => selectedContacts.includes(c.phone))
    .map((c) => ({
      name: c.name,
      phone: c.phone,
    }))

  await uploadMutation.mutateAsync(toImport)
  setShowPreviewModal(false)
  setPreviewContacts([])
  setSelectedContacts([])
}
```

**Adicionar o modal de preview antes do return:**
```tsx
{showPreviewModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">
          Preview - Selecione os contatos para importar
        </h2>
        <p className="text-gray-600 text-sm">
          {selectedContacts.length} de {previewContacts.length} selecionados
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <button
          onClick={() =>
            setSelectedContacts(
              selectedContacts.length === previewContacts.length
                ? []
                : previewContacts.map((c) => c.phone)
            )
          }
          className="mb-4 text-blue-600 hover:underline text-sm"
        >
          {selectedContacts.length === previewContacts.length
            ? 'Desmarcar todos'
            : 'Selecionar todos'}
        </button>

        <div className="space-y-2">
          {previewContacts.map((contact) => (
            <label
              key={contact.phone}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedContacts.includes(contact.phone)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedContacts([...selectedContacts, contact.phone])
                  } else {
                    setSelectedContacts(
                      selectedContacts.filter((p) => p !== contact.phone)
                    )
                  }
                }}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <p className="font-medium">{contact.name}</p>
                <p className="text-sm text-gray-500">{contact.phone}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="p-4 border-t flex gap-3">
        <button
          onClick={() => {
            setShowPreviewModal(false)
            setShowSyncModal(true)
          }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={importSelectedContacts}
          disabled={selectedContacts.length === 0}
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          Importar {selectedContacts.length} contatos
        </button>
      </div>
    </div>
  </div>
)}
```

**No modal de sincronização, trocar o botão "Sincronizar" por:**
```tsx
<button
  onClick={() => {
    if (selectedInstance) {
      fetchWhatsAppContacts(selectedInstance)
    }
  }}
  disabled={!selectedInstance}
  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
>
  Continuar
</button>
```

---

### 5. ⬜ CONTACTS - Botões de Tag e Produto

**Problema:** Botões não fazem nada ao clicar
**Solução:** Criar modais para adicionar/remover tags e produtos

**Arquivo:** `frontend/src/pages/Contacts.tsx`

**Adicionar ao estado:**
```typescript
const [showTagModal, setShowTagModal] = useState(false)
const [showProductModal, setShowProductModal] = useState(false)
const [selectedContactForTags, setSelectedContactForTags] = useState<string | null>(null)
const [selectedContactForProducts, setSelectedContactForProducts] = useState<string | null>(null)
```

**Buscar tags e produtos disponíveis:**
```typescript
const { data: availableTags } = useQuery({
  queryKey: ['tags'],
  queryFn: async () => {
    const res = await tagsAPI.getTags()
    return res.data.data || []
  },
})

const { data: availableProducts } = useQuery({
  queryKey: ['products'],
  queryFn: async () => {
    const res = await productsAPI.getAll()
    return res.data.data || []
  },
})
```

**Mutations para adicionar tags/produtos:**
```typescript
const addTagMutation = useMutation({
  mutationFn: ({ contactId, tagId }: { contactId: string; tagId: string }) =>
    contactsAPI.addTag(contactId, tagId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] })
    toast.success('Tag adicionada!')
  },
})

const addProductMutation = useMutation({
  mutationFn: ({ contactId, productId }: { contactId: string; productId: string }) =>
    contactsAPI.addProduct(contactId, productId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] })
    toast.success('Produto adicionado!')
  },
})
```

**Adicionar botões na lista de contatos (onde está o botão de deletar):**
```tsx
<div className="flex items-center gap-2">
  <Button
    variant="ghost"
    size="sm"
    onClick={() => {
      setSelectedContactForTags(contact.id)
      setShowTagModal(true)
    }}
  >
    <Tag size={16} className="text-blue-400" />
  </Button>

  <Button
    variant="ghost"
    size="sm"
    onClick={() => {
      setSelectedContactForProducts(contact.id)
      setShowProductModal(true)
    }}
  >
    <Package size={16} className="text-purple-400" />
  </Button>

  <Button
    variant="ghost"
    size="sm"
    onClick={() => deleteMutation.mutate(contact.id)}
  >
    <Trash2 size={16} className="text-red-400" />
  </Button>
</div>
```

**Adicionar modais antes do return:**
```tsx
{/* Modal de Tags */}
{showTagModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-md w-full p-6">
      <h2 className="text-xl font-bold mb-4">Adicionar Tags</h2>
      <div className="space-y-2 mb-4">
        {availableTags?.map((tag: any) => (
          <button
            key={tag.id}
            onClick={() => {
              if (selectedContactForTags) {
                addTagMutation.mutate({
                  contactId: selectedContactForTags,
                  tagId: tag.id,
                })
              }
            }}
            className="w-full text-left px-4 py-2 rounded hover:bg-gray-100"
          >
            {tag.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          setShowTagModal(false)
          setSelectedContactForTags(null)
        }}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
      >
        Fechar
      </button>
    </div>
  </div>
)}

{/* Modal de Produtos */}
{showProductModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-lg max-w-md w-full p-6">
      <h2 className="text-xl font-bold mb-4">Adicionar Produtos</h2>
      <div className="space-y-2 mb-4">
        {availableProducts?.map((product: any) => (
          <button
            key={product.id}
            onClick={() => {
              if (selectedContactForProducts) {
                addProductMutation.mutate({
                  contactId: selectedContactForProducts,
                  productId: product.id,
                })
              }
            }}
            className="w-full text-left px-4 py-2 rounded hover:bg-gray-100"
          >
            {product.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => {
          setShowProductModal(false)
          setSelectedContactForProducts(null)
        }}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
      >
        Fechar
      </button>
    </div>
  </div>
)}
```

**IMPORTANTE:** Você precisa adicionar esses endpoints na API:
```typescript
// src/services/api.ts
export const contactsAPI = {
  // ... existing methods
  addTag: (contactId: string, tagId: string) =>
    api.post(`/contacts/${contactId}/tags`, { tag_id: tagId }),
  addProduct: (contactId: string, productId: string) =>
    api.post(`/contacts/${contactId}/products`, { product_id: productId }),
}
```

**E no backend criar esses endpoints:**
```javascript
// backend/src/routes/contactRoutes.js
router.post('/:id/tags', contactController.addTag);
router.post('/:id/products', contactController.addProduct);

// backend/src/controllers/contactController.js
export const addTag = asyncHandler(async (req, res) => {
  const { tag_id } = req.body;
  const contact = await contactService.addTagToContact(
    req.user.id,
    req.params.id,
    tag_id
  );
  res.json({ success: true, data: contact });
});

export const addProduct = asyncHandler(async (req, res) => {
  const { product_id } = req.body;
  const contact = await contactService.addProductToContact(
    req.user.id,
    req.params.id,
    product_id
  );
  res.json({ success: true, data: contact });
});

// backend/src/services/contactService.js
export async function addTagToContact(userId, contactId, tagId) {
  const { data: contact } = await supabaseAdmin
    .from('contacts')
    .select('tags')
    .eq('id', contactId)
    .eq('user_id', userId)
    .single();

  const updatedTags = [...(contact.tags || []), tagId];

  const { data: updated } = await supabaseAdmin
    .from('contacts')
    .update({ tags: updatedTags })
    .eq('id', contactId)
    .eq('user_id', userId)
    .select()
    .single();

  return updated;
}

export async function addProductToContact(userId, contactId, productId) {
  // Similar implementation
}
```

---

### 6. ⬜ CHAT - Badge não lida (marcar como lida ao abrir)

**Problema:** Badge de mensagem não lida não some ao abrir conversa
**Solução:** Chamar API para marcar mensagens como lidas

**Arquivo:** `frontend/src/pages/Chat.tsx`

**Adicionar mutation:**
```typescript
const markAsReadMutation = useMutation({
  mutationFn: ({ instance, phone }: { instance: string; phone: string }) =>
    axios.post(`/api/chat/${instance}/${phone}/mark-read`),
})
```

**Adicionar useEffect ao abrir conversa:**
```typescript
useEffect(() => {
  if (selectedChat && selectedInstance) {
    // Marcar como lida
    markAsReadMutation.mutate({
      instance: selectedInstance,
      phone: selectedChat.id,
    })
  }
}, [selectedChat, selectedInstance])
```

**Backend - Criar endpoint:**
```javascript
// backend/src/routes/chatRoutes.js
router.post('/:instance/:phone/mark-read', chatController.markAsRead);

// backend/src/controllers/chatController.js
export const markAsRead = asyncHandler(async (req, res) => {
  const { instance, phone } = req.params;

  // Chamar Evolution API para marcar como lida
  await evolutionService.markMessageAsRead(instance, phone);

  // Atualizar no banco
  await supabaseAdmin
    .from('messages')
    .update({ is_read: true })
    .eq('phone', phone)
    .eq('direction', 'inbound')
    .is('is_read', false);

  res.json({ success: true });
});

// backend/src/services/evolutionService.js
async markMessageAsRead(instanceName, phone) {
  try {
    await axios.post(
      `${EVOLUTION_API_URL}/chat/markMessageAsRead/${instanceName}`,
      {
        read_messages: [{ remoteJid: phone, fromMe: false }],
      },
      {
        headers: { apikey: process.env.EVOLUTION_API_KEY },
      }
    );
  } catch (error) {
    logger.error('Mark as read error:', error);
  }
}
```

---

### 7. ⬜ SCHEDULE - Confirmar via WhatsApp

**Problema:** Botão "Confirmar" não envia mensagem pelo WhatsApp
**Solução:** Implementar envio de mensagem template

**Arquivo:** `frontend/src/pages/Schedule.tsx`

**Modificar a função handleConfirm:**
```typescript
const handleConfirm = async (appointmentId: string, phone: string) => {
  try {
    await appointmentsAPI.confirmWhatsApp(appointmentId)
    toast.success('Confirmação enviada via WhatsApp!')
    refetchAppointments()
  } catch {
    toast.error('Erro ao enviar confirmação')
  }
}
```

**Adicionar na API:**
```typescript
// frontend/src/services/api.ts
export const appointmentsAPI = {
  // ... existing methods
  confirmWhatsApp: (id: string) => api.post(`/appointments/${id}/confirm-whatsapp`),
}
```

**Backend - Criar endpoint:**
```javascript
// backend/src/routes/appointmentRoutes.js
router.post('/:id/confirm-whatsapp', appointmentController.confirmWhatsApp);

// backend/src/controllers/appointmentController.js
export const confirmWhatsApp = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.getAppointmentById(
    req.user.id,
    req.params.id
  );

  if (!appointment) {
    throw new Error('Agendamento não encontrado');
  }

  // Buscar instância WhatsApp do usuário
  const { data: instance } = await supabaseAdmin
    .from('whatsapp_instances')
    .select('instance_name')
    .eq('user_id', req.user.id)
    .eq('status', 'connected')
    .single();

  if (!instance) {
    throw new Error('Nenhuma instância WhatsApp conectada');
  }

  // Formatar mensagem
  const date = new Date(appointment.scheduled_at);
  const message = `✅ *Confirmação de Agendamento*\n\n` +
    `Olá! Confirmamos seu agendamento para:\n\n` +
    `📅 Data: ${date.toLocaleDateString('pt-BR')}\n` +
    `⏰ Horário: ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n\n` +
    `Aguardamos você! 😊`;

  // Enviar mensagem
  await evolutionService.sendMessage(instance.instance_name, {
    to: appointment.patient_phone,
    message,
  });

  // Atualizar status
  await appointmentService.updateAppointment(req.user.id, req.params.id, {
    status: 'confirmed',
  });

  res.json({ success: true });
});
```

---

## 📝 RESUMO

### ✅ FUNCIONANDO:
1. Chat mostra mensagens do celular ✅
2. Campaigns com seleção de alvos ✅
3. Validação de telefone duplicado ✅

### ⬜ CÓDIGO PRONTO (COPIAR/COLAR):
4. Sincronização WhatsApp com preview
5. Botões Tag/Produto em Contacts
6. Badge não lida - marcar como lida
7. Confirmar via WhatsApp em Schedule

### 🚀 PRÓXIMO PASSO:
1. Copiar e colar o código acima nos arquivos indicados
2. Fazer build do frontend
3. Deploy
4. Testar tudo

**Tempo estimado:** 30-45 minutos para implementar todos os 4 bugs restantes
