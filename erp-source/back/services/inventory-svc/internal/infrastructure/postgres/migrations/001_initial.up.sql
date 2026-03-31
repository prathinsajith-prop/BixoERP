CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, code)
);

CREATE INDEX idx_warehouses_tenant_id ON warehouses (tenant_id);

CREATE TABLE IF NOT EXISTS stock_items (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
    reorder_level NUMERIC(18, 4) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(18, 4) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    category_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, sku, warehouse_id),
    CONSTRAINT chk_quantity_non_negative CHECK (quantity >= 0)
);

CREATE INDEX idx_stock_items_tenant_id ON stock_items (tenant_id);
CREATE INDEX idx_stock_items_sku ON stock_items (tenant_id, sku);
CREATE INDEX idx_stock_items_warehouse ON stock_items (tenant_id, warehouse_id);
CREATE INDEX idx_stock_items_reorder ON stock_items (tenant_id) WHERE quantity <= reorder_level AND is_active = true;

CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    stock_item_id UUID NOT NULL REFERENCES stock_items(id),
    movement_type VARCHAR(20) NOT NULL,
    quantity NUMERIC(18, 4) NOT NULL,
    from_warehouse_id UUID REFERENCES warehouses(id),
    to_warehouse_id UUID REFERENCES warehouses(id),
    reference_id UUID,
    reference_type VARCHAR(50),
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_tenant_id ON stock_movements (tenant_id);
CREATE INDEX idx_stock_movements_stock_item ON stock_movements (tenant_id, stock_item_id);
CREATE INDEX idx_stock_movements_warehouse ON stock_movements (tenant_id, from_warehouse_id, to_warehouse_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements (created_at);

CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY,
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX idx_outbox_events_unpublished ON outbox_events (created_at) WHERE published_at IS NULL;

CREATE TABLE IF NOT EXISTS processed_events (
    event_id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_processed_events_type ON processed_events (event_type);
