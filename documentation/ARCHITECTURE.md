# YadmanX Platform Architecture

## System Overview

YadmanX is a microservices-based life insurance platform consisting of a React frontend and four independent backend services. The architecture follows domain-driven design principles with each service owning its data and exposing RESTful APIs.

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     React Frontend (Port 3000)                    │
│  - Quote Calculator (/), AI Quote (/ai-quote), Enrollment Flow   │
│  - Agent Dashboard, Authentication                                │
└────────┬────────┬────────────┬──────────────────┬────────────────┘
         │        │            │                  │
         │        │            │                  │
    ┌────▼─┐  ┌──▼──┐    ┌────▼────┐      ┌─────▼─────┐
    │Pricing│  │Agent│    │Enrollment│     │LLM Quote  │
    │3001  │  │3003 │    │   3002   │     │   3004    │
    └───┬──┘  └──┬──┘    └────┬─────┘      └─────┬─────┘
        │        │            │                   │
        │        │            │                   │
    ┌───▼──┐  ┌──▼──┐    ┌────▼─────┐      ┌─────▼─────┐
    │PG:   │  │PG:  │    │PG:       │      │Redis:     │
    │5432  │  │5434 │    │5433      │      │6380       │
    └───┬──┘  └─────┘    └──────────┘      └───────────┘
        │
    ┌───▼──────┐
    │Redis:    │
    │6379      │
    └──────────┘
```

## Service Responsibilities

### 1. Pricing Service (Port 3001)

**Purpose**: Calculate insurance premiums and validate contribution amounts

**Technology Stack**:
- Node.js + Express + TypeScript
- PostgreSQL (port 5432) - schema storage
- Redis (port 6379) - caching layer

**Core Functions**:
- Quote calculation using in-memory pricing engine
- Risk assessment (BMI, age, nicotine use)
- Contribution validation
- Rate table management (stored but not currently used)

**Key Algorithms**:
- **Risk Classification**: Based on age, BMI, nicotine use
  - SuperPreferredPlus, SuperPreferred, PreferredPlus, Preferred
  - StandardPlus, Standard, Substandard
- **Premium Calculation**: In-memory formula
  - Base rate × Age factor × Gender factor × Term length factor
  - Location adjustment for 10 major Moroccan cities
- **BMI Calculation**: weight(kg) / (height(m))²

**API Endpoints**:
```
GET  /api/v1/health          - Health check
POST /api/v1/quotes/calculate - Calculate quote
POST /api/v1/contributions/validate - Validate contribution
GET  /api/docs              - Swagger documentation
```

**Database Schema**:
- `products` - Product configurations (not queried during calculation)
- `rate_tables` - Actuarial rates (stored for future use)
- `quotes` - Quote storage (optional, currently ephemeral)

**Performance**:
- Quote calculation: ~5-10ms (in-memory)
- Uses hardcoded rate logic for speed
- Redis planned for rate table caching

### 2. Enrollment Service (Port 3002)

**Purpose**: Manage customer enrollment lifecycle

**Technology Stack**:
- Node.js + Express (JavaScript)
- PostgreSQL (port 5433)
- JSONB for flexible data storage

**Architecture**: V2 (JSONB-based)
- Single JSONB column for all enrollment data
- No status tracking (always editable)
- Automatic customer record synchronization
- Soft deletes for audit trail

**Data Model**:
```json
{
  "personalInfo": {
    "subscriber": { /* customer details */ },
    "insured": { /* insured person */ }
  },
  "contribution": {
    "amount": 100,
    "paymentMode": { /* bank details */ },
    "originOfFunds": { /* tracking */ }
  },
  "beneficiaries": [
    { "firstName": "...", "percentage": 50 }
  ]
}
```

**API Endpoints**:
```
POST   /api/v1/enrollments       - Create enrollment
GET    /api/v1/enrollments       - List enrollments
GET    /api/v1/enrollments/:id   - Get enrollment
PUT    /api/v1/enrollments/:id   - Update (merges data)
DELETE /api/v1/enrollments/:id   - Soft delete
```

**Database Schema**:
- `enrollments` - JSONB enrollment data
- `customers` - Relational customer records (auto-synced)
- `agents` - Agent records

**Key Features**:
- JSONB merging on updates (preserves existing data)
- Customer auto-creation from personalInfo.subscriber
- Soft deletes (sets deleted_at timestamp)
- Field-level encryption for sensitive data

### 3. Agent Service (Port 3003)

**Purpose**: Agent authentication and authorization

**Technology Stack**:
- Node.js + Express (JavaScript)
- PostgreSQL (port 5434)
- JWT for session management
- Bcrypt for OTP hashing

**Security Features**:
- OTP-based authentication (no passwords)
- JWT tokens (24-hour expiration)
- Rate limiting (5 OTP attempts max)
- Account lockout (30 minutes after max attempts)
- OTP expiration (10 minutes)

**API Endpoints**:
```
POST /api/v1/auth/register      - Register agent
POST /api/v1/auth/request-otp   - Request OTP
POST /api/v1/auth/verify-otp    - Verify OTP, get JWT
GET  /api/v1/agents/profile     - Get profile (auth required)
GET  /api/v1/enrollments        - Get agent's enrollments
```

**Database Schema**:
- `agents` - Agent profiles
  - id, first_name, last_name, email, phone_number
  - license_number (auto-generated: AG-YYYY-NNNNNN)
  - is_active, created_at, updated_at
- `agent_otps` - OTP records
  - phone_number, otp_hash, expires_at
  - attempts, is_used

**Authentication Flow**:
```
1. POST /auth/request-otp
   → Generates 6-digit OTP
   → Sends via SMS (simulated)
   → Stores hashed OTP with 10min expiration

2. POST /auth/verify-otp
   → Validates OTP
   → Checks attempts (max 5)
   → Issues JWT token (24h)
   → Returns agent profile

3. Subsequent requests
   → Include JWT in Authorization header
   → Middleware validates token
   → Extracts agentId for use in endpoints
```

**Integration with Enrollment Service**:
- JWT token passed to enrollment service
- Enrollment service validates JWT
- Filters enrollments by agent_id

### 4. LLM Quote Service (Port 3004)

**Purpose**: AI-powered conversational quote generation using Claude

**Technology Stack**:
- Node.js + Express + TypeScript
- Redis (port 6380) - session storage
- Claude AI (Anthropic API) - 3.5 Haiku model
- Pricing Service integration

**Conversation Flow**:
```
1. Create Conversation
   → Generates session ID
   → Stores in Redis (30min TTL)
   → Returns welcome message

2. Multi-turn Dialogue
   → User sends message
   → Claude processes with context
   → Extracts data from response
   → Updates session state
   → Returns next question

3. Data Collection (7 fields)
   - Gender (male/female)
   - Date of birth (YYYY-MM-DD)
   - Height (cm)
   - Weight (kg)
   - City (Moroccan cities)
   - Uses nicotine (yes/no)
   - Term length (10 or 20 years)

4. Quote Calculation
   → When all 7 fields collected
   → Calls Pricing Service
   → Returns quote to user
```

**API Endpoints**:
```
POST /api/v1/conversations              - Create conversation
POST /api/v1/conversations/:id/message  - Send message
GET  /api/v1/conversations/:id/summary  - Get state
POST /api/v1/conversations/:id/confirm  - Calculate quote
GET  /api/v1/health                    - Health check
```

**Components**:
- **LLMProvider** - Claude API integration
- **DataExtractor** - NLP parsing and validation
- **ConversationManager** - Dialogue orchestration
- **QuoteIntegration** - Pricing service client
- **RedisService** - Session management

**Session Storage (Redis)**:
```typescript
{
  sessionId: string,
  extractedData: {
    gender?: 'male' | 'female',
    dateOfBirth?: string,
    height?: number,
    weight?: number,
    city?: string,
    usesNicotine?: boolean,
    termLength?: 10 | 20
  },
  conversationHistory: Message[],
  status: 'collecting' | 'confirming' | 'calculating' | 'complete',
  progress: ['gender', 'dateOfBirth', ...],
  ttl: 1800 // 30 minutes
}
```

**Error Handling**:
- Automatic retry with exponential backoff
- Retries: 3 attempts (1s, 2s, 4s delays)
- Handles Claude API rate limits (529, 503)
- Graceful degradation on service failures

## Frontend Application (Port 3000)

**Technology Stack**:
- React 18 + TypeScript
- React Router v6 for routing
- Tailwind CSS for styling
- Context API for state management

**Pages and Routes**:
```
/                    - Home/Hero with quote form
/quote              - Quote display
/ai-quote           - AI conversational quote
/about              - About page
/contact            - Contact page

/agent/login        - Agent login
/agent/register     - Agent registration
/agent/dashboard    - Agent dashboard (protected)

/enroll/start       - Personal information
/enroll/contribution - Contribution setup
/enroll/beneficiaries - Beneficiaries
/enroll/confirmation - Review and confirm
/enroll/success     - Success page
/enroll/error       - Error page
```

**State Management**:
- **QuoteContext** - Quote data across components
- **AgentAuthContext** - Authentication state

**Services**:
- **pricingService** - Pricing API client
- **enrollmentService** - Enrollment API client
- **agentService** - Agent API client
- **llmQuoteService** - LLM Quote API client

**Component Structure**:
```
src/
├── components/
│   ├── ui/              - Reusable UI (Button, Input, Card)
│   ├── common/          - Layout (Header, Footer)
│   ├── agent/           - Agent-specific components
│   ├── ai-quote/        - AI quote components
│   ├── QuoteForm.tsx    - Traditional quote form
│   └── ...
├── context/             - React Context providers
├── services/            - API clients
├── types/              - TypeScript definitions
└── utils/              - Helper functions
```

## Service Communication Patterns

### 1. Frontend → Pricing Service
```
User fills quote form
→ POST /api/v1/quotes/calculate
→ Returns quote immediately (in-memory calculation)
→ Display to user
```

### 2. Frontend → LLM Quote Service → Pricing Service
```
User chats with AI
→ POST /api/v1/conversations/:id/message
→ LLM extracts data
→ When complete, calls Pricing Service internally
→ POST /api/v1/quotes/calculate
→ Returns quote to frontend
```

### 3. Frontend → Agent Service
```
Agent requests OTP
→ POST /api/v1/auth/request-otp
→ OTP generated and sent

Agent verifies OTP
→ POST /api/v1/auth/verify-otp
→ JWT token returned
→ Stored in localStorage

Protected requests
→ Include "Authorization: Bearer <token>"
→ Middleware validates token
```

### 4. Frontend → Enrollment Service
```
Create enrollment
→ POST /api/v1/enrollments
→ Returns enrollment ID

Update enrollment
→ PUT /api/v1/enrollments/:id
→ Merges new data with existing JSONB
→ Auto-creates/updates customer record
```

### 5. Agent Service → Enrollment Service
```
Agent views enrollments
→ GET /api/v1/enrollments (with JWT)
→ Enrollment service validates JWT
→ Filters by agent_id from token
→ Returns agent's enrollments
```

## Data Flow Examples

### Example 1: Traditional Quote Generation

```
User (Browser)
  ↓ Fills form
Frontend (React)
  ↓ POST /api/v1/quotes/calculate
Pricing Service
  ↓ In-memory calculation (5ms)
  → Risk assessment
  → Premium calculation
  ↓ Returns quote
Frontend
  ↓ Display quote
User sees results
```

### Example 2: AI-Powered Quote Generation

```
User (Browser)
  ↓ Clicks "Get AI Quote"
Frontend
  ↓ POST /api/v1/conversations
LLM Quote Service
  ↓ Creates session in Redis
  ↓ Returns welcome message
Frontend
  ↓ Displays AI message
User types response
  ↓ POST /api/v1/conversations/:id/message
LLM Quote Service
  ↓ Calls Claude API
  ↓ Extracts data from response
  ↓ Stores in Redis session
  ↓ Returns next question
  ... (repeat 7 times)
  ↓ All data collected
LLM Quote Service
  ↓ POST /api/v1/quotes/calculate
Pricing Service
  ↓ Calculates premium
  ↓ Returns quote
LLM Quote Service
  ↓ Stores in Redis
  ↓ Returns to frontend
Frontend
  ↓ Displays quote
User sees results
```

### Example 3: Agent Authentication & Enrollment

```
Agent (Browser)
  ↓ Enters phone number
Frontend
  ↓ POST /api/v1/auth/request-otp
Agent Service
  ↓ Generates OTP
  ↓ Stores in database (10min expiry)
  ↓ (In production: sends SMS)
Agent receives OTP
  ↓ Enters OTP
Frontend
  ↓ POST /api/v1/auth/verify-otp
Agent Service
  ↓ Validates OTP
  ↓ Generates JWT (24h expiry)
  ↓ Returns token + profile
Frontend
  ↓ Stores JWT in localStorage
  ↓ Redirects to dashboard
Agent views enrollments
  ↓ GET /api/v1/enrollments (with JWT)
Enrollment Service
  ↓ Validates JWT
  ↓ Queries enrollments by agent_id
  ↓ Returns enrollments
Frontend
  ↓ Displays enrollment list
```

### Example 4: Complete Enrollment Flow

```
User completes quote
  ↓ Clicks "Enroll Now"
Frontend
  ↓ POST /api/v1/enrollments
Enrollment Service
  ↓ Creates empty enrollment
  ↓ Returns enrollment ID
Frontend
  ↓ Navigate to /enroll/start
User fills personal info
  ↓ Submits form
Frontend
  ↓ PUT /api/v1/enrollments/:id
  ↓ Body: { personalInfo: {...} }
Enrollment Service
  ↓ Merges into JSONB
  ↓ Auto-creates customer record
  ↓ Returns updated enrollment
Frontend
  ↓ Navigate to /enroll/contribution
User fills contribution
  ↓ Submits form
Frontend
  ↓ PUT /api/v1/enrollments/:id
  ↓ Body: { contribution: {...} }
Enrollment Service
  ↓ Merges into JSONB
  ↓ Returns updated enrollment
Frontend
  ↓ Navigate to /enroll/beneficiaries
User adds beneficiaries
  ↓ Submits form
Frontend
  ↓ PUT /api/v1/enrollments/:id
  ↓ Body: { beneficiaries: [...] }
Enrollment Service
  ↓ Merges into JSONB
  ↓ Validates 100% allocation
  ↓ Returns updated enrollment
Frontend
  ↓ Navigate to /enroll/confirmation
User reviews and confirms
  ↓ Final submit
Frontend
  ↓ Navigate to /enroll/success
User sees success message
```

## Database Architecture

### Database Independence
Each service has its own PostgreSQL database with complete isolation:

```
pricing (port 5432)
├── products
├── rate_tables
└── quotes (optional)

enrollment (port 5433)
├── enrollments (with JSONB data column)
├── customers
└── agents

agent (port 5434)
├── agents
└── agent_otps

(LLM Quote Service uses Redis only, no PostgreSQL)
```

### Cross-Service Data Access
Services NEVER directly access other services' databases. All communication is via REST APIs.

**Example**: Agent Service retrieving enrollments
```
❌ WRONG: Direct database query
  agent-service → queries enrollment database

✅ CORRECT: API call
  agent-service → GET /api/v1/enrollments (with JWT)
                → enrollment-service returns data
```

## Caching Strategy

### Pricing Service Redis (Port 6379)
**Current State**: Configured but not actively used
- Designed for quote caching (30-day TTL)
- Designed for rate table caching (1-hour TTL)
- Currently: All calculations in-memory

**Future Enhancement**:
```typescript
// Rate table caching (planned)
const cacheKey = `rate:${productType}:${riskClass}:${age}`;
const cached = await redis.get(cacheKey);
if (cached) return cached; // Fast path

const rate = await db.query(...); // Slow path
await redis.setex(cacheKey, 3600, rate);
```

### LLM Quote Service Redis (Port 6380)
**Active Usage**: Session storage
```typescript
// Session stored with 30min TTL
await redis.setex(
  `session:${sessionId}`,
  1800,
  JSON.stringify(conversationState)
);

// Retrieved on each message
const state = await redis.get(`session:${sessionId}`);
```

## Security Architecture

### Authentication
- **Agent Service**: OTP + JWT
- **Enrollment Service**: Validates JWT from Agent Service
- **Frontend**: Stores JWT in localStorage

### Authorization
- **Row-Level Security**: Enrollments filtered by agent_id
- **JWT Claims**: Token contains agent_id
- **Middleware**: Validates token on protected routes

### Data Protection
- **Encryption at Rest**: Sensitive enrollment data encrypted
- **Encryption in Transit**: HTTPS in production
- **Secret Management**: Environment variables
- **OTP Security**: Bcrypt hashing, 10min expiry, max 5 attempts

### Rate Limiting
- **Pricing Service**: Rate limiter middleware
- **Agent Service**: OTP attempt limiting
- **LLM Quote Service**: Exponential backoff on retries

## Scalability Considerations

### Horizontal Scaling
All services are stateless (except Redis sessions):
```
                  Load Balancer
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    Pricing-1      Pricing-2      Pricing-3
        │              │              │
        └──────────────┴──────────────┘
                       │
                 Shared Redis
```

### Database Scaling
- **Read Replicas**: For enrollment/agent services
- **Connection Pooling**: All services use connection pools
- **JSONB Indexing**: Enrollment service uses JSONB indexes

### Caching Strategy
- **Redis**: Shared cache for pricing service instances
- **Session Store**: Dedicated Redis for LLM sessions
- **Client-Side**: Browser caching for static assets

## Monitoring & Observability

### Health Checks
All services expose `/health` or `/api/v1/health`:
```bash
curl http://localhost:3001/api/v1/health  # Pricing
curl http://localhost:3002/health         # Enrollment
curl http://localhost:3003/health         # Agent
curl http://localhost:3004/api/v1/health  # LLM Quote
```

### Deep Health Checks
Pricing service provides `/api/v1/health/deep`:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy", "responseTime": 15.2 },
    "redis": { "status": "healthy", "responseTime": 2.1 }
  }
}
```

### Logging
- **Structured Logging**: All services use structured loggers
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Correlation IDs**: Request tracking across services

## Deployment Architecture

### Docker Compose (Development)
```yaml
services:
  pricing-service:
    depends_on: [pricing-db, pricing-redis]

  enrollment-service:
    depends_on: [enrollment-db]

  agent-service:
    depends_on: [agent-db]

  llm-quote-service:
    depends_on: [llm-quote-redis, pricing-service]
```

### Production Considerations
- **Container Orchestration**: Kubernetes
- **Service Mesh**: Istio for service-to-service communication
- **Database**: Managed PostgreSQL (AWS RDS, GCP Cloud SQL)
- **Cache**: Managed Redis (AWS ElastiCache, GCP Memorystore)
- **Secrets**: AWS Secrets Manager, GCP Secret Manager
- **CDN**: CloudFront/CloudFlare for frontend assets

## Technology Decisions

### Why Microservices?
1. **Independent Deployment**: Deploy pricing changes without touching enrollment
2. **Technology Flexibility**: Pricing in TypeScript, Agent in JavaScript
3. **Fault Isolation**: Pricing service down ≠ Enrollment service down
4. **Team Autonomy**: Different teams own different services
5. **Scalability**: Scale pricing service independently

### Why JSONB for Enrollments?
1. **Schema Flexibility**: Add fields without migrations
2. **Simplicity**: Single update endpoint
3. **Performance**: JSONB indexing for fast queries
4. **Developer Experience**: Easier to work with
5. **Audit Trail**: Soft deletes preserve history

### Why In-Memory Pricing?
1. **Speed**: ~5ms vs ~50ms with database
2. **Simplicity**: No complex queries
3. **Consistency**: Rate logic in code
4. **Testing**: Easier to test
5. **Future-Proof**: Database tables ready for migration

### Why Redis Sessions?
1. **TTL**: Automatic expiration (30min)
2. **Performance**: Fast reads/writes
3. **Stateless Service**: LLM service can scale
4. **Shared Access**: Multiple instances access same sessions

## Future Enhancements

### Short-Term (Next Quarter)
1. **Quote Persistence**: Store quotes in pricing database
2. **Rate Table Migration**: Move rates from code to database
3. **Analytics**: Add metrics and dashboards
4. **Testing**: Increase test coverage to 80%+

### Medium-Term (6-12 Months)
1. **Payment Integration**: Add payment gateway
2. **Document Generation**: PDF policy documents
3. **Email Notifications**: Automated enrollment emails
4. **Mobile App**: React Native mobile application

### Long-Term (12+ Months)
1. **Machine Learning**: AI-powered risk assessment
2. **Multi-Product**: Expand beyond term life insurance
3. **Internationalization**: Support for Arabic/French
4. **Blockchain**: Immutable policy records

## Troubleshooting Guide

### Service Won't Start
```bash
# Check port availability
lsof -ti:3001

# View logs
docker-compose logs pricing-service

# Restart service
docker-compose restart pricing-service
```

### Database Connection Issues
```bash
# Check if database is running
docker-compose ps

# Test connection
psql -h localhost -p 5432 -U postgres -d pricing

# View migrations
docker-compose exec pricing-db psql -U postgres -d pricing -c "\dt"
```

### Redis Connection Issues
```bash
# Test Redis
docker-compose exec pricing-redis redis-cli ping

# View keys
docker-compose exec pricing-redis redis-cli keys '*'
```

### API Errors
```bash
# Check service health
curl http://localhost:3001/api/v1/health

# View detailed error logs
docker-compose logs -f pricing-service | grep ERROR
```

---

**Last Updated**: December 2025
**Document Owner**: Engineering Team
**Version**: 2.0
