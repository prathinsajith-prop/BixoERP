.PHONY: build run test lint docker-build clean migrate

APP_NAME := inventory-svc
BUILD_DIR := ./bin

build:
	@echo "Building $(APP_NAME)..."
	go build -ldflags="-s -w" -o $(BUILD_DIR)/$(APP_NAME) ./cmd/server

run:
	go run ./cmd/server

test:
	go test ./... -v -cover -race

lint:
	golangci-lint run ./...

docker-build:
	docker build -t $(APP_NAME):latest .

clean:
	rm -rf $(BUILD_DIR)

migrate-up:
	@echo "Running migrations..."
	@for f in internal/infrastructure/postgres/migrations/*.up.sql; do \
		echo "Applying $$f"; \
		psql "$$DATABASE_URL" -f "$$f"; \
	done

migrate-down:
	@echo "Reverting migrations..."
	@for f in $$(ls -r internal/infrastructure/postgres/migrations/*.down.sql); do \
		echo "Reverting $$f"; \
		psql "$$DATABASE_URL" -f "$$f"; \
	done
