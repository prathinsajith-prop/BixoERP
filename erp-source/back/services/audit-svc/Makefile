.PHONY: build run test lint docker-build clean

APP_NAME := audit-svc
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
