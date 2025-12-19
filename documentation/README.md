# YadmanX Documentation

This directory contains all technical documentation for the YadmanX life insurance platform.

## 📚 Documentation Index

### System Architecture

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - **START HERE** - Complete system architecture documentation
  - High-level architecture overview
  - Service responsibilities and interactions
  - Data flow between services
  - Technology decisions and rationale
  - Scalability and deployment considerations
  - Troubleshooting guide

- **[yadmanx-README.md](./yadmanx-README.md)** - Platform overview and quick start guide
  - What YadmanX does
  - Technology stack
  - Getting started guide
  - Project structure

### Service Documentation

- **[LLM_QUOTE_SERVICE.md](./LLM_QUOTE_SERVICE.md)** - AI-powered conversational quote service
  - Claude AI integration
  - Conversation flow and dialogue management
  - Data extraction and validation
  - API endpoints and usage
  - Session management with Redis
  - Error handling and retry logic

- **[AGENT_SERVICE_API.md](./AGENT_SERVICE_API.md)** - Complete Agent Service API guide
  - All endpoints with curl examples
  - Complete authentication flow
  - OTP-based login walkthrough
  - Enrollment management
  - Error handling and troubleshooting
  - Postman collection included

- **[PRICING_INTEGRATION.md](./PRICING_INTEGRATION.md)** - Pricing service integration documentation
  - API endpoints
  - Request/response formats
  - Integration patterns

- **[pricing.md](./pricing.md)** - Detailed pricing service documentation
  - Architecture overview
  - Rate calculation logic
  - Product configurations

### Integration & Communication

- **[SERVICE_INTEGRATION.md](./SERVICE_INTEGRATION.md)** - Inter-service communication patterns
  - Frontend-to-service integration
  - Service-to-service integration
  - Authentication and authorization flows
  - API request/response formats
  - Error handling patterns
  - Environment configuration

### Frontend Development

- **[FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md)** - Complete frontend application guide
  - React application structure
  - Routing architecture
  - State management with Context API
  - Component library and patterns
  - User flows (traditional quote, AI quote, enrollment, agent auth)
  - Styling with Tailwind CSS
  - Best practices

### Database & Infrastructure

- **[DATABASE_ACCESS.md](./DATABASE_ACCESS.md)** - Complete guide to accessing and querying PostgreSQL databases
  - Connection commands for pricing, enrollment, and agent databases
  - Common SQL queries
  - Database schema reference

- **[REDIS_USAGE.md](./REDIS_USAGE.md)** - Redis usage in pricing and LLM quote services
  - Data flow diagrams
  - Cache strategies
  - Session management
  - Performance implications
  - Why quotes use in-memory calculations

### Implementation Details

- **[IMPLEMENTATION_SUMMARY_V2.md](./IMPLEMENTATION_SUMMARY_V2.md)** - Enrollment service V2 implementation
  - JSONB-based architecture
  - Migration from V1 to V2
  - API changes and benefits

- **[REQUIREMENTS.md](./REQUIREMENTS.md)** - Project requirements and specifications
  - Functional requirements
  - Technical requirements
  - Business rules

## 🔗 Quick Links

### Service Endpoints
- **Frontend**: http://localhost:3000
- **Pricing Service**: http://localhost:3001 (API docs: /api/docs)
- **Enrollment Service**: http://localhost:3002
- **Agent Service**: http://localhost:3003
- **LLM Quote Service**: http://localhost:3004 (AI-powered quotes)

### Health Checks
```bash
# Check all services
curl http://localhost:3001/api/v1/health  # Pricing
curl http://localhost:3002/health         # Enrollment
curl http://localhost:3003/health         # Agent
curl http://localhost:3004/api/v1/health  # LLM Quote
```

### Database Access
```bash
# Pricing DB
psql -h localhost -p 5432 -U postgres -d pricing

# Enrollment DB
psql -h localhost -p 5433 -U postgres -d enrollment

# Agent DB
psql -h localhost -p 5434 -U postgres -d agent
```

### Redis Access
```bash
# Pricing Redis (caching)
docker-compose exec pricing-redis redis-cli

# LLM Quote Redis (sessions)
docker-compose exec llm-quote-redis redis-cli
```

## 📝 Contributing to Documentation

When adding new documentation:

1. Place the `.md` file in this directory
2. Update this README.md index
3. Link to it from the main [README.md](../README.md) if relevant
4. Follow the existing documentation style

## 🏗️ Documentation Structure

```
documentation/
├── README.md                        # This file - documentation index
│
├── System Architecture
│   ├── ARCHITECTURE.md              # Complete system architecture (START HERE)
│   └── yadmanx-README.md            # Platform overview and quick start
│
├── Service Documentation
│   ├── LLM_QUOTE_SERVICE.md         # AI conversational quote service
│   ├── AGENT_SERVICE_API.md         # Agent authentication service
│   ├── PRICING_INTEGRATION.md       # Pricing service API
│   └── pricing.md                   # Pricing service details
│
├── Integration
│   ├── SERVICE_INTEGRATION.md       # Inter-service communication
│   └── FRONTEND_GUIDE.md            # Frontend application guide
│
├── Database & Infrastructure
│   ├── DATABASE_ACCESS.md           # PostgreSQL access guide
│   └── REDIS_USAGE.md               # Redis caching and sessions
│
└── Implementation
    ├── IMPLEMENTATION_SUMMARY_V2.md # Enrollment V2 implementation
    └── REQUIREMENTS.md              # Project requirements
```

## 📦 Additional Resources

### Postman Collections
- **Agent Service**: `../agent-service/YadmanX_Agent_Service.postman_collection.json`

Import into Postman for interactive API testing with automatic token management.
