from __future__ import annotations

import json
import logging
from typing import Any

from aiokafka import AIOKafkaConsumer

from app.config import settings
from app.application.projection_service import projection_service

logger = logging.getLogger(__name__)

# All known ERP event topics — report-svc subscribes to everything (CQRS read model).
ALL_TOPICS = [
    # Finance
    "finance.journal.posted",
    "finance.journal.created",
    "finance.invoice.created",
    "finance.invoice.paid",
    "finance.invoice.cancelled",
    "finance.payment.processed",
    "finance.account.created",
    "finance.account.updated",
    # AP/AR
    "apar.vendor-invoice.created",
    "apar.vendor-invoice.approved",
    "apar.payment-run.executed",
    "apar.payment-run.completed",
    # HR
    "hr.employee.created",
    "hr.employee.updated",
    "hr.employee.terminated",
    "hr.payroll.processed",
    "hr.leave.requested",
    "hr.leave.approved",
    # Sales
    "sales.order.created",
    "sales.order.confirmed",
    "sales.order.shipped",
    "sales.order.cancelled",
    "sales.quotation.created",
    "sales.customer.created",
    "sales.customer.updated",
    # Inventory
    "inventory.stock.received",
    "inventory.stock.issued",
    "inventory.stock.transferred",
    "inventory.stock.adjusted",
    "inventory.reorder.triggered",
    "inventory.product.created",
    "inventory.product.updated",
    # Procurement
    "procurement.purchase-order.created",
    "procurement.purchase-order.approved",
    "procurement.purchase-order.received",
    "procurement.vendor.created",
    "procurement.vendor.updated",
    # Manufacturing
    "manufacturing.order.created",
    "manufacturing.order.completed",
    # Project
    "project.project.created",
    "project.task.completed",
    "project.milestone.reached",
    "project.timesheet.submitted",
    # Workflow
    "workflow.request.created",
    "workflow.request.approved",
    "workflow.request.rejected",
    "workflow.step.completed",
]

# Idempotency: track processed event IDs in-memory (bounded LRU).
# In production, consider a persistent set or ClickHouse-based check.
_processed_events: set[str] = set()
_MAX_PROCESSED = 100_000


class KafkaEventConsumer:
    """Async Kafka consumer that projects every ERP event into ClickHouse."""

    def __init__(self) -> None:
        self._consumer: AIOKafkaConsumer | None = None
        self._running = False

    async def start(self) -> None:
        brokers = settings.kafka_brokers
        self._consumer = AIOKafkaConsumer(
            *ALL_TOPICS,
            bootstrap_servers=brokers,
            group_id=settings.kafka_group_id,
            auto_offset_reset="earliest",
            enable_auto_commit=True,
            value_deserializer=lambda v: json.loads(v.decode("utf-8")) if v else None,
        )
        await self._consumer.start()
        self._running = True
        logger.info("Kafka consumer started — subscribed to %d topics", len(ALL_TOPICS))

        try:
            async for msg in self._consumer:
                await self._handle_message(msg)
        finally:
            self._running = False

    async def stop(self) -> None:
        self._running = False
        if self._consumer:
            await self._consumer.stop()
            logger.info("Kafka consumer stopped")

    async def _handle_message(self, msg: Any) -> None:
        try:
            payload: dict[str, Any] = msg.value
            if not payload:
                return

            event_id = payload.get("event_id", payload.get("id", ""))
            event_type = payload.get("event_type", msg.topic)
            tenant_id = payload.get("tenant_id", "")

            if not tenant_id:
                logger.warning("Skipping event without tenant_id: %s", event_type)
                return

            # Idempotency check
            dedup_key = f"{tenant_id}:{event_id}"
            if dedup_key in _processed_events:
                logger.debug("Skipping duplicate event: %s", dedup_key)
                return

            await projection_service.project_event(event_type, payload, tenant_id)

            # Record as processed
            if len(_processed_events) >= _MAX_PROCESSED:
                _processed_events.clear()
            _processed_events.add(dedup_key)

        except Exception:
            logger.exception("Error processing Kafka message from topic %s", msg.topic)


kafka_consumer = KafkaEventConsumer()
