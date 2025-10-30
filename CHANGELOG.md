# Changelog - WhatsApp Dispatcher

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [V0] - 2025-01-23 (Versão Inicial)

### ✨ Features Implementadas

#### Sistema de Tags
- CRUD completo de tags (criar, listar, editar, deletar)
- Associação de tags com contatos (many-to-many)
- Seletor de cores para tags (10 cores preset)
- Visualização de tags como badges coloridos na lista de conversas
- Endpoint de contagem de contatos por tag
- Interface modal para gerenciamento de tags

#### Sistema de Produtos/Serviços
- CRUD completo de produtos
- Campos: nome, descrição, preço, SKU, categoria, imagem_url
- Associação de produtos com contatos (many-to-many)
- Campo de notas por associação
- Categorias: Procedimento, Consulta, Produto, Pacote, Retorno, Avaliação, Outro
- Interface modal para gerenciamento de produtos
- Formatação de preços em BRL

#### Sistema de Campanhas - Melhorias
- **Agendamento**: Datetime picker para agendar envio de campanhas
- **Mídia**: Suporte para anexar imagens, vídeos, áudios e documentos via URL
- **Estatísticas**: Dashboard com métricas detalhadas
  - Total de destinatários
  - Mensagens enviadas
  - Mensagens lidas
  - Falhas de envio
- **Estimativa Precisa**: Contagem real de contatos por tag (não mais mock)
- Layout aprimorado com cards e ícones coloridos

#### Correções Críticas
- **Marcador de Mensagens Não Lidas**:
  - Corrigido campo de mensagem (`evolution_message_id` vs `whatsapp_message_id`)
  - Auto-marcação como lida ao abrir conversa
- **Exibição de Mídia no Chat**:
  - Correção no armazenamento de mídia (movido para JSONB metadata)
  - Adicionado `contact_id` nas mensagens
  - Correção nos timestamps

### 🗄️ Database

#### Novas Tabelas
- `tags` - Armazena tags do sistema
- `products` - Armazena produtos/serviços
- `contact_tags` - Relação many-to-many entre contatos e tags
- `contact_products` - Relação many-to-many entre contatos e produtos

#### Views Criadas
- `contacts_with_tags` - Contatos com suas tags agregadas
- `contacts_with_products` - Contatos com seus produtos agregados

### 🔧 Backend APIs

#### Tags
- `GET /api/tags` - Listar tags
- `POST /api/tags` - Criar tag
- `PUT /api/tags/:id` - Atualizar tag
- `DELETE /api/tags/:id` - Deletar tag
- `POST /api/tags/:id/contacts/:contactId` - Adicionar tag ao contato
- `DELETE /api/tags/:id/contacts/:contactId` - Remover tag do contato
- `GET /api/tags/:id/contacts` - Listar contatos com tag
- `GET /api/tags/:id/contacts/count` - Contar contatos com tag

#### Products
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto
- `POST /api/products/:id/contacts/:contactId` - Adicionar produto ao contato
- `DELETE /api/products/:id/contacts/:contactId` - Remover produto do contato
- `GET /api/products/:id/contacts` - Listar contatos com produto

### 🎨 Frontend

#### Novos Componentes
- `TagsManager.tsx` - Modal de gerenciamento de tags
- `ProductsManager.tsx` - Modal de gerenciamento de produtos
- `ContactTagsProducts.tsx` - Componente de tags/produtos no perfil do contato
- `ProductSelector.tsx` - Seletor de produtos para contatos

#### Páginas Atualizadas
- `Products.tsx` - Página completa de produtos com CRUD
- `Campaigns.tsx` - Interface de campanhas totalmente renovada
- `Chat.tsx` - Visualização de tags como badges nos contatos

### 📦 Arquivos Principais

#### Backend
- `/backend/migrations/007_tags_and_products.sql`
- `/backend/src/controllers/tagController.js`
- `/backend/src/controllers/productController.js`
- `/backend/src/controllers/webhookController.js` (correções)
- `/backend/src/controllers/chatController.js` (correções)
- `/backend/src/routes/tags.js`
- `/backend/src/routes/products.js`

#### Frontend
- `/frontend/src/pages/Campaigns.tsx`
- `/frontend/src/pages/Products.tsx`
- `/frontend/src/components/TagsManager.tsx`
- `/frontend/src/components/ProductsManager.tsx`
- `/frontend/src/components/ProductSelector.tsx`
- `/frontend/src/components/ContactTagsProducts.tsx`
- `/frontend/src/components/ContactProfile.tsx`
- `/frontend/src/services/api.ts`
- `/frontend/src/types/index.ts`

### 🚀 Deploy

- **Ambiente**: Staging
- **URL**: https://dev-disparador.unblind.cloud
- **Backend**: PM2 (whatsapp-dispatcher-api)
- **Frontend**: Docker Swarm (dispatcher-frontend stack)
- **Database**: Supabase PostgreSQL

### 📝 Notas

Esta é a versão inicial (V0) do sistema. Todas as funcionalidades core estão implementadas e testadas em ambiente de staging.

**Próximas Versões Planejadas:**
- V1: Sistema de templates de mensagem
- V2: Analytics avançado de campanhas
- V3: Automações e workflows

---

## [Unreleased]

Nenhuma mudança não lançada no momento.
