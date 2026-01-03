# Story: Implement Enrollment Service

## Overview
Create a new `enrollment-service` following the exact patterns established in `pricing-service`. This service will handle the enrollment workflow for yadmanx, including customer management, enrollment tracking, billing data (encrypted), beneficiaries, and dynamic step data.

## Goals
- Create enrollment-service running on port 3002
- Implement all enrollment-related endpoints
- Follow pricing-service patterns exactly (Express, PostgreSQL, raw SQL, error handling, documentation)
- Include comprehensive tests
- Seed database with 10+ sample enrollments
- Add service to root docker-compose.yml
- Document all endpoints at http://localhost:3002/api/docs/

## Technical Requirements

### Service Structure
```
enrollment-service/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   └── enrollment.routes.js
│   ├── controllers/
│   │   └── enrollment.controller.js
│   ├── services/
│   │   ├── enrollment.service.js
│   │   ├── customer.service.js
│   │   ├── billing.service.js
│   │   ├── beneficiary.service.js
│   │   ├── stepData.service.js
│   │   └── encryption.service.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── auth.middleware.js (stubbed)
│   ├── utils/
│   │   └── validators.js
│   └── app.js
├── db/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seeds/
│       └── 001_sample_data.sql
├── tests/
│   ├── integration/
│   │   └── enrollment.test.js
│   └── unit/
│       └── services/
│           ├── enrollment.service.test.js
│           ├── customer.service.test.js
│           ├── billing.service.test.js
│           └── encryption.service.test.js
├── docs/
│   └── api.md
├── Dockerfile
├── docker-compose.yml (for local dev)
├── .env.example
├── .dockerignore
├── package.json
└── README.md
```

## Database Schema

### Tables to Create (Raw SQL)

```sql
-- customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cin VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  date_of_birth DATE NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_cin ON customers(cin);
CREATE INDEX idx_customers_name ON customers(last_name, first_name);

-- agents
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  license_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- enrollments
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  plan_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  effective_date DATE,
  current_step VARCHAR(100),
  completed_steps JSONB DEFAULT '[]',
  session_data JSONB DEFAULT '{}',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_enrollments_customer ON enrollments(customer_id);
CREATE INDEX idx_enrollments_agent ON enrollments(agent_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_agent_status ON enrollments(agent_id, status);

-- billing_data
CREATE TABLE billing_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID UNIQUE NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  contribution_amount DECIMAL(10, 2) NOT NULL,
  contribution_frequency VARCHAR(20) NOT NULL,
  payment_method_type VARCHAR(50) NOT NULL,
  payment_method_last_four VARCHAR(4),
  payment_method_expiry VARCHAR(7),
  encrypted_payment_data TEXT,
  encryption_key_id VARCHAR(100),
  effective_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- beneficiaries
CREATE TABLE beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  relationship VARCHAR(50) NOT NULL,
  percentage INTEGER NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  date_of_birth DATE NOT NULL,
  encrypted_ssn TEXT,
  address JSONB,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_beneficiaries_enrollment ON beneficiaries(enrollment_id);

-- enrollment_step_data
CREATE TABLE enrollment_step_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  step_id VARCHAR(100) NOT NULL,
  step_data JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(enrollment_id, step_id)
);

CREATE INDEX idx_step_data_enrollment ON enrollment_step_data(enrollment_id);

-- enrollment_audit_log
CREATE TABLE enrollment_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id),
  agent_id UUID NOT NULL REFERENCES agents(id),
  action VARCHAR(100) NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_enrollment ON enrollment_audit_log(enrollment_id);
```

## API Endpoints to Implement

### Enrollment Management
1. `POST /api/v1/enrollments` - Create new enrollment
2. `GET /api/v1/enrollments/:id` - Get enrollment details
3. `GET /api/v1/enrollments` - List enrollments with filters (agentId, status, customerId)
4. `PATCH /api/v1/enrollments/:id/status` - Update enrollment status
5. `DELETE /api/v1/enrollments/:id` - Cancel enrollment

### Billing
6. `POST /api/v1/enrollments/:id/billing` - Save billing data (with encryption)
7. `GET /api/v1/enrollments/:id/billing` - Get billing data (masked)

### Beneficiaries
8. `POST /api/v1/enrollments/:id/beneficiaries` - Add beneficiaries
9. `GET /api/v1/enrollments/:id/beneficiaries` - Get beneficiaries
10. `PUT /api/v1/enrollments/:id/beneficiaries/:beneficiaryId` - Update beneficiary
11. `DELETE /api/v1/enrollments/:id/beneficiaries/:beneficiaryId` - Remove beneficiary

### Summary & Submission
12. `GET /api/v1/enrollments/:id/summary` - Get complete enrollment summary
13. `POST /api/v1/enrollments/:id/submit` - Submit enrollment for processing

## Seed Data Requirements

### 1 Agent (Stubbed)
```sql
INSERT INTO agents (id, first_name, last_name, email, license_number, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'John', 'Agent', 'john.agent@yadmanx.com', 'LIC-12345', 'active');
```

### 6-8 Customers
Create diverse customer profiles with different demographics

### 10+ Enrollments
Spread across different statuses:
- 2 draft enrollments
- 3 in_progress enrollments (with some steps completed)
- 2 submitted enrollments
- 2 approved enrollments
- 1 rejected enrollment

Include:
- Different step data for each enrollment
- Billing data for submitted/approved enrollments
- Beneficiaries for some enrollments
- Realistic dates and metadata

## Encryption Implementation

### Simple Version (Base64 + TODO)
```javascript
// encryption.service.js
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    // TODO: Replace with proper key management (e.g., AWS KMS, HashiCorp Vault)
    this.algorithm = 'aes-256-gcm';
    this.key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
    this.keyId = 'v1'; // Simple versioning
  }

  encrypt(data) {
    // TODO: Implement proper AES-256-GCM encryption
    // For now, use base64 encoding as placeholder
    const jsonString = JSON.stringify(data);
    const encoded = Buffer.from(jsonString).toString('base64');
    
    return {
      encrypted: encoded,
      keyId: this.keyId
    };
  }

  decrypt(encryptedData, keyId) {
    // TODO: Implement proper decryption with key versioning
    const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');
    return JSON.parse(decoded);
  }
}
```

## Authentication Stub

```javascript
// middleware/auth.middleware.js
const authenticateAgent = (req, res, next) => {
  // TODO: Implement JWT authentication
  // For now, stub with default agent ID
  req.agentId = req.headers['x-agent-id'] || '11111111-1111-1111-1111-111111111111';
  next();
};
```

## Testing Requirements

### Integration Tests
- Test all 16 endpoints
- Test happy paths
- Test error cases (404, 400, 409)
- Test filtering and pagination
- Test data encryption/decryption
- Test step data validation
- Test status transitions

### Unit Tests
- EnrollmentService methods
- CustomerService (findOrCreate logic)
- BillingService (encryption)
- EncryptionService
- Validators

### Test Database
- Use separate test database
- Reset database before each test suite
- Seed minimal test data

## Docker Configuration

### Dockerfile
Follow pricing-service pattern exactly:
- Node 18 Alpine base image
- Multi-stage build
- Non-root user
- Health check endpoint

### Docker Compose
Add to root `docker-compose.yml`:
```yaml
enrollment-service:
  build: ./enrollment-service
  ports:
    - "3002:3002"
  environment:
    - NODE_ENV=development
    - PORT=3002
    - DATABASE_URL=postgresql://postgres:postgres@enrollment-db:5432/enrollment
    - ENCRYPTION_KEY=dev-key-change-in-production
  depends_on:
    - enrollment-db
  volumes:
    - ./enrollment-service:/app
    - /app/node_modules

enrollment-db:
  image: postgres:15
  environment:
    - POSTGRES_DB=enrollment
    - POSTGRES_USER=postgres
    - POSTGRES_PASSWORD=postgres
  ports:
    - "5433:5432"
  volumes:
    - enrollment-db-data:/var/lib/postgresql/data

volumes:
  enrollment-db-data:
```

## Documentation

### API Documentation (docs/api.md)
Follow EXACT format from pricing-service docs:
- Overview section
- Authentication section (note: stubbed)
- Endpoint documentation with:
  - Method and path
  - Description
  - Request body examples
  - Response examples
  - Error responses
- Data models section
- Example workflows

### README.md
Include:
- Service description
- Local development setup
- Running with Docker
- Running tests
- API documentation link
- Environment variables
- Known limitations (stubbed auth, simple encryption)

## Environment Variables (.env.example)

```
NODE_ENV=development
PORT=3002
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/enrollment
ENCRYPTION_KEY=change-me-in-production
LOG_LEVEL=debug
```

## Acceptance Criteria

✅ Service runs on port 3002 in Docker
✅ All 16 endpoints implemented and working
✅ Database schema created with migrations
✅ 10+ sample enrollments seeded
✅ All tests passing (unit + integration)
✅ API documentation matches pricing-service format at /api/docs/
✅ Encryption service implemented (simple version with TODOs)
✅ Auth middleware stubbed with TODOs
✅ Error handling follows pricing-service patterns
✅ Service added to root docker-compose.yml
✅ Can run `docker-compose up` and access all services
✅ README documents setup and usage
✅ Code follows pricing-service conventions exactly

## Implementation Notes

### Standards to Follow from Pricing Service
1. Express route structure and organization
2. Controller → Service → Database pattern
3. Error handling middleware
4. Response format consistency
5. Database connection pooling
6. Logging approach
7. Test structure and naming
8. API documentation format
9. Docker setup patterns
10. Environment variable handling

### Deviations Allowed
- None, unless technically impossible
- If deviation needed, document reason in code comments

### Priority Order
1. Database schema and migrations
2. Core services (enrollment, customer, billing)
3. API endpoints (enrollment management first)
4. Tests (integration tests alongside endpoints)
5. Documentation
6. Docker configuration
7. Seed data

## Success Metrics
- All tests pass
- `docker-compose up` brings up all services successfully
- Can create enrollment via API
- Can retrieve enrollment with all related data
- Billing data is encrypted in database
- API docs are accessible and accurate
- Service follows pricing-service patterns 100%
