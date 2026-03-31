-- ============================================================================
-- ClickHouse Schema for report-svc (CQRS Read Model)
-- All tables use ReplacingMergeTree for idempotent projections.
-- Partitioned by month (toYYYYMM) for efficient time-range queries.
-- Every table is scoped by tenant_id.
-- ============================================================================

-- ─── Fact Tables ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fact_journal_entries (
    event_id       String,
    tenant_id      String,
    journal_id     String,
    account_id     String,
    entry_date     Date,
    debit_amount   Decimal(19, 4),
    credit_amount  Decimal(19, 4),
    currency       LowCardinality(String),
    description    String,
    created_at     DateTime
) ENGINE = ReplacingMergeTree(created_at)
PARTITION BY toYYYYMM(entry_date)
ORDER BY (tenant_id, entry_date, journal_id, event_id)
SETTINGS index_granularity = 8192;


CREATE TABLE IF NOT EXISTS fact_invoices (
    event_id       String,
    tenant_id      String,
    invoice_id     String,
    customer_id    String,
    vendor_id      String,
    invoice_type   LowCardinality(String),  -- RECEIVABLE | PAYABLE
    total_amount   Decimal(19, 4),
    currency       LowCardinality(String),
    status         LowCardinality(String),
    invoice_date   Date,
    due_date       Date,
    created_at     DateTime
) ENGINE = ReplacingMergeTree(created_at)
PARTITION BY toYYYYMM(invoice_date)
ORDER BY (tenant_id, invoice_date, invoice_id, event_id)
SETTINGS index_granularity = 8192;


CREATE TABLE IF NOT EXISTS fact_sales_orders (
    event_id       String,
    tenant_id      String,
    order_id       String,
    customer_id    String,
    total_amount   Decimal(19, 4),
    currency       LowCardinality(String),
    status         LowCardinality(String),
    order_date     DateTime,
    created_at     DateTime
) ENGINE = ReplacingMergeTree(created_at)
PARTITION BY toYYYYMM(order_date)
ORDER BY (tenant_id, order_date, order_id, event_id)
SETTINGS index_granularity = 8192;


CREATE TABLE IF NOT EXISTS fact_stock_movements (
    event_id       String,
    tenant_id      String,
    movement_id    String,
    product_id     String,
    warehouse_id   String,
    movement_type  LowCardinality(String),  -- RECEIVE | ISSUE | TRANSFER | ADJUST
    quantity       Decimal(19, 4),
    current_qty    Decimal(19, 4),
    reorder_level  Decimal(19, 4),
    movement_date  Date,
    created_at     DateTime
) ENGINE = ReplacingMergeTree(created_at)
PARTITION BY toYYYYMM(movement_date)
ORDER BY (tenant_id, movement_date, product_id, event_id)
SETTINGS index_granularity = 8192;


CREATE TABLE IF NOT EXISTS fact_payroll (
    event_id         String,
    tenant_id        String,
    payroll_id       String,
    employee_id      String,
    gross_amount     Decimal(19, 4),
    net_amount       Decimal(19, 4),
    currency         LowCardinality(String),
    pay_period_start Date,
    pay_period_end   Date,
    created_at       DateTime
) ENGINE = ReplacingMergeTree(created_at)
PARTITION BY toYYYYMM(pay_period_start)
ORDER BY (tenant_id, pay_period_start, payroll_id, event_id)
SETTINGS index_granularity = 8192;


CREATE TABLE IF NOT EXISTS fact_work_orders (
    event_id       String,
    tenant_id      String,
    work_order_id  String,
    product_id     String,
    quantity       Decimal(19, 4),
    status         LowCardinality(String),
    planned_start  Date,
    planned_end    Date,
    actual_start   Nullable(Date),
    actual_end     Nullable(Date),
    total_cost     Decimal(19, 4),
    currency       LowCardinality(String),
    created_at     DateTime
) ENGINE = ReplacingMergeTree(created_at)
PARTITION BY toYYYYMM(planned_start)
ORDER BY (tenant_id, planned_start, work_order_id, event_id)
SETTINGS index_granularity = 8192;


-- ─── Dimension Tables ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dim_accounts (
    tenant_id      String,
    account_id     String,
    account_code   String,
    account_name   String,
    category       LowCardinality(String),  -- ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE
    is_active      UInt8 DEFAULT 1
) ENGINE = ReplacingMergeTree()
ORDER BY (tenant_id, account_id)
SETTINGS index_granularity = 8192;


CREATE TABLE IF NOT EXISTS dim_customers (
    tenant_id      String,
    customer_id    String,
    customer_name  String,
    email          String,
    country        LowCardinality(String)
) ENGINE = ReplacingMergeTree()
ORDER BY (tenant_id, customer_id)
SETTINGS index_granularity = 8192;


CREATE TABLE IF NOT EXISTS dim_vendors (
    tenant_id      String,
    vendor_id      String,
    vendor_name    String,
    email          String,
    country        LowCardinality(String)
) ENGINE = ReplacingMergeTree()
ORDER BY (tenant_id, vendor_id)
SETTINGS index_granularity = 8192;


CREATE TABLE IF NOT EXISTS dim_employees (
    tenant_id      String,
    employee_id    String,
    full_name      String,
    department     LowCardinality(String),
    position       String,
    hire_date      Date
) ENGINE = ReplacingMergeTree()
ORDER BY (tenant_id, employee_id)
SETTINGS index_granularity = 8192;


CREATE TABLE IF NOT EXISTS dim_products (
    tenant_id      String,
    product_id     String,
    sku            String,
    product_name   String,
    category       LowCardinality(String),
    unit_price     Decimal(19, 4),
    currency       LowCardinality(String)
) ENGINE = ReplacingMergeTree()
ORDER BY (tenant_id, product_id)
SETTINGS index_granularity = 8192;
