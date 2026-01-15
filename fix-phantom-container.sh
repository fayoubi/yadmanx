#!/bin/bash

# Fix Phantom Container Script
# Removes the f9c66100f13e reference from Docker's internal state

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Fixing phantom container f9c66100f13e...${NC}\n"

# Wait for Docker to be ready
echo "Waiting for Docker daemon..."
timeout=60
while ! docker info >/dev/null 2>&1; do
    if [ $timeout -le 0 ]; then
        echo "Docker daemon not responding. Please start Docker Desktop manually."
        exit 1
    fi
    sleep 2
    timeout=$((timeout - 2))
    echo -n "."
done
echo -e "\n${GREEN}Docker is ready${NC}\n"

# Remove the phantom container from Docker's database
echo "Removing phantom container references..."
docker system prune -a -f 2>/dev/null || true

# Try to remove specific phantom containers
for container_id in f9c66100f13e f9c66100f13e_yadmanx-agent-db; do
    echo "Attempting to remove: $container_id"
    docker rm -f "$container_id" 2>/dev/null || echo "  (already removed or doesn't exist)"
done

# Clean up compose state
echo -e "\nCleaning docker-compose state..."
docker-compose down --remove-orphans --volumes 2>/dev/null || true

# Remove all yadmanx containers
echo -e "\nRemoving all yadmanx containers..."
docker ps -a --format "{{.ID}} {{.Names}}" | grep yadmanx | awk '{print $1}' | xargs docker rm -f 2>/dev/null || true

echo -e "\n${GREEN}✓ Cleanup complete!${NC}"
echo -e "${YELLOW}Now run: ./start-yadmanx.sh${NC}\n"
