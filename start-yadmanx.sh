#!/bin/bash

# YadmanX Startup Script
# This script starts all backend services and the frontend application

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}Starting YadmanX Platform${NC}"
echo -e "${GREEN}======================================${NC}"

# Check if llm-quote-service .env file exists
if [ ! -f "llm-quote-service/.env" ]; then
    echo -e "${RED}ERROR: llm-quote-service/.env file not found!${NC}"
    echo -e "${YELLOW}Please copy llm-quote-service/.env.example to llm-quote-service/.env and configure it.${NC}"
    exit 1
fi

# Verify CLAUDE_API_KEY is set in llm-quote-service/.env
if ! grep -qE "^CLAUDE_API_KEY=.+" llm-quote-service/.env; then
    echo -e "${RED}ERROR: CLAUDE_API_KEY not configured in llm-quote-service/.env${NC}"
    echo -e "${YELLOW}Please set your Claude API key in llm-quote-service/.env${NC}"
    exit 1
fi

echo -e "\n${GREEN}[1/4] Stopping any existing Docker containers...${NC}"
docker-compose down 2>/dev/null || true

echo -e "\n${GREEN}[2/4] Starting backend services with Docker Compose...${NC}"
echo "  - Pricing Service (port 3001)"
echo "  - Enrollment Service (port 3002)"
echo "  - Agent Service (port 3003)"
echo "  - LLM Quote Service (port 3004)"
echo "  - PostgreSQL databases"
echo "  - Redis instances"

docker-compose up -d

echo -e "\n${GREEN}[3/4] Waiting for services to be ready...${NC}"

# Function to wait for a service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    echo -n "  Waiting for $service_name (port $port)..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$port/health > /dev/null 2>&1 || \
           curl -s http://localhost:$port > /dev/null 2>&1 || \
           nc -z localhost $port > /dev/null 2>&1; then
            echo -e " ${GREEN}${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo -e " ${YELLOW}� (timeout, but continuing)${NC}"
    return 1
}

# Wait for databases
wait_for_service "Pricing DB" 5432
wait_for_service "Enrollment DB" 5433
wait_for_service "Agent DB" 5434

# Wait for Redis instances
wait_for_service "Pricing Redis" 6379
wait_for_service "LLM Quote Redis" 6380

# Give services a moment to initialize
sleep 5

# Wait for application services
wait_for_service "Pricing Service" 3001
wait_for_service "Enrollment Service" 3002
wait_for_service "Agent Service" 3003
wait_for_service "LLM Quote Service" 3004

echo -e "\n${GREEN}[4/4] Starting frontend application...${NC}"
echo -e "${YELLOW}Note: Frontend will start on http://localhost:3000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    docker-compose down
    echo -e "${GREEN}All services stopped.${NC}"
}

# Set trap to cleanup on exit (registered before blocking npm start)
trap cleanup EXIT INT TERM

# Start the frontend
npm start
