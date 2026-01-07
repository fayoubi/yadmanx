# YadmanX Complete API Collection - Postman Guide

## Overview

This comprehensive Postman collection includes all YadmanX microservices endpoints for easy testing and integration.

## Files

- **YadmanX_Complete_API.postman_collection.json** - Complete collection with all services
- **YadmanX.postman_environment.json** - Environment variables for development

## Services Included

### 1. Agent Service (Port 3003)
- **Authentication**: Register, OTP login, token management
- **Profile Management**: Get/update agent profile
- **Enrollments**: View agent's enrollments
- **Admin Operations**: Batch sync agents to enrollment service

### 2. Enrollment Service (Port 3002)
- **Enrollments**: Initialize, list, update, delete enrollments
- **Customer Management**: Subscriber and insured data
- **Agent Sync**: Internal endpoint for agent synchronization

### 3. Pricing Service (Port 3001)
- **Quotes**: Calculate quotes, retrieve quote details
- **Products**: List products, get product configurations
- **Contributions**: Validate contribution amounts

### 4. LLM Quote Service (Port 3004)
- **Conversations**: AI-powered conversational quote generation
- **Data Extraction**: Extract customer information from natural language
- **Quote Integration**: Confirm and calculate quotes via pricing service

## Quick Start

### 1. Import Collection

1. Open Postman
2. Click **Import** button
3. Select **YadmanX_Complete_API.postman_collection.json**
4. Select **YadmanX.postman_environment.json**

### 2. Set Environment

1. Click the environment dropdown (top right)
2. Select **YadmanX Development Environment**
3. Verify base URLs are correct:
   - Agent Service: `http://localhost:3003`
   - Enrollment Service: `http://localhost:3002`
   - Pricing Service: `http://localhost:3001`
   - LLM Service: `http://localhost:3004`

### 3. Test Services Health

Run the health check endpoints to verify all services are running:
- Agent Service → Health & Info → Health Check
- Enrollment Service → Health & Info → Health Check
- Pricing Service → Health & Info → Health Check
- LLM Quote Service → Health & Info → Health Check

## Authentication Flow

### Register and Login Workflow

1. **Register Agent** (`POST /api/v1/auth/register`)
   - Creates new agent account
   - Returns OTP code (in development mode)
   - Auto-saves `otpCode`, `phoneNumber`, `agentId` to environment

2. **Verify OTP** (`POST /api/v1/auth/verify-otp`)
   - Verifies OTP and logs in
   - Returns JWT token
   - Auto-saves `authToken` to environment

3. **Use Token**
   - All protected endpoints use: `Authorization: Bearer {{authToken}}`
   - Token is automatically applied from environment variable

### Alternative: Request OTP for Existing Agent

If agent already exists, use:
1. **Request OTP** (`POST /api/v1/auth/request-otp`)
2. **Verify OTP** (same as above)

## Common Workflows

### Complete Enrollment Flow

1. **Register/Login Agent** (Agent Service)
2. **Initialize Enrollment** (`POST /api/v1/enrollments/initialize`)
   - Creates customer records
   - Creates enrollment
   - Auto-saves `enrollmentId` and `subscriberId`
3. **Update Enrollment** (`PUT /api/v1/enrollments/:id`)
   - Add product selection, beneficiaries, etc.
4. **Get Enrollments** (`GET /api/v1/enrollments`)
   - View all enrollments for agent

### Quote Calculation Flow

1. **Get Available Products** (`GET /api/v1/products`)
2. **Calculate Quote** (`POST /api/v1/quotes/calculate`)
   - Provide customer data and options
   - Auto-saves `quoteId`
3. **Get Quote Details** (`GET /api/v1/quotes/:quoteId`)

### LLM Conversation Flow

1. **Create Conversation** (`POST /api/v1/conversations`)
   - Auto-saves `sessionId`
2. **Send Messages** (`POST /api/v1/conversations/:sessionId/message`)
   - Natural language interaction
3. **Get Summary** (`GET /api/v1/conversations/:sessionId/summary`)
   - View extracted data
4. **Confirm & Calculate** (`POST /api/v1/conversations/:sessionId/confirm`)
   - Trigger quote calculation

## Environment Variables

The collection uses these environment variables (auto-populated by test scripts):

| Variable | Description | Auto-populated |
|----------|-------------|----------------|
| `agent_base_url` | Agent service URL | No |
| `enrollment_base_url` | Enrollment service URL | No |
| `pricing_base_url` | Pricing service URL | No |
| `llm_base_url` | LLM service URL | No |
| `authToken` | JWT authentication token | Yes |
| `phoneNumber` | Agent phone number | Yes |
| `otpCode` | OTP verification code | Yes |
| `agentId` | Agent UUID | Yes |
| `enrollmentId` | Enrollment UUID | Yes |
| `subscriberId` | Subscriber UUID | Yes |
| `quoteId` | Quote UUID | Yes |
| `sessionId` | LLM conversation session ID | Yes |

## Admin Operations

### Batch Sync All Agents

**Endpoint**: `POST /api/v1/admin/sync-all-agents`

Synchronizes all agents from agent-service database to enrollment-service database.

**Requirements**:
- Valid JWT token (must be logged in as agent)
- Agent service authentication

**Use Cases**:
- Initial data migration
- Recovery after database issues
- Ensuring data consistency

**Example Response**:
```json
{
  "success": true,
  "message": "Synced 6 of 6 agents",
  "stats": {
    "total": 6,
    "synced": 6,
    "failed": 0
  }
}
```

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Pricing Service | 3001 | Quote calculations and product configs |
| Enrollment Service | 3002 | Enrollment and customer management |
| Agent Service | 3003 | Agent authentication and profile |
| LLM Quote Service | 3004 | AI-powered conversational quotes |

## Testing Tips

### 1. Use Folders for Organization
The collection is organized by service and functionality. Execute entire folders to test related endpoints.

### 2. Check Test Scripts
Many requests include test scripts that automatically save response data to environment variables. Check the **Tests** tab.

### 3. Monitor Environment Variables
Open the environment editor to see variables being updated as you run requests.

### 4. Use Collection Variables
Collection-level variables are set for base URLs. Update these if testing against different environments.

### 5. Sequential Execution
Some endpoints depend on previous requests (e.g., login before accessing protected endpoints). Use **Run Collection** to execute in order.

## Troubleshooting

### "Invalid token" Error

**Cause**: Token expired or JWT_SECRET mismatch

**Solution**:
1. Request new OTP: `POST /api/v1/auth/request-otp`
2. Verify OTP: `POST /api/v1/auth/verify-otp`
3. New token will be saved to environment

### "Agent not found" in Enrollment Service

**Cause**: Agent exists in agent-service but not in enrollment-service database

**Solution**:
1. Use batch sync: `POST /api/v1/admin/sync-all-agents`
2. Or wait for automatic sync (happens on next login)

### Service Not Responding

**Cause**: Docker container not running

**Solution**:
```bash
cd /path/to/yadmanx
docker-compose up -d
```

Check health endpoints to verify services are running.

## API Documentation

Each service provides interactive API documentation:

- **Agent Service**: http://localhost:3003/api/docs/
- **Enrollment Service**: http://localhost:3002/api/docs/
- **Pricing Service**: http://localhost:3001/api/docs/

## Development Notes

### Auto-save Test Scripts

Many requests include Post-response test scripts that automatically extract IDs and tokens:

```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.data && response.data.token) {
        pm.environment.set('authToken', response.data.token);
    }
}
```

### Rate Limiting

Some endpoints have rate limiting enabled:
- Pricing Service: Quote calculations
- LLM Service: Message sending

If you hit rate limits, wait a few seconds before retrying.

### Development vs Production

This collection is configured for local development. For production:
1. Update base URLs in environment
2. Ensure HTTPS is used
3. Update JWT_SECRET and other secrets
4. Enable proper authentication for admin endpoints

## Support

For issues or questions:
1. Check service logs: `docker logs yadmanx-[service-name]`
2. Verify environment variables in docker-compose.yml
3. Review API documentation for each service

## Version History

- **v1.0** (2026-01-05): Initial comprehensive collection with all 4 services
  - Agent Service authentication and profile management
  - Enrollment Service with customer management
  - Pricing Service with quote calculations
  - LLM Quote Service with conversational AI
  - Admin operations including batch agent sync
