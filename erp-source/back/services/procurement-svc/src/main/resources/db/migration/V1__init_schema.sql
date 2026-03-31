CREATE TABLE vendors (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    code            VARCHAR(50) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    tax_id          VARCHAR(50),
    email           VARCHAR(255),
    phone           VARCHAR(50),
    address         TEXT,
    city            VARCHAR(100),
    country         VARCHAR(100),
    payment_terms   INTEGER DEFAULT 30,
    currency        VARCHAR(3) DEFAULT 'USD',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, code)
);

CREATE TABLE purchase_orders (
    id                UUID PRIMARY KEY,
    tenant_id         UUID NOT NULL,
    order_number      VARCHAR(50) NOT NULL,
    vendor_id         UUID NOT NULL REFERENCES vendors(id),
    status            VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    currency          VARCHAR(3) NOT NULL DEFAULT 'USD',
    subtotal_amount   NUMERIC(19,4) NOT NULL DEFAULT 0,
    tax_amount        NUMERIC(19,4) NOT NULL DEFAULT 0,
    total_amount      NUMERIC(19,4) NOT NULL DEFAULT 0,
    notes             TEXT,
    expected_date     DATE,
    approved_by       UUID,
    approved_at       TIMESTAMPTZ,
    created_by        UUID NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, order_number)
);

CREATE TABLE purchase_order_lines (
    id                UUID PRIMARY KEY,
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    line_number       INTEGER NOT NULL,
    item_code         VARCHAR(100) NOT NULL,
    description       VARCHAR(500),
    quantity          NUMERIC(19,4) NOT NULL,
    received_quantity NUMERIC(19,4) NOT NULL DEFAULT 0,
    unit_price        NUMERIC(19,4) NOT NULL,
    currency          VARCHAR(3) NOT NULL DEFAULT 'USD',
    tax_rate          NUMERIC(5,2) NOT NULL DEFAULT 0,
    line_total        NUMERIC(19,4) NOT NULL,
    UNIQUE (purchase_order_id, line_number)
);

CREATE TABLE purchase_requisitions (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    requisition_number VARCHAR(50) NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    item_code       VARCHAR(100) NOT NULL,
    description     VARCHAR(500),
    quantity        NUMERIC(19,4) NOT NULL,
    estimated_price NUMERIC(19,4),
    currency        VARCHAR(3) DEFAULT 'USD',
    requested_by    UUID NOT NULL,
    approved_by     UUID,
    approved_at     TIMESTAMPTZ,
    purchase_order_id UUID REFERENCES purchase_orders(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, requisition_number)
);

CREATE TABLE goods_receipts (
    id                UUID PRIMARY KEY,
    tenant_id         UUID NOT NULL,
    receipt_number    VARCHAR(50) NOT NULL,
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id),
    received_by       UUID NOT NULL,
    received_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, receipt_number)
);

CREATE TABLE goods_receipt_lines (
    id                UUID PRIMARY KEY,
    goods_receipt_id  UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    po_line_id        UUID NOT NULL REFERENCES purchase_order_lines(id),
    quantity_received NUMERIC(19,4) NOT NULL,
    is_accepted       BOOLEAN DEFAULT TRUE,
    rejection_reason  VARCHAR(500)
);

CREATE TABLE outbox_events (
    id              UUID PRIMARY KEY,
    aggregate_type  VARCHAR(100) NOT NULL,
    aggregate_id    UUID NOT NULL,
    event_type      VARCHAR(100) NOT NULL,
    topic           VARCHAR(255) NOT NULL,
    payload         TEXT NOT NULL,
    tenant_id       UUID NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at    TIMESTAMPTZ
);

CREATE TABLE processed_events (
    event_id        VARCHAR(255) PRIMARY KEY,
    processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_tenant ON purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(tenant_id, status);
CREATE INDEX idx_vendors_tenant ON vendors(tenant_id);
CREATE INDEX idx_goods_receipts_po ON goods_receipts(purchase_order_id);
CREATE INDEX idx_purchase_requisitions_tenant ON purchase_requisitions(tenant_id);
CREATE INDEX idx_outbox_events_unpublished ON outbox_events(published_at) WHERE published_at IS NULL;
CREATE INDEX idx_processed_events_processed_at ON processed_events(processed_at);
