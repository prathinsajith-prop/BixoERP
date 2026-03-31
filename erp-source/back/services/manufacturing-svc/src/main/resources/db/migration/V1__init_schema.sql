-- Bill of Materials
CREATE TABLE bill_of_materials (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    bom_number      VARCHAR(50) NOT NULL,
    product_id      UUID NOT NULL,
    product_name    VARCHAR(255) NOT NULL,
    version         INTEGER NOT NULL DEFAULT 1,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    notes           TEXT,
    created_by      UUID NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, bom_number),
    UNIQUE (tenant_id, product_id, version)
);

-- BOM Lines (components)
CREATE TABLE bom_lines (
    id              UUID PRIMARY KEY,
    bom_id          UUID NOT NULL REFERENCES bill_of_materials(id) ON DELETE CASCADE,
    line_number     INTEGER NOT NULL,
    component_id    UUID NOT NULL,
    component_name  VARCHAR(255) NOT NULL,
    quantity        NUMERIC(19,4) NOT NULL,
    unit            VARCHAR(20) NOT NULL DEFAULT 'PCS',
    unit_cost       NUMERIC(19,4) NOT NULL DEFAULT 0,
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    notes           TEXT,
    UNIQUE (bom_id, line_number),
    UNIQUE (bom_id, component_id)
);

-- Work Orders
CREATE TABLE work_orders (
    id                  UUID PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    order_number        VARCHAR(50) NOT NULL,
    bom_id              UUID NOT NULL REFERENCES bill_of_materials(id),
    bom_version         INTEGER NOT NULL,
    product_id          UUID NOT NULL,
    product_name        VARCHAR(255) NOT NULL,
    quantity            NUMERIC(19,4) NOT NULL,
    completed_quantity  NUMERIC(19,4) NOT NULL DEFAULT 0,
    status              VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    priority            INTEGER NOT NULL DEFAULT 5,
    scheduled_start     TIMESTAMPTZ,
    scheduled_end       TIMESTAMPTZ,
    actual_start        TIMESTAMPTZ,
    actual_end          TIMESTAMPTZ,
    assigned_line       VARCHAR(100),
    material_cost       NUMERIC(19,4) NOT NULL DEFAULT 0,
    labor_cost          NUMERIC(19,4) NOT NULL DEFAULT 0,
    overhead_cost       NUMERIC(19,4) NOT NULL DEFAULT 0,
    total_cost          NUMERIC(19,4) NOT NULL DEFAULT 0,
    currency            VARCHAR(3) NOT NULL DEFAULT 'USD',
    notes               TEXT,
    sales_order_id      UUID,
    created_by          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, order_number)
);

-- Work Order Steps
CREATE TABLE work_order_steps (
    id              UUID PRIMARY KEY,
    work_order_id   UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    step_number     INTEGER NOT NULL,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    machine_id      UUID,
    machine_name    VARCHAR(255),
    estimated_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
    actual_hours    NUMERIC(10,2),
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    completed_by    UUID,
    notes           TEXT,
    UNIQUE (work_order_id, step_number)
);

-- Quality Checks
CREATE TABLE quality_checks (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    work_order_id   UUID NOT NULL REFERENCES work_orders(id),
    check_number    VARCHAR(50) NOT NULL,
    step_id         UUID REFERENCES work_order_steps(id),
    inspector_id    UUID NOT NULL,
    result          VARCHAR(20) NOT NULL,
    sample_size     INTEGER NOT NULL DEFAULT 1,
    defect_count    INTEGER NOT NULL DEFAULT 0,
    parameters      TEXT,
    notes           TEXT,
    checked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, check_number)
);

-- Outbox events (transactional outbox pattern)
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

-- Idempotent consumer tracking
CREATE TABLE processed_events (
    event_id        VARCHAR(255) PRIMARY KEY,
    processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bom_tenant ON bill_of_materials(tenant_id);
CREATE INDEX idx_bom_product ON bill_of_materials(tenant_id, product_id);
CREATE INDEX idx_bom_lines_bom ON bom_lines(bom_id);
CREATE INDEX idx_work_orders_tenant ON work_orders(tenant_id);
CREATE INDEX idx_work_orders_status ON work_orders(tenant_id, status);
CREATE INDEX idx_work_orders_bom ON work_orders(bom_id);
CREATE INDEX idx_work_orders_product ON work_orders(tenant_id, product_id);
CREATE INDEX idx_work_orders_sales_order ON work_orders(sales_order_id);
CREATE INDEX idx_work_order_steps_wo ON work_order_steps(work_order_id);
CREATE INDEX idx_quality_checks_wo ON quality_checks(work_order_id);
CREATE INDEX idx_quality_checks_tenant ON quality_checks(tenant_id);
CREATE INDEX idx_outbox_events_unpublished ON outbox_events(published_at) WHERE published_at IS NULL;
CREATE INDEX idx_processed_events_processed_at ON processed_events(processed_at);
