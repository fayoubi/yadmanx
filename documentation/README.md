# YadmanX Documentation

This directory contains all technical documentation for the YadmanX life insurance platform.

## 📚 Documentation Index

### API Guides

- **[AGENT_SERVICE_API.md](./AGENT_SERVICE_API.md)** - Complete Agent Service API guide
  - All endpoints with curl examples
  - Complete authentication flow
  - OTP-based login walkthrough
  - Enrollment management
  - Error handling and troubleshooting
  - Postman collection included

### Database & Infrastructure

- **[DATABASE_ACCESS.md](./DATABASE_ACCESS.md)** - Complete guide to accessing and querying PostgreSQL databases for each service
  - Connection commands for pricing, enrollment, and agent databases
  - Common SQL queries
  - Database schema reference

- **[REDIS_USAGE.md](./REDIS_USAGE.md)** - How Redis is used in the pricing service
  - Data flow diagrams
  - Cache strategies
  - Performance implications
  - Why quotes use in-memory calculations

### Implementation Guides

- **[PRICING_INTEGRATION.md](./PRICING_INTEGRATION.md)** - Pricing service integration documentation
  - API endpoints
  - Request/response formats
  - Integration patterns

- **[pricing.md](./pricing.md)** - Detailed pricing service documentation
  - Architecture overview
  - Rate calculation logic
  - Product configurations

### Project Documentation

- **[IMPLEMENTATION_SUMMARY_V2.md](./IMPLEMENTATION_SUMMARY_V2.md)** - Complete implementation summary
  - Features implemented
  - Architecture decisions
  - Technical stack

- **[REQUIREMENTS.md](./REQUIREMENTS.md)** - Project requirements and specifications
  - Functional requirements
  - Technical requirements
  - Business rules

## 🔗 Quick Links

### API Documentation
- Pricing Service: http://localhost:3001/api/docs/
- Enrollment Service: http://localhost:3002/api/docs/
- Agent Service: http://localhost:3003/api/docs/

### Database Access
```bash
# Pricing DB
psql -h localhost -p 5432 -U postgres -d pricing

# Enrollment DB
psql -h localhost -p 5433 -U postgres -d enrollment

# Agent DB
psql -h localhost -p 5434 -U postgres -d agent
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
├── README.md                        # This file
├── AGENT_SERVICE_API.md             # Agent Service API guide with curl examples
├── DATABASE_ACCESS.md               # Database access guide
├── REDIS_USAGE.md                   # Redis usage patterns
├── PRICING_INTEGRATION.md           # Pricing API integration
├── pricing.md                       # Pricing service details
├── IMPLEMENTATION_SUMMARY_V2.md     # Implementation overview
└── REQUIREMENTS.md                  # Project requirements
```

## 📦 Additional Resources

### Postman Collections
- **Agent Service**: `../agent-service/YadmanX_Agent_Service.postman_collection.json`

Import into Postman for interactive API testing with automatic token management.
