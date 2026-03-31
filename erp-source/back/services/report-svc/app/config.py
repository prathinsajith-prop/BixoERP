from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    port: int = 3013

    clickhouse_host: str = "localhost"
    clickhouse_port: int = 8123
    clickhouse_database: str = "erp_reports"
    clickhouse_user: str = "default"
    clickhouse_password: str = ""

    kafka_brokers: str = "localhost:9092"
    kafka_group_id: str = "report-svc"

    redis_host: str = "localhost"
    redis_port: int = 6379

    jwt_secret: str = "change-me-in-production"
    jwt_issuer: str = "erp-gateway"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
