# Docker Configuration Fixes - YadmanX

## Issues Fixed

### 1. Deprecated Docker Compose Version Field
**Problem**: Docker Compose was showing warning about obsolete `version` field
```
WARN[0000] docker-compose.yml: the attribute `version` is obsolete
```

**Fix**: Removed `version: '3.8'` from [docker-compose.yml](docker-compose.yml:1)

---

### 2. Phantom Container References
**Problem**: Ghost container `f9c66100f13e` was causing errors:
```
Error response from daemon: No such container: f9c66100f13ec1e001ee11518dfbdaf8d898a7896e0a1bc34f78665260038734
```

**Root Cause**: Inconsistent container naming - only `agent-db` had explicit `container_name`, causing Docker to create auto-generated names

**Fix**: Added explicit `container_name` to ALL services for consistency:

| Service | Container Name |
|---------|---------------|
| pricing-service | yadmanx-pricing-service |
| pricing-db | yadmanx-pricing-db |
| pricing-redis | yadmanx-pricing-redis |
| enrollment-service | yadmanx-enrollment-service |
| enrollment-db | yadmanx-enrollment-db |
| agent-service | yadmanx-agent-service |
| agent-db | yadmanx-agent-db |
| llm-quote-service | yadmanx-llm-quote-service |
| llm-quote-redis | yadmanx-llm-quote-redis |
| pgadmin | yadmanx-pgadmin |

---

### 3. Start Script Reliability Issues
**Problem**: Script was failing on first error due to `set -e` flag

**Fixes Applied to [start-yadmanx.sh](start-yadmanx.sh)**:
1. Removed `set -e` for better error handling
2. Added explicit error checking with conditionals
3. Added orphan container cleanup steps
4. Updated to 6-step process:
   - Step 1: Clean up orphaned containers
   - Step 2: Remove dangling containers
   - Step 3: Check for and kill port conflicts (3001-3004)
   - Step 4: Start services with `--remove-orphans`
   - Step 5: Wait for services to be ready
   - Step 6: Start frontend

---

### 4. Port Conflicts with Running Processes
**Problem**: Node processes from previous manual starts were blocking ports 3002 and 3003, preventing Docker containers from binding to those ports:
```
Error: ports are not available: exposing port TCP 0.0.0.0:3002 -> 127.0.0.1:0: listen tcp 0.0.0.0:3002: bind: address already in use
```

**Fix**: Added automatic port conflict detection and resolution in step 3 of [start-yadmanx.sh](start-yadmanx.sh)
- Checks ports 3001-3004 for existing processes
- Automatically kills conflicting processes before starting Docker services
- Displays warning messages when killing processes

---

## New Cleanup Script

Created [cleanup-docker.sh](cleanup-docker.sh) for thorough Docker cleanup:

```bash
./cleanup-docker.sh
```

**What it does:**
1. Stops all YadmanX containers
2. Removes stopped containers
3. Removes phantom/orphaned containers
4. Removes dangling images
5. Removes unused networks
6. Shows current state

---

## How to Use

### Fresh Start (Recommended)
```bash
# 1. Clean everything
./cleanup-docker.sh

# 2. Start all services
./start-yadmanx.sh
```

### Manual Docker Commands
```bash
# Clean shutdown
docker-compose down --remove-orphans

# Start services
docker-compose up -d --remove-orphans

# Check status
docker-compose ps
docker ps
```

### Troubleshooting

**If you see phantom container errors:**
```bash
./cleanup-docker.sh
docker system prune -a -f
docker-compose up -d --remove-orphans
```

**Check service logs:**
```bash
docker-compose logs -f [service-name]
# Examples:
docker-compose logs -f agent-service
docker-compose logs -f enrollment-service
```

**Restart a specific service:**
```bash
docker-compose restart [service-name]
```

---

## Verified Services

All services now start reliably with consistent naming:

- ✅ Pricing Service (port 3001)
- ✅ Enrollment Service (port 3002)
- ✅ Agent Service (port 3003)
- ✅ LLM Quote Service (port 3004)
- ✅ PostgreSQL databases (ports 5432, 5433, 5434)
- ✅ Redis instances (ports 6379, 6380)
- ✅ pgAdmin (port 5050)

---

## Changes Summary

### Files Modified:
1. **docker-compose.yml**
   - Removed `version` field
   - Added `container_name` to all 10 services

2. **start-yadmanx.sh**
   - Removed `set -e`
   - Added cleanup steps
   - Better error handling
   - Updated to 5-step process

3. **cleanup-docker.sh** (NEW)
   - Complete Docker cleanup utility
   - Safe to run anytime
   - Shows current state after cleanup

### Commands Updated:
- All `docker-compose` commands now use `--remove-orphans` flag
- Cleanup function enhanced in start script
- Better error messages and recovery suggestions

---

**Last Updated**: 2026-01-05
**Tested On**: Docker Desktop for Mac
