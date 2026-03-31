from __future__ import annotations

import logging
from typing import Any

import clickhouse_connect
from clickhouse_connect.driver.client import Client

from app.config import settings

logger = logging.getLogger(__name__)


class ClickHouseClient:
    """Wrapper around clickhouse-connect providing query helpers."""

    def __init__(self) -> None:
        self._client: Client | None = None

    async def connect(self) -> None:
        self._client = clickhouse_connect.get_client(
            host=settings.clickhouse_host,
            port=settings.clickhouse_port,
            database=settings.clickhouse_database,
            username=settings.clickhouse_user,
            password=settings.clickhouse_password,
        )
        logger.info(
            "Connected to ClickHouse at %s:%s/%s",
            settings.clickhouse_host,
            settings.clickhouse_port,
            settings.clickhouse_database,
        )

    def close(self) -> None:
        if self._client:
            self._client.close()
            logger.info("ClickHouse connection closed")

    @property
    def client(self) -> Client:
        if self._client is None:
            raise RuntimeError("ClickHouse client not connected — call connect() first")
        return self._client

    def query(self, sql: str, parameters: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        """Execute a SELECT query and return rows as list of dicts."""
        result = self.client.query(sql, parameters=parameters)
        columns = result.column_names
        return [dict(zip(columns, row)) for row in result.result_rows]

    def execute(self, sql: str, data: list[dict[str, Any]] | None = None) -> None:
        """Execute a non-SELECT statement (INSERT, CREATE, etc.)."""
        if data:
            columns = list(data[0].keys())
            rows = [list(row.values()) for row in data]
            self.client.insert(
                table=self._extract_table(sql),
                data=rows,
                column_names=columns,
            )
        else:
            self.client.command(sql)

    def command(self, sql: str) -> None:
        """Execute a DDL or admin command."""
        self.client.command(sql)

    @staticmethod
    def _extract_table(sql: str) -> str:
        """Extract table name from INSERT INTO <table> ... statement."""
        upper = sql.upper()
        idx = upper.find("INSERT INTO")
        if idx == -1:
            raise ValueError("Cannot extract table name — expected INSERT INTO")
        rest = sql[idx + len("INSERT INTO"):].strip()
        table = rest.split()[0].strip()
        return table


clickhouse_client = ClickHouseClient()
