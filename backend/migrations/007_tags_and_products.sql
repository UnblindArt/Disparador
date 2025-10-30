-- ============================================
-- TAGS AND PRODUCTS SYSTEM
-- Migration 007
-- Created: 2025-10-30
-- Description: Sistema de tags e produtos para organização de contatos
-- ============================================

-- ============================================
-- TAGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Hex color code
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_name ON tags(name);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    sku VARCHAR(100),
    category VARCHAR(100),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, sku)
);

CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);

-- ============================================
-- CONTACT_TAGS (many-to-many relationship)
-- ============================================
CREATE TABLE IF NOT EXISTS contact_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contact_id, tag_id)
);

CREATE INDEX idx_contact_tags_contact_id ON contact_tags(contact_id);
CREATE INDEX idx_contact_tags_tag_id ON contact_tags(tag_id);

-- ============================================
-- CONTACT_PRODUCTS (many-to-many relationship)
-- ============================================
CREATE TABLE IF NOT EXISTS contact_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contact_id, product_id)
);

CREATE INDEX idx_contact_products_contact_id ON contact_products(contact_id);
CREATE INDEX idx_contact_products_product_id ON contact_products(product_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Tags updated_at trigger
CREATE OR REPLACE FUNCTION update_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION update_tags_updated_at();

-- Products updated_at trigger
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_products_updated_at();

-- Contact_products updated_at trigger
CREATE OR REPLACE FUNCTION update_contact_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_products_updated_at
    BEFORE UPDATE ON contact_products
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_products_updated_at();

-- ============================================
-- HELPER VIEWS
-- ============================================

-- View para contatos com suas tags
CREATE OR REPLACE VIEW contacts_with_tags AS
SELECT
    c.id,
    c.user_id,
    c.phone,
    c.name,
    c.email,
    COALESCE(
        json_agg(
            json_build_object(
                'id', t.id,
                'name', t.name,
                'color', t.color
            )
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'::json
    ) as tags
FROM contacts c
LEFT JOIN contact_tags ct ON c.id = ct.contact_id
LEFT JOIN tags t ON ct.tag_id = t.id
GROUP BY c.id, c.user_id, c.phone, c.name, c.email;

-- View para contatos com seus produtos
CREATE OR REPLACE VIEW contacts_with_products AS
SELECT
    c.id,
    c.user_id,
    c.phone,
    c.name,
    COALESCE(
        json_agg(
            json_build_object(
                'id', p.id,
                'name', p.name,
                'price', p.price,
                'sku', p.sku,
                'notes', cp.notes
            )
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'::json
    ) as products
FROM contacts c
LEFT JOIN contact_products cp ON c.id = cp.contact_id
LEFT JOIN products p ON cp.product_id = p.id
GROUP BY c.id, c.user_id, c.phone, c.name;

-- ============================================
-- SAMPLE DATA (OPCIONAL - comentado)
-- ============================================

-- Exemplo de tags padrão
-- INSERT INTO tags (user_id, name, color, description) VALUES
--     ('user-id-aqui', 'Cliente', '#10B981', 'Cliente ativo'),
--     ('user-id-aqui', 'Lead', '#F59E0B', 'Lead em prospecção'),
--     ('user-id-aqui', 'VIP', '#8B5CF6', 'Cliente VIP'),
--     ('user-id-aqui', 'Inativo', '#EF4444', 'Cliente inativo');

COMMENT ON TABLE tags IS 'Tags para organização e categorização de contatos';
COMMENT ON TABLE products IS 'Produtos/serviços que podem ser associados a contatos';
COMMENT ON TABLE contact_tags IS 'Relação many-to-many entre contatos e tags';
COMMENT ON TABLE contact_products IS 'Relação many-to-many entre contatos e produtos';
