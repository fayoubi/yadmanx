# YadmanX Postman Collection Summary

## Files Created

1. **YadmanX_Complete_API.postman_collection.json** - Main collection file
2. **YadmanX.postman_environment.json** - Environment variables
3. **POSTMAN_COLLECTION_README.md** - Complete usage guide
4. **COLLECTION_SUMMARY.md** - This summary

## Collection Structure

### Agent Service (14 endpoints)
- ✅ Health Check
- ✅ Service Info
- ✅ Register Agent (with auto-save OTP)
- ✅ Request OTP
- ✅ Verify OTP & Login (with auto-save token)
- ✅ Refresh Token
- ✅ Logout
- ✅ Validate Token
- ✅ Get My Profile
- ✅ Update My Profile
- ✅ Get My Enrollments
- ✅ Get Enrollment By ID
- ✅ **[NEW]** Sync All Agents (Admin endpoint with JWT auth)

### Enrollment Service (7 endpoints)
- ✅ Health Check
- ✅ Initialize Enrollment (with auto-save IDs)
- ✅ List Enrollments
- ✅ Get Enrollment By ID
- ✅ Update Enrollment
- ✅ Delete Enrollment
- ✅ **Sync Agent from Agent Service** (internal endpoint)

### Pricing Service (6 endpoints)
- ✅ Health Check
- ✅ Calculate Quote (with auto-save quote ID)
- ✅ Get Quote By ID
- ✅ Get Available Products
- ✅ Get Product Configuration
- ✅ Validate Contribution

### LLM Quote Service (5 endpoints)
- ✅ Health Check
- ✅ Create Conversation (with auto-save session ID)
- ✅ Send Message
- ✅ Get Summary
- ✅ Confirm and Calculate Quote

## Total: 32 Endpoints Across 4 Services

## Key Features

### 1. Auto-Save Test Scripts
Automatically saves tokens, IDs, and session data to environment variables:
- `authToken` - JWT token from login
- `agentId` - Agent UUID
- `enrollmentId` - Enrollment UUID
- `subscriberId` - Subscriber UUID
- `quoteId` - Quote UUID
- `sessionId` - LLM conversation session ID
- `otpCode` - OTP verification code
- `phoneNumber` - Agent phone number

### 2. Organized Structure
- Grouped by service
- Sub-grouped by functionality
- Clear descriptions for each endpoint
- Documented request/response formats

### 3. Environment Variables
Pre-configured with localhost URLs:
- Agent Service: http://localhost:3003
- Enrollment Service: http://localhost:3002
- Pricing Service: http://localhost:3001
- LLM Service: http://localhost:3004

### 4. Authentication Flow
Complete workflow support:
1. Register → Auto-saves OTP code
2. Verify OTP → Auto-saves JWT token
3. Protected endpoints → Automatically use token

### 5. New Endpoints Added

#### Admin Batch Sync
**POST** `/api/v1/admin/sync-all-agents`
- Syncs all agents from agent-service to enrollment-service
- Requires JWT authentication
- Returns detailed stats (total, synced, failed)

#### Agent Sync (Internal)
**POST** `/api/v1/agents/sync`
- Internal endpoint for single agent sync
- Called automatically by agent-service
- No authentication required (internal use)

## Usage Instructions

1. Import both files into Postman
2. Select "YadmanX Development Environment"
3. Run health checks to verify services
4. Follow authentication flow (Register → Verify OTP)
5. Test other endpoints with auto-saved token

## Service Dependencies

```
Agent Service (3003)
    ↓ syncs to
Enrollment Service (3002)
    ↓ creates
Customer/Enrollment Data

Pricing Service (3001)
    ↓ calculates
Quote Data
    ↑ used by
LLM Quote Service (3004)
```

## Verification

All services tested and confirmed healthy:
- ✅ Agent Service responding
- ✅ Enrollment Service responding
- ✅ Pricing Service responding
- ✅ LLM Quote Service responding

