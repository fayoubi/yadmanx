# YadmanX - Modern Life Insurance Platform

## 🎯 Overview

**YadmanX** is a comprehensive, modern life insurance platform designed for the Moroccan and European markets. It provides a complete digital solution for insurance agents to generate quotes, manage enrollments, and track customer applications - all through an intuitive web interface backed by a robust microservices architecture.

## 🏢 Company Information

- **Company**: YadmanX
- **Region**: Morocco/Europe
- **Target Market**: Life insurance distribution through independent agents
- **Date Format**: European (DD/MM/YYYY)
- **Measurement System**: Metric (cm, kg)
- **Languages**: English (with future support for Arabic/French)

## 💡 What YadmanX Does

YadmanX streamlines the life insurance enrollment process by providing:

1. **Real-time Quote Generation**: Instant premium calculations based on age, health factors, location, and coverage amount
2. **Agent Authentication**: Secure OTP-based login system for insurance agents
3. **Enrollment Management**: Complete digital enrollment workflow from initial quote to final submission
4. **Customer Data Management**: Structured storage and retrieval of customer information
5. **Beneficiary Management**: Support for multiple beneficiaries with percentage allocation
6. **Contribution Tracking**: Flexible payment frequency options (monthly, quarterly, bi-annual, annual)

## 🏗️ Architecture

YadmanX is built as a **microservices architecture** with separate services for each domain:

```
┌─────────────────────────────────────────────────────────────┐
│                       React Frontend                         │
│                    (Port 3000)                              │
└────────┬──────────────────┬──────────────────┬──────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Pricing Service│  │Enrollment Svc  │  │ Agent Service  │
│   (Port 3001)  │  │  (Port 3002)   │  │  (Port 3003)   │
└────────┬───────┘  └────────┬───────┘  └────────┬───────┘
         │                   │                    │
         ▼                   ▼                    ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  PostgreSQL    │  │  PostgreSQL    │  │  PostgreSQL    │
│  (Port 5432)   │  │  (Port 5433)   │  │  (Port 5434)   │
└────────────────┘  └────────────────┘  └────────────────┘
         │
         ▼
   ┌──────────┐
   │  Redis   │
   │  (6379)  │
   └──────────┘
```

### Service Independence
- Each microservice has its own database
- Services communicate via REST APIs
- Independent deployment and scaling
- Fault isolation and resilience

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Icons**: Lucide React
- **State Management**: React Context API
- **Build Tool**: Create React App

### Backend Services
- **Runtime**: Node.js with Express.js
- **Language**: JavaScript (ES6+) / TypeScript
- **API Style**: RESTful APIs
- **Authentication**: JWT with OTP verification
- **Documentation**: Swagger/OpenAPI

### Databases
- **Primary Database**: PostgreSQL 15
- **Cache Layer**: Redis 7 (for pricing service)
- **Data Format**: JSONB for flexible schema in enrollments

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Development**: Hot reload with volume mounts
- **Orchestration**: Docker Compose for local development

## 📦 Core Services

### 1. Pricing Service (Port 3001)

**Purpose**: Calculate insurance premiums and validate contributions

**Key Features**:
- Real-time quote calculation based on multiple factors
- Age-based risk assessment
- Height/weight BMI calculations
- Location-based pricing (10 major Moroccan cities)
- Nicotine use consideration
- Contribution validation with frequency-based minimums
- Redis caching for performance

**Technology**:
- Node.js + Express + TypeScript
- PostgreSQL for product and rate table storage
- Redis for caching
- In-memory calculation engine

**Database**:
- Port 5432
- Tables: `products`, `rate_tables`, health checks
- **Note**: Currently uses in-memory calculations; database tables populated but not queried during normal operation

**API Endpoints**:
- `GET /api/v1/health` - Health check
- `POST /api/v1/quotes/calculate` - Generate quote
- `POST /api/v1/contributions/validate` - Validate contributions
- `GET /api/docs` - Swagger documentation

### 2. Enrollment Service (Port 3002)

**Purpose**: Manage customer enrollment lifecycle

**Architecture**: JSONB-based V2 implementation for maximum flexibility

**Key Features**:
- Single JSONB column for all enrollment data
- No status tracking (always editable)
- Automatic customer record synchronization
- Soft deletes for data retention
- Flexible schema evolution

**Data Structure**:
```json
{
  "personalInfo": {
    "subscriber": { /* customer details */ },
    "insured": { /* insured person details */ }
  },
  "contribution": {
    "amount": 100,
    "amountText": "Cent Dirhams",
    "originOfFunds": { /* source tracking */ },
    "paymentMode": { /* bank details */ }
  },
  "beneficiaries": [
    { /* beneficiary 1 */ },
    { /* beneficiary 2 */ }
  ]
}
```

**Technology**:
- Node.js + Express
- PostgreSQL with JSONB support
- Field-level encryption for sensitive data

**Database**:
- Port 5433
- Tables: `enrollments`, `customers`, `agents`
- JSONB column for flexible enrollment data

**API Endpoints**:
- `POST /api/v1/enrollments` - Create new enrollment
- `GET /api/v1/enrollments` - List enrollments
- `GET /api/v1/enrollments/:id` - Get specific enrollment
- `PUT /api/v1/enrollments/:id` - Update enrollment (merges data)
- `DELETE /api/v1/enrollments/:id` - Soft delete enrollment

### 3. Agent Service (Port 3003)

**Purpose**: Handle agent authentication and authorization

**Key Features**:
- OTP-based authentication (no passwords)
- Support for Morocco (+212) and France (+33) phone numbers
- JWT token management (24-hour expiration)
- Agent registration and profile management
- Auto-generated license numbers
- Security features:
  - Rate limiting (5 attempts max)
  - Account lockout (30 minutes after max attempts)
  - OTP expiration (10 minutes)

**Technology**:
- Node.js + Express
- PostgreSQL for agent data
- JWT for session management
- Bcrypt for OTP hashing

**Database**:
- Port 5434
- Tables: `agents`, `agent_otps`
- Secure OTP storage with expiration

**API Endpoints**:
- `POST /api/v1/auth/register` - Register new agent
- `POST /api/v1/auth/request-otp` - Request OTP for login
- `POST /api/v1/auth/verify-otp` - Verify OTP and get JWT
- `GET /api/v1/agents/profile` - Get agent profile (authenticated)
- `GET /api/v1/enrollments` - Get agent's enrollments (authenticated)

## 🎨 Frontend Application

**URL**: http://localhost:3000

**Features**:
- Modern, responsive design
- Step-by-step enrollment wizard
- Real-time form validation
- Interactive quote calculator
- Contribution frequency selector with minimum validation
- Success animations with confetti
- Mobile-first responsive design

**Key Pages**:
- **Home/Hero**: Landing page with call-to-action
- **Quote Form**: Interactive insurance quote calculator
- **Enrollment Flow**: Multi-step process
  - Step 1: Personal information
  - Step 2: Contribution details
  - Step 3: Beneficiaries
- **Contact**: Contact form and information
- **Agent Login**: Agent authentication portal

**UI Components**:
- Reusable component library (`src/components/ui/`)
- Form controls (Input, Select, Button, Checkbox, Radio)
- Layout components (Card, Container, Header, Footer)
- Navigation with React Router

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- PostgreSQL client (for database access)

### Quick Start

1. **Clone the repository**:
   ```bash
   cd yadmanx
   ```

2. **Start all services** (easiest method):
   ```bash
   ./start-yadmanx.sh
   ```

   This script will:
   - Start all backend services via Docker Compose
   - Configure frontend environment variables
   - Start the React development server
   - Run health checks
   - Run integration tests

3. **Manual start** (alternative):
   ```bash
   # Start backend services
   docker-compose up -d

   # Configure frontend
   echo "REACT_APP_PRICING_SERVICE_URL=http://localhost:3001" > .env.local
   echo "REACT_APP_ENROLLMENT_SERVICE_URL=http://localhost:3002" >> .env.local
   echo "REACT_APP_AGENT_SERVICE_URL=http://localhost:3003" >> .env.local
   echo "REACT_APP_ENV=development" >> .env.local

   # Start frontend
   npm start
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Pricing API: http://localhost:3001/api/docs
   - Enrollment API: http://localhost:3002/health
   - Agent API: http://localhost:3003/health

### Database Access

Connect to databases using psql (password: `postgres`):

```bash
# Pricing Service
psql -h localhost -p 5432 -U postgres -d pricing

# Enrollment Service
psql -h localhost -p 5433 -U postgres -d enrollment

# Agent Service
psql -h localhost -p 5434 -U postgres -d agent
```

## 🧪 Testing

### API Testing

Run comprehensive API tests:
```bash
npm run test-api
```

Test individual services:
```bash
# Test enrollment API V2
./test-api-v2-simple.sh

# Test enrollment flow
./test-enrollment-v2.sh
```

### Health Checks

Verify all services are running:
```bash
curl http://localhost:3001/api/v1/health  # Pricing
curl http://localhost:3002/health         # Enrollment
curl http://localhost:3003/health         # Agent
```

## 📂 Project Structure

```
yadmanx/
├── src/                          # React frontend source
│   ├── components/               # React components
│   │   ├── ui/                  # Reusable UI components
│   │   ├── QuoteForm.tsx        # Quote calculator
│   │   ├── ContributionForm.tsx # Payment setup
│   │   └── InsuranceForm.tsx    # Personal info form
│   ├── services/                # API integration layer
│   ├── context/                 # React Context providers
│   ├── types/                   # TypeScript definitions
│   └── utils/                   # Helper functions
│
├── pricing-service/             # Pricing microservice
│   ├── src/
│   │   ├── controllers/         # Route handlers
│   │   ├── services/            # Business logic
│   │   ├── routes/              # API routes
│   │   ├── database/            # Schema and migrations
│   │   └── docs/                # Swagger documentation
│   └── Dockerfile
│
├── enrollment-service/          # Enrollment microservice
│   ├── src/
│   │   ├── controllers/         # Route handlers
│   │   ├── services/            # Business logic (V2 JSONB)
│   │   ├── routes/              # API routes
│   │   └── middleware/          # Auth middleware
│   ├── db/migrations/           # Database migrations
│   └── Dockerfile
│
├── agent-service/               # Agent authentication service
│   ├── src/
│   │   ├── controllers/         # Route handlers
│   │   ├── services/            # Business logic
│   │   ├── routes/              # API routes
│   │   └── middleware/          # JWT middleware
│   ├── db/migrations/           # Database migrations
│   └── Dockerfile
│
├── documentation/               # Project documentation
│   ├── README.md               # Documentation index
│   ├── AGENT_SERVICE_API.md    # Agent API guide
│   ├── DATABASE_ACCESS.md      # Database guide
│   ├── REDIS_USAGE.md          # Redis usage patterns
│   ├── PRICING_INTEGRATION.md  # Pricing API guide
│   ├── IMPLEMENTATION_SUMMARY_V2.md  # V2 implementation
│   └── yadmanx-README.md       # This file
│
├── docker-compose.yml          # Service orchestration
├── package.json                # Frontend dependencies
├── start-yadmanx.sh           # Quick start script
└── README.md                   # Main project README
```

## 🔑 Key Features

### Quote Calculation
- Real-time premium calculation
- Multiple factor consideration (age, health, location, coverage)
- Instant results without page reload
- Contribution validation with minimum thresholds

### Enrollment Workflow
- Step-by-step guided process
- Form validation at each step
- Data persistence across steps
- Prepopulation from quote data

### Contribution Management
- Multiple payment frequencies:
  - Monthly: 250 MAD minimum
  - Quarterly: 750 MAD minimum
  - Bi-annual: 1,500 MAD minimum
  - Annual: 3,000 MAD minimum
- Automatic monthly equivalent calculation
- Annual total computation
- Origin of funds tracking
- Bank transfer support

### Security Features
- OTP-based authentication (no password storage)
- JWT token-based sessions
- Rate limiting and brute force protection
- Account lockout after failed attempts
- Encrypted sensitive data storage
- CORS configuration for API security

### Data Management
- JSONB flexible schema
- Automatic customer synchronization
- Soft deletes for audit trail
- Relational queries on customer data
- Full-text search capabilities

## 🎯 Business Rules

### Contribution Minimums
- Monthly payments: 250 MAD minimum
- Quarterly payments: 750 MAD minimum (3 months)
- Bi-annual payments: 1,500 MAD minimum (6 months)
- Annual payments: 3,000 MAD minimum (12 months)

### Agent Requirements
- Valid phone number (+212 for Morocco, +33 for France)
- Unique email address
- Agency affiliation
- Auto-generated license number (format: AG-YYYY-NNNNNN)

### Enrollment Data
- Subscriber information required
- At least one beneficiary
- Total beneficiary percentage must equal 100%
- Valid payment method details
- Origin of funds declaration

## 📖 Documentation

Comprehensive documentation is available in the `documentation/` folder:

- **[README.md](./README.md)** - Documentation index
- **[AGENT_SERVICE_API.md](./AGENT_SERVICE_API.md)** - Complete Agent API guide with curl examples
- **[DATABASE_ACCESS.md](./DATABASE_ACCESS.md)** - Database connection and query guide
- **[REDIS_USAGE.md](./REDIS_USAGE.md)** - Redis caching patterns and data flow
- **[PRICING_INTEGRATION.md](./PRICING_INTEGRATION.md)** - Pricing service integration guide
- **[IMPLEMENTATION_SUMMARY_V2.md](./IMPLEMENTATION_SUMMARY_V2.md)** - V2 JSONB implementation details

### Postman Collections
- **Agent Service**: `agent-service/YadmanX_Agent_Service.postman_collection.json`
  - Import into Postman for interactive API testing
  - Includes automatic token management

## 🚨 Troubleshooting

### Services Won't Start
```bash
# Check if ports are already in use
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Pricing
lsof -ti:3002 | xargs kill -9  # Enrollment
lsof -ti:3003 | xargs kill -9  # Agent

# Restart Docker Compose
docker-compose down
docker-compose up -d
```

### Database Connection Issues
```bash
# Check if databases are running
docker-compose ps

# View logs
docker-compose logs pricing-service
docker-compose logs enrollment-service
docker-compose logs agent-service
```

### Frontend Not Connecting to Backend
1. Verify `.env.local` file exists with correct URLs
2. Check backend services are running: `curl http://localhost:3001/api/v1/health`
3. Check browser console for CORS errors
4. Restart frontend: `npm start`

### Redis Connection Issues
```bash
# Test Redis connection
docker-compose exec pricing-redis redis-cli ping
# Should return: PONG
```

## 🔄 Development Workflow

1. **Make changes** to service code
2. **Hot reload** automatically updates the running container
3. **Test changes** using curl, Postman, or test scripts
4. **Run tests** before committing: `npm run test-api`
5. **Build for production**: `npm run build`

## 🚀 Deployment Considerations

### Production Checklist
- [ ] Change all database passwords
- [ ] Update JWT_SECRET
- [ ] Update ENCRYPTION_KEY
- [ ] Configure production Redis
- [ ] Set up SSL/TLS certificates
- [ ] Configure production CORS origins
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Perform security audit

### Environment Variables
Each service requires environment-specific configuration:

**Pricing Service**:
- `DATABASE_URL`
- `REDIS_URL`
- `PORT`
- `NODE_ENV`

**Enrollment Service**:
- `DATABASE_URL`
- `ENCRYPTION_KEY`
- `PORT`
- `NODE_ENV`

**Agent Service**:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `OTP_EXPIRES_IN`
- `MAX_OTP_ATTEMPTS`
- `PORT`
- `NODE_ENV`

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly: `npm run test-api`
4. Build to verify: `npm run build`
5. Commit with clear messages
6. Submit a pull request

## 📝 Version History

### Current Version: V2 (JSONB Architecture)
- Simplified enrollment API (5 endpoints vs 15+)
- JSONB flexible schema
- No status tracking
- Automatic customer synchronization
- Improved developer experience

### Legacy: V1 (Multi-table Architecture)
- Multiple normalized tables
- Status-based workflow
- Step-by-step validation
- More complex API surface

## 📞 Support

For questions or issues:
1. Check the [documentation index](./README.md)
2. Review relevant API guides
3. Run health checks: `curl http://localhost:<port>/health`
4. Check Docker logs: `docker-compose logs <service-name>`
5. Verify database connectivity
6. Review test scripts for examples

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com)
- [Express.js Guide](https://expressjs.com)

---

**YadmanX** - Empowering insurance agents with modern technology to serve their customers better.

*Last Updated: October 2025*
