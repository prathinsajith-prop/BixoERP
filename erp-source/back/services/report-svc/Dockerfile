FROM python:3.12-slim AS base

WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app

COPY pyproject.toml ./
RUN pip install --no-cache-dir .

COPY app/ ./app/

RUN chown -R app:app /app
USER app

EXPOSE 3013

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3013"]
