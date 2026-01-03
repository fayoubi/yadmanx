# Enrollment Service

The Enrollment Service handles the complete enrollment workflow for yadmanx, including customer management, enrollment tracking, billing data (encrypted), beneficiaries, and dynamic step data.

## Features

- ✅ Complete enrollment workflow management
- ✅ Customer data management (find or create)
- ✅ Multi-step enrollment process tracking
- ✅ Encrypted billing data storage
- ✅ Beneficiary management with validation
- ✅ Audit logging for all enrollment changes
- ✅ PostgreSQL database with raw SQL
- ✅ RESTful API with 16 endpoints
- ✅ Comprehensive test coverage
- ✅ Docker support

## Technology Stack

- **Runtime:** Node.js 18
- **Framework:** Express.js
- **Database:** PostgreSQL 15
- **Testing:** Jest + Supertest
- **Security:** Helmet, CORS, encryption service

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```
NODE_ENV=development
PORT=3002
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/enrollment
ENCRYPTION_KEY=your-secure-encryption-key-here
LOG_LEVEL=debug
```

### 3. Setup Database

Create the database:

```bash
createdb enrollment
```

Run migrations:

```bash
psql -d enrollment -f db/migrations/001_initial_schema.sql
```

Seed sample data:

```bash
psql -d enrollment -f db/seeds/001_sample_data.sql
```

### 4. Start the Service

```bash
npm run dev
```

The service will be available at `http://localhost:3002`

## Running with Docker

### Start all services:

```bash
docker-compose up
```

This will start:
- Enrollment service on port 3002
- PostgreSQL database on port 5433

### Stop services:

```bash
docker-compose down
```

## Running Tests

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

## API Documentation

Once the service is running, access the API documentation at:

**http://localhost:3002/api/docs/**

## API Endpoints

### Enrollment Management
- `POST /api/v1/enrollments` - Create new enrollment
- `GET /api/v1/enrollments/:id` - Get enrollment details
- `GET /api/v1/enrollments` - List enrollments with filters
- `PATCH /api/v1/enrollments/:id/status` - Update enrollment status
- `DELETE /api/v1/enrollments/:id` - Cancel enrollment

### Billing
- `POST /api/v1/enrollments/:id/billing` - Save billing data (with encryption)
- `GET /api/v1/enrollments/:id/billing` - Get billing data (masked)

### Beneficiaries
- `POST /api/v1/enrollments/:id/beneficiaries` - Add beneficiaries
- `GET /api/v1/enrollments/:id/beneficiaries` - Get beneficiaries
- `PUT /api/v1/enrollments/:id/beneficiaries/:beneficiaryId` - Update beneficiary
- `DELETE /api/v1/enrollments/:id/beneficiaries/:beneficiaryId` - Remove beneficiary

### Summary & Submission
- `GET /api/v1/enrollments/:id/summary` - Get complete enrollment summary
- `POST /api/v1/enrollments/:id/submit` - Submit enrollment for processing

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Service port | 3002 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `ENCRYPTION_KEY` | Encryption key for sensitive data | - |
| `LOG_LEVEL` | Logging level | debug |
| `CORS_ORIGIN` | CORS allowed origins | * |

## Database Schema

The service uses the following tables:

- **customers** - Customer information
- **agents** - Agent information
- **enrollments** - Main enrollment records
- **billing_data** - Encrypted billing information
- **beneficiaries** - Beneficiary information
- **enrollment_step_data** - Dynamic step data
- **enrollment_audit_log** - Audit trail

## Known Limitations

### Stubbed Authentication
Currently using a simple header-based authentication stub. Production implementation should use JWT tokens.

```javascript
// Current implementation (DO NOT use in production)
req.agentId = req.headers['x-agent-id'] || 'default-agent-id';
```

**TODO:** Implement JWT authentication with proper token validation.

### Simple Encryption
The encryption service uses base64 encoding as a placeholder. Production implementation should use proper AES-256-GCM encryption with a key management system.

**TODO:** Replace with proper encryption using AWS KMS, HashiCorp Vault, or similar.

## Project Structure

```
enrollment-service/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── utils/           # Utility functions
│   ├── docs/            # API documentation
│   └── app.js           # Express app setup
├── db/
│   ├── migrations/      # Database migrations
│   └── seeds/           # Sample data
├── tests/
│   ├── integration/     # Integration tests
│   └── unit/            # Unit tests
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Health Check

Check service health:

```bash
curl http://localhost:3002/api/v1/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-30T10:00:00.000Z",
  "database": "connected"
}
```

## Contributing

1. Follow the established patterns from pricing-service
2. Write tests for new features
3. Update API documentation
4. Ensure all tests pass before committing

## License

ISC