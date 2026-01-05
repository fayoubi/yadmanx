#!/bin/bash

# Force Start Script - Nuclear option to start YadmanX
# This script performs aggressive cleanup before starting

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}======================================${NC}"
echo -e "${RED}YadmanX Force Start (Nuclear Option)${NC}"
echo -e "${RED}======================================${NC}"
echo -e "${YELLOW}This will remove ALL Docker containers, images, and volumes!${NC}"
read -p "Are you sure? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "Aborted."
    exit 1
fi

echo -e "\n${GREEN}[1/8] Stopping all containers...${NC}"
docker stop $(docker ps -aq) 2>/dev/null || true

echo -e "\n${GREEN}[2/8] Removing all containers...${NC}"
docker rm -f $(docker ps -aq) 2>/dev/null || true

echo -e "\n${GREEN}[3/8] Removing all networks...${NC}"
docker network prune -f

echo -e "\n${GREEN}[4/8] Removing all volumes...${NC}"
docker volume prune -f

echo -e "\n${GREEN}[5/8] Removing all images...${NC}"
docker rmi -f $(docker images -aq) 2>/dev/null || true

echo -e "\n${GREEN}[6/8] Cleaning build cache...${NC}"
docker builder prune -a -f

echo -e "\n${GREEN}[7/8] System prune...${NC}"
docker system prune -a -f --volumes

echo -e "\n${GREEN}[8/8] Starting fresh with docker-compose...${NC}"
docker-compose up -d --build --remove-orphans

echo -e "\n${GREEN}✓ All services started fresh!${NC}"
echo -e "${YELLOW}Wait a minute for services to initialize, then check:${NC}"
echo -e "  docker-compose ps"
echo -e "  docker-compose logs -f"
