# ERP Kafka Topic Registry

All domain events follow the standard envelope schema defined in `envelope.schema.json`.

## Topic Naming Convention

`erp.{domain}.{aggregate}.{event}` — e.g., `erp.finance.journal-entry.posted`

## Topics by Service

### finance-svc
| Topic | Event Type | Description |
|-------|-----------|-------------|
| `erp.finance.journal-entry.posted` | finance.journal_entry.posted | Journal entry has been posted |
| `erp.finance.journal-entry.reversed` | finance.journal_entry.reversed | Journal entry reversal |
| `erp.finance.invoice.created` | finance.invoice.created | Customer invoice created |
| `erp.finance.invoice.paid` | finance.invoice.paid | Invoice payment received |
| `erp.finance.invoice.overdue` | finance.invoice.overdue | Invoice past due date |
| `erp.finance.period.closed` | finance.period.closed | Fiscal period closed |
| `erp.finance.budget.exceeded` | finance.budget.exceeded | Budget threshold exceeded |

### sales-svc
| Topic | Event Type | Description |
|-------|-----------|-------------|
| `erp.sales.order.created` | sales.order.created | Sales order drafted |
| `erp.sales.order.confirmed` | sales.order.confirmed | Order confirmed → triggers inventory reservation |
| `erp.sales.order.shipped` | sales.order.shipped | Order shipped to customer |
| `erp.sales.order.cancelled` | sales.order.cancelled | Order cancelled → releases reservation |
| `erp.sales.quotation.created` | sales.quotation.created | Quotation sent to customer |
| `erp.sales.quotation.accepted` | sales.quotation.accepted | Quotation accepted → creates order |

### inventory-svc
| Topic | Event Type | Description |
|-------|-----------|-------------|
| `erp.inventory.stock.received` | inventory.stock.received | Stock received into warehouse |
| `erp.inventory.stock.issued` | inventory.stock.issued | Stock issued from warehouse |
| `erp.inventory.stock.transferred` | inventory.stock.transferred | Inter-warehouse transfer |
| `erp.inventory.stock.below-reorder` | inventory.stock.below_reorder | Stock below reorder point → may trigger PO |
| `erp.inventory.stock.adjusted` | inventory.stock.adjusted | Manual inventory adjustment |

### procurement-svc
| Topic | Event Type | Description |
|-------|-----------|-------------|
| `erp.procurement.purchase-order.created` | procurement.purchase_order.created | PO drafted |
| `erp.procurement.purchase-order.approved` | procurement.purchase_order.approved | PO approved |
| `erp.procurement.purchase-order.sent` | procurement.purchase_order.sent | PO sent to vendor |
| `erp.procurement.goods-receipt.created` | procurement.goods_receipt.created | Goods received → triggers inventory update |
| `erp.procurement.three-way-match.completed` | procurement.three_way_match.completed | PO/GRN/Invoice matched |

### hr-svc
| Topic | Event Type | Description |
|-------|-----------|-------------|
| `erp.hr.employee.onboarded` | hr.employee.onboarded | New employee onboarded |
| `erp.hr.employee.terminated` | hr.employee.terminated | Employee terminated |
| `erp.hr.employee.transferred` | hr.employee.transferred | Department/position transfer |
| `erp.hr.payroll.processed` | hr.payroll.processed | Payroll run completed → triggers finance JE |
| `erp.hr.leave.requested` | hr.leave.requested | Leave request submitted |
| `erp.hr.leave.approved` | hr.leave.approved | Leave request approved |

### apar-svc
| Topic | Event Type | Description |
|-------|-----------|-------------|
| `erp.apar.vendor-invoice.received` | apar.vendor_invoice.received | Vendor invoice received |
| `erp.apar.vendor-invoice.approved` | apar.vendor_invoice.approved | Vendor invoice approved for payment |
| `erp.apar.payment-run.created` | apar.payment_run.created | Payment batch created |
| `erp.apar.payment-run.executed` | apar.payment_run.executed | Payment batch executed |
| `erp.apar.payment.completed` | apar.payment.completed | Individual payment completed |

### manufacturing-svc
| Topic | Event Type | Description |
|-------|-----------|-------------|
| `erp.manufacturing.work-order.created` | manufacturing.work_order.created | Work order planned |
| `erp.manufacturing.work-order.released` | manufacturing.work_order.released | Work order released for production |
| `erp.manufacturing.work-order.completed` | manufacturing.work_order.completed | Production completed |
| `erp.manufacturing.quality-check.passed` | manufacturing.quality_check.passed | QC passed |
| `erp.manufacturing.quality-check.failed` | manufacturing.quality_check.failed | QC failed |
| `erp.manufacturing.material.consumed` | manufacturing.material.consumed | Raw material consumed |

### project-svc
| Topic | Event Type | Description |
|-------|-----------|-------------|
| `erp.project.created` | project.created | Project created |
| `erp.project.status-changed` | project.status_changed | Project status updated |
| `erp.project.milestone.reached` | project.milestone.reached | Milestone completed |
| `erp.project.budget.warning` | project.budget.warning | Budget threshold reached |
| `erp.project.timesheet.submitted` | project.timesheet.submitted | Timesheet submitted |
| `erp.project.task.completed` | project.task.completed | Task completed |

### workflow-svc
| Topic | Event Type | Description |
|-------|-----------|-------------|
| `erp.workflow.approval.requested` | workflow.approval.requested | Approval requested |
| `erp.workflow.approval.approved` | workflow.approval.approved | Step approved |
| `erp.workflow.approval.rejected` | workflow.approval.rejected | Step rejected |
| `erp.workflow.approval.escalated` | workflow.approval.escalated | Approval escalated |
| `erp.workflow.approval.completed` | workflow.approval.completed | Workflow completed |

## Event Flow Examples

### Sales-to-Cash Flow
```
sales.order.confirmed
  → inventory.stock.issued
  → finance.invoice.created
  → finance.invoice.paid
```

### Procure-to-Pay Flow
```
inventory.stock.below_reorder
  → procurement.purchase_order.created
  → workflow.approval.requested
  → workflow.approval.completed
  → procurement.purchase_order.sent
  → procurement.goods_receipt.created
  → inventory.stock.received
  → procurement.three_way_match.completed
  → apar.vendor_invoice.approved
  → apar.payment.completed
  → finance.journal_entry.posted
```

### Manufacturing Flow
```
manufacturing.work_order.released
  → manufacturing.material.consumed
  → inventory.stock.issued
  → manufacturing.quality_check.passed
  → manufacturing.work_order.completed
  → inventory.stock.received
  → finance.journal_entry.posted (production cost)
```

### Payroll Flow
```
hr.payroll.processed
  → finance.journal_entry.posted (salary expense)
  → apar.payment_run.created
  → apar.payment_run.executed
```

## Consumer Groups

| Service | Consumes From |
|---------|---------------|
| finance-svc | sales.order.confirmed, hr.payroll.processed, manufacturing.work_order.completed |
| inventory-svc | sales.order.confirmed, procurement.goods_receipt.created, manufacturing.material.consumed |
| procurement-svc | inventory.stock.below_reorder, workflow.approval.completed |
| apar-svc | procurement.three_way_match.completed, hr.payroll.processed |
| notification-svc | ALL (fan-out for user notifications) |
| audit-svc | ALL (universal audit trail) |
| report-svc | ALL (ClickHouse projection updates) |
| workflow-svc | *.created, *.requested (entities needing approval) |
