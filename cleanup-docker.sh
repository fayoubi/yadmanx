#!/bin/bash

# YadmanX Docker Cleanup Script
# This script performs a complete cleanup of all Docker resources

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}YadmanX Docker Cleanup${NC}"
echo -e "${YELLOW}======================================${NC}"

echo -e "\n${GREEN}[1/6] Stopping all YadmanX containers...${NC}"
docker-compose down --remove-orphans 2>/dev/null || true

echo -e "\n${GREEN}[2/6] Removing all stopped containers...${NC}"
docker container prune -f

echo -e "\n${GREEN}[3/6] Removing phantom/orphaned containers...${NC}"
# Remove any containers with old naming schemes
docker ps -a --format "{{.ID}} {{.Names}}" | grep -E "f9c66100f13e|yadmanx" | awk '{print $1}' | xargs docker rm -f 2>/dev/null || true
# Also remove any containers without names
docker ps -a --filter "name=^$" -q | xargs docker rm -f 2>/dev/null || true

echo -e "\n${GREEN}[4/6] Removing dangling images...${NC}"
docker image prune -f

echo -e "\n${GREEN}[5/6] Removing unused networks...${NC}"
docker network prune -f

echo -e "\n${GREEN}[6/6] Showing current state...${NC}"
echo -e "${YELLOW}Containers:${NC}"
docker ps -a | grep yadmanx || echo "  No YadmanX containers"

echo -e "\n${YELLOW}Volumes:${NC}"
docker volume ls | grep yadmanx || echo "  No YadmanX volumes"

echo -e "\n${YELLOW}Networks:${NC}"
docker network ls | grep yadmanx || echo "  No YadmanX networks"

echo -e "\n${GREEN}Cleanup complete!${NC}"
echo -e "${YELLOW}To start fresh, run: ./start-yadmanx.sh${NC}\n"
