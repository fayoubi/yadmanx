# YadmanX Enrollment Service - Postman Collection

Complete API testing collection for the YadmanX Enrollment Service v2. This collection includes all CRUD operations, validation tests, and subscriber/insured scenario testing.

## Table of Contents

- [Quick Start](#quick-start)
- [Collection Overview](#collection-overview)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [Request Folders](#request-folders)
- [Running Tests](#running-tests)
- [Expected Test Flow](#expected-test-flow)
- [Troubleshooting](#troubleshooting)

## Quick Start

1. **Import the collection and environment**:
   - Open Postman
   - Click "Import" button
   - Select both files:
     - `enrollment-service.postman_collection.json`
     - `enrollment-service.postman_environment.json`

2. **Select the environment**:
   - In the top-right corner, select "YadmanX - Enrollment Service (Local)" from the environment dropdown

3. **Get a JWT token** (see [Authentication](#authentication) section below)

4. **Add your JWT token**:
   - Click the environment quick look (eye icon)
   - Click "Edit" next to "YadmanX - Enrollment Service (Local)"
   - Paste your JWT token into the `jwt_token` variable
   - Click "Save"

5. **Start testing**:
   - Navigate to "2. Enrollment CRUD - Happy Path" folder
   - Run "Create New Enrollment" request
   - Continue with other requests

## Collection Overview

### What's Included

- **27 API requests** organized in 4 folders
- **Automated tests** for response validation
- **Auto-extraction** of enrollment IDs between requests
- **Complete data samples** with realistic Moroccan customer data
- **Error handling tests** for authentication and validation
- **Subscriber vs Insured scenarios** testing the dual-customer architecture

### Folders

1. **Setup & Health** - Service health check
2. **Enrollment CRUD - Happy Path** - All main endpoints with comprehensive data
3. **Validation & Error Tests** - Authentication failures, invalid data, missing fields
4. **Subscriber vs Insured Scenarios** - Step-by-step testing of customer relationship logic

## Setup Instructions

### Prerequisites

- Postman desktop app or web version
- YadmanX enrollment service running on `http://localhost:3002`
- YadmanX agent service running on `http://localhost:3003` (for JWT token generation)
- PostgreSQL database initialized with v2 schema

### Installation

1. **Start the services**:
   ```bash
   # Terminal 1 - Start enrollment service
   cd enrollment-service
   npm start

   # Terminal 2 - Start agent service (for authentication)
   cd agent-service
   npm start
   ```

2. **Verify services are running**:
   - Enrollment service: http://localhost:3002/health
   - Agent service: http://localhost:3003/health

3. **Import collection**:
   - Drag and drop both JSON files into Postman
   - OR use File → Import → Select Files

4. **Configure environment** (see [Environment Variables](#environment-variables))

## Environment Variables

The collection uses these environment variables:

| Variable | Default Value | Description | Auto-Populated |
|----------|--------------|-------------|----------------|
| `base_url` | `http://localhost:3002` | Enrollment service base URL | No |
| `api_version` | `v1` | API version | No |
| `jwt_token` | *(empty)* | JWT bearer token from agent auth | **No - You must set this** |
| `agent_id` | `a7c65d2e-3e72-4702-b5ba-3a8f593847ea` | Agent UUID (customizable) | No |
| `enrollment_id` | *(empty)* | Current enrollment being tested | Yes (from create requests) |
| `scenario_enrollment_id` | *(empty)* | Enrollment ID for scenario tests | Yes (from scenario folder) |
| `test_subscriber_cin` | `BK123456789` | Test subscriber CIN for validation | No |
| `test_insured_cin` | `BK987654321` | Test insured CIN for validation | No |

### Changing the Agent ID

To test with a different agent:

1. Click the environment quick look (eye icon)
2. Click "Edit"
3. Change the `agent_id` value
4. Save
5. Get a new JWT token for that agent

## Authentication

The enrollment service requires JWT authentication for all endpoints (except health check).

### Option 1: Manual Token Entry (Recommended for Testing)

#### Step 1: Get Agent Credentials

You'll need valid agent credentials from your database. Example query:

```sql
-- Get an active agent's credentials
SELECT id, phone_number, email, first_name, last_name
FROM agents
WHERE status = 'active'
LIMIT 1;
```

#### Step 2: Request OTP

**Important**: The agent service has OTP verification. For testing, you can:

- Check your database for the OTP code that was generated
- Use a test agent account with a known phone number
- Temporarily modify the agent service to log OTP codes

Example query to find the OTP:
```sql
-- Find recent OTP for an agent
SELECT code, expires_at
FROM otp_codes
WHERE phone_number = '+212612345678'
  AND expires_at > NOW()
ORDER BY created_at DESC
LIMIT 1;
```

#### Step 3: Verify OTP and Get JWT Token

Use any HTTP client to get a token:

```bash
# Send OTP request (manual step - check your phone/database for the code)
curl -X POST http://localhost:3003/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+212612345678"}'

# Verify OTP and get token
curl -X POST http://localhost:3003/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+212612345678",
    "code": "123456"
  }'
```

Response will include:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "agent": { ... }
}
```

#### Step 4: Add Token to Postman

1. Copy the `token` value from the response
2. Open Postman environment settings (eye icon → Edit)
3. Paste into `jwt_token` variable (set as "secret" type)
4. Save

**Token expires after 24 hours** - you'll need to regenerate it daily.

### Option 2: Use Development Fallback (x-agent-id header)

If your enrollment service is in development mode, it may accept `x-agent-id` header as a fallback:

1. Edit any request
2. Add header: `x-agent-id: a7c65d2e-3e72-4702-b5ba-3a8f593847ea`
3. Remove the JWT token requirement

**Warning**: This only works if the auth middleware has the fallback enabled. Not recommended for production.

## Request Folders

### 1. Setup & Health

**Health Check**
- Simple GET request to verify service is running
- No authentication required
- Should return 200 OK

### 2. Enrollment CRUD - Happy Path

Complete workflow for enrollment lifecycle:

1. **Create New Enrollment**
   - Creates empty enrollment
   - Auto-saves `enrollment_id` for subsequent requests
   - Returns: `201 Created`

2. **List All Enrollments**
   - Retrieves all enrollments for the authenticated agent
   - Supports pagination (`limit`, `offset`)
   - Returns: Customer summary view with masked CIN

3. **Get Single Enrollment**
   - Full enrollment details including subscriber, insured, data
   - Uses `{{enrollment_id}}` from previous create
   - Returns: Complete enrollment object

4. **Update Enrollment - Subscriber Only**
   - Complete update with `insuredSameAsSubscriber = true`
   - Tests subscriber data persistence to customers table
   - Tests contribution and beneficiaries storage in JSONB
   - Validates that `insured_id` remains NULL

5. **Update Enrollment - Separate Insured**
   - Updates with different subscriber and insured
   - Tests that both customer records are created
   - Validates both `subscriber_id` and `insured_id` are populated
   - Tests the dual-customer architecture

6. **Delete Enrollment**
   - Soft deletes enrollment (sets `deleted_at`)
   - Enrollment becomes unavailable for queries
   - Customer records remain intact

### 3. Validation & Error Tests

Tests for error handling and edge cases:

1. **Access Without JWT Token (401)**
   - Removes auth header
   - Should return `401 Unauthorized`
   - Tests authentication middleware

2. **Get Non-Existent Enrollment (404)**
   - Requests enrollment with UUID `00000000-0000-0000-0000-000000000000`
   - Should return `404 Not Found`
   - Tests error handling for missing records

3. **Update with Invalid Email Format**
   - Sends malformed email address
   - Tests email validation (if implemented)

4. **Update with Invalid Date Format**
   - Sends date in wrong format (e.g., `32/13/9999`)
   - Tests date validation

5. **Update with Missing Required CIN**
   - Omits `idNumber` field
   - Tests required field validation

**Note**: Validation behavior depends on backend implementation. Some tests may pass if validation is not enforced server-side.

### 4. Subscriber vs Insured Scenarios

Step-by-step workflow testing the subscriber/insured logic:

1. **Scenario 1: Create Enrollment**
   - Creates new enrollment
   - Saves `scenario_enrollment_id`

2. **Scenario 2: Update with Subscriber = Insured**
   - Sets `insuredSameAsSubscriber = true`
   - Verifies only subscriber record is created
   - Checks `insured_id` is NULL

3. **Scenario 3: Verify Subscriber Data**
   - Retrieves enrollment
   - Confirms subscriber data persisted correctly
   - Confirms no insured record exists

4. **Scenario 4: Update to Separate Insured**
   - Changes to `insuredSameAsSubscriber = false`
   - Adds insured customer with different CIN
   - Both records should be created/linked

5. **Scenario 5: Verify Both Records**
   - Final verification
   - Both subscriber and insured should exist
   - IDs should be different
   - Data should be intact

## Running Tests

### Individual Request

1. Select a request
2. Click "Send"
3. View response in the bottom panel
4. Check "Test Results" tab for automated test results

### Folder (Collection Runner)

1. Click the folder name (e.g., "2. Enrollment CRUD - Happy Path")
2. Click "Run" button
3. In Collection Runner:
   - Ensure environment is selected
   - Click "Run YadmanX - Enrollment..."
4. View results for all requests in sequence

### Entire Collection

1. Click collection name at the top
2. Click "Run"
3. Select which folders to run
4. Click "Run YadmanX - Enrollment..."

**Recommended order**:
1. Setup & Health (verify service is up)
2. Enrollment CRUD - Happy Path (standard workflow)
3. Subscriber vs Insured Scenarios (specific test cases)
4. Validation & Error Tests (edge cases - can run anytime)

## Expected Test Flow

### Typical Testing Workflow

```
1. Start services
2. Get JWT token
3. Add token to environment
4. Health Check → Should pass
5. Create New Enrollment → enrollment_id saved
6. Update Enrollment - Subscriber Only → Test all data persists
7. Get Single Enrollment → Verify all fields saved correctly
8. List All Enrollments → Verify enrollment appears in list
9. Update to Separate Insured → Test dual-customer logic
10. Get Single Enrollment → Verify both customers exist
11. Run error tests → Verify proper error handling
```

### What to Check After Each Update

After running "Update Enrollment" requests, verify:

✅ **Subscriber Data** (in customers table):
- `first_name`, `last_name`, `email`, `phone`
- `cin` (unique identifier)
- `date_of_birth`, `birth_place`
- `address`, `city`, `country`, `nationality`
- `occupation`, `marital_status`, `number_of_children`
- `us_citizen`, `tin`

✅ **Insured Data** (separate customer record if `insuredSameAsSubscriber = false`):
- Same fields as subscriber
- Different CIN
- Linked via `insured_id` in enrollments table

✅ **JSONB Data** (in enrollments.data column):
- `personalInfo.insuredSameAsSubscriber` flag
- `contribution` object (amount, origin of funds, payment mode)
- `beneficiaries` array (names, relationships, percentages)

✅ **Response Structure**:
- Success flag
- HTTP status codes (200, 201, 404, 401)
- Proper error messages

## Troubleshooting

### Problem: 401 Unauthorized on all requests

**Solution**:
1. Verify `jwt_token` is set in environment variables
2. Check token hasn't expired (24-hour lifetime)
3. Verify token format: Should be long string starting with `eyJ...`
4. Generate a new token if needed

### Problem: 404 Not Found for existing enrollment

**Solution**:
1. Check `enrollment_id` environment variable is set
2. Verify enrollment exists: Run "List All Enrollments"
3. Ensure you're using the correct agent (enrollments are agent-scoped)
4. Check enrollment wasn't soft-deleted

### Problem: Tests failing for "Update Enrollment" requests

**Solution**:
1. First run "Create New Enrollment" to get a valid `enrollment_id`
2. Check request body JSON is valid
3. Verify required fields are present (`idNumber`, `firstName`, `lastName`)
4. Check database constraints (e.g., unique CIN violations)

### Problem: "Get Single Enrollment" returns different data than expected

**Possible causes**:
1. Request ran with a different `enrollment_id`
2. Enrollment was updated by another request
3. Database state was manually modified
4. Check "Tests" tab to see which specific assertions failed

### Problem: Collection Runner skips requests

**Solution**:
1. Ensure environment is selected in Collection Runner
2. Check if previous requests failed (dependencies may cause skips)
3. Verify all required environment variables are set
4. Look at console logs for JavaScript errors in test scripts

### Problem: Cannot connect to service (Connection Error)

**Solution**:
1. Verify services are running:
   ```bash
   curl http://localhost:3002/health
   curl http://localhost:3003/health
   ```
2. Check `base_url` in environment matches your setup
3. Verify no firewall blocking localhost connections
4. Check service logs for errors

### Problem: Beneficiary percentages validation

**Note**: If beneficiary percentages don't total 100%, the API may:
- Accept it anyway (if validation not implemented)
- Return 400/422 error (if validation is strict)

Check backend validation rules if this behavior is unexpected.

### Problem: Date format issues

The API expects dates in `YYYY-MM-DD` format (ISO 8601). If you see date-related errors:
- Ensure format is correct in request body
- Check timezone considerations
- Verify date is valid (no Feb 30, etc.)

## Advanced Usage

### Custom Agent Testing

To test with a specific agent ID:

1. Update `agent_id` in environment
2. Get a JWT token for that specific agent
3. Update `jwt_token` in environment
4. Run collection

### Database Verification

After running tests, verify data in PostgreSQL:

```sql
-- Check enrollment was created
SELECT * FROM enrollments WHERE id = 'your-enrollment-id';

-- Check subscriber customer record
SELECT * FROM customers WHERE id = (
  SELECT subscriber_id FROM enrollments WHERE id = 'your-enrollment-id'
);

-- Check insured customer record (if separate)
SELECT * FROM customers WHERE id = (
  SELECT insured_id FROM enrollments WHERE id = 'your-enrollment-id'
);

-- View JSONB data structure
SELECT data FROM enrollments WHERE id = 'your-enrollment-id';
```

### Extending the Collection

To add new requests:

1. Right-click folder → Add Request
2. Configure URL: `{{base_url}}/api/{{api_version}}/your-endpoint`
3. Set method (GET, POST, PUT, DELETE)
4. Add test scripts in "Tests" tab
5. Save

Example test script:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('data');
});
```

## Additional Resources

- **Enrollment Service Code**: `/enrollment-service/src/`
- **API Routes**: `/enrollment-service/src/routes/enrollment.routes.v2.js`
- **Controller Logic**: `/enrollment-service/src/controllers/enrollment.controller.v2.js`
- **Database Schema**: `/enrollment-service/database/init-v2-clean.sql`
- **Integration Tests**: `/enrollment-service/tests/integration/enrollment.test.js`

## Support

If you encounter issues:

1. Check service logs for detailed error messages
2. Verify database schema is up to date
3. Review Postman console (View → Show Postman Console) for request/response details
4. Check environment variables are correctly set
5. Ensure services are running on expected ports

## Version History

- **v2.0.0** (2026-01-02): Initial comprehensive collection with 27 requests
  - Full CRUD coverage
  - Subscriber/insured scenario testing
  - Validation and error handling tests
  - Automated test scripts
  - Environment variable support
