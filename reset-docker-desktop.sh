#!/bin/bash

# Reset Docker Desktop - Last Resort
# This will completely reset Docker Desktop to factory settings

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${RED}╔════════════════════════════════════════╗${NC}"
echo -e "${RED}║  Docker Desktop Factory Reset          ║${NC}"
echo -e "${RED}║  WARNING: This will delete EVERYTHING  ║${NC}"
echo -e "${RED}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}This will remove:${NC}"
echo "  - All containers"
echo "  - All images"
echo "  - All volumes"
echo "  - All networks"
echo "  - All build cache"
echo "  - Docker Desktop settings"
echo ""
read -p "Type 'RESET' to continue: " -r
if [[ ! $REPLY == "RESET" ]]; then
    echo "Aborted."
    exit 1
fi

echo -e "\n${GREEN}[1/5] Quitting Docker Desktop...${NC}"
osascript -e 'quit app "Docker"'
sleep 5

echo -e "\n${GREEN}[2/5] Removing Docker data...${NC}"
rm -rf ~/Library/Containers/com.docker.docker/Data/vms/*
rm -rf ~/Library/Containers/com.docker.docker/Data/database/*
rm -rf ~/.docker/cli-plugins/docker-compose-cache

echo -e "\n${GREEN}[3/5] Starting Docker Desktop...${NC}"
open -a Docker
echo "Waiting for Docker to start (this may take 60 seconds)..."
sleep 10

# Wait for Docker to be ready
timeout=60
while ! docker info >/dev/null 2>&1; do
    if [ $timeout -le 0 ]; then
        echo -e "${RED}Docker failed to start. Please start it manually from Applications.${NC}"
        exit 1
    fi
    sleep 2
    echo -n "."
    timeout=$((timeout - 2))
done

echo -e "\n${GREEN}[4/5] Verifying Docker is clean...${NC}"
docker ps -a
echo ""
docker images
echo ""

echo -e "\n${GREEN}[5/5] Docker Desktop has been reset!${NC}"
echo -e "${YELLOW}You can now run: ./start-yadmanx.sh${NC}\n"
