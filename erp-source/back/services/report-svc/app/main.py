import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.infrastructure.clickhouse_client import clickhouse_client
from app.infrastructure.kafka_consumer import kafka_consumer
from app.infrastructure.redis_cache import redis_cache
from app.middleware.jwt_middleware import JWTMiddleware
from app.middleware.metrics_middleware import MetricsMiddleware
from app.api.routes import financial_reports, operational_reports, dashboard, export

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("report-svc")


@asynccontextmanager
async def lifespan(application: FastAPI):
    # Startup
    logger.info("report-svc starting on port %s", settings.port)
    await clickhouse_client.connect()
    await redis_cache.connect()
    consumer_task = asyncio.create_task(kafka_consumer.start())
    yield
    # Shutdown
    await kafka_consumer.stop()
    consumer_task.cancel()
    await redis_cache.close()
    clickhouse_client.close()
    logger.info("report-svc shut down")


app = FastAPI(
    title="Report Service",
    description="CQRS read-model — ClickHouse analytics, dashboards, financial & operational reports",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(JWTMiddleware)
app.add_middleware(MetricsMiddleware)

app.include_router(financial_reports.router, prefix="/api/v1/reports/financial", tags=["Financial Reports"])
app.include_router(operational_reports.router, prefix="/api/v1/reports/operational", tags=["Operational Reports"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(export.router, prefix="/api/v1/reports/export", tags=["Export"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "report-svc"}
