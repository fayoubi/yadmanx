# YadmanX Project Guidelines

This document contains important project standards and guidelines that must be followed across all development work.

---

## API Documentation Standards

### Postman Collections

**RULE: All endpoints from all services must always be included in the Postman collections.**

#### Requirements:
1. **Complete Coverage**: Every API endpoint must be documented in the appropriate Postman collection
2. **All Services**: This applies to ALL services in the project:
   - Agent Service (port 3003)
   - Enrollment Service (port 3002)
   - Pricing Service (port 3001)
   - LLM Service (port 3004)
   - Any future services

3. **Collection Organization**:
   - Group endpoints by service
   - Include authentication requirements
   - Add comprehensive test scripts
   - Document expected responses
   - Include usage examples

4. **Maintenance**:
   - When adding a new endpoint, add it to Postman collection immediately
   - When modifying an endpoint, update the Postman collection
   - Keep environment variables up to date

#### Current Collections:
- `/postman/enrollment-service.postman_collection.json` - Main collection covering Agent and Enrollment services
- `/postman/enrollment-service.postman_environment.json` - Environment variables

#### Example Endpoints That Must Be Documented:
- ✅ `GET /api/v1/agents/me` - Recently added to collection
- ✅ `POST /api/v1/auth/verify-otp` - Already in collection
- ✅ `GET /api/v1/enrollments` - Already in collection
- ⚠️ Any new endpoint must be added immediately

---

## Frontend Development Standards

### Agent Authentication
- All authenticated API calls must use Bearer JWT tokens from `AgentAuthContext`
- Token storage: `localStorage` with key `agent_token`
- Agent data storage: `localStorage` with key `agent_data`

### State Management
- Use React Context for global state (authentication, agent data)
- Use component-level state for UI-specific data
- Session storage keys:
  - `current_enrollment_id` - Active enrollment ID
  - `agent_id` - Agent ID (legacy, prefer using context)

---

## Backend Service Standards

### Port Allocation
- Agent Service: `3003`
- Enrollment Service: `3002`
- Pricing Service: `3001`
- LLM Service: `3004`

### API Versioning
- All APIs use `/api/v1/` prefix
- Version must be included in all endpoint paths

---

## Testing Standards

### Postman Test Requirements
Each endpoint should include:
1. Status code validation
2. Response structure validation
3. Data type validation
4. Auto-save important values to environment (tokens, IDs)
5. Success/error logging

---

## Documentation Updates

When making changes:
1. Update Postman collections
2. Update relevant code comments
3. Update this guidelines document if adding new standards
4. Keep README.md current

---

**Last Updated**: 2026-01-05
**Maintained By**: Development Team
