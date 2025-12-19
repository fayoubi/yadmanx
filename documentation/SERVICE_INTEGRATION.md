# Service Integration Guide

## Overview

This document describes how the four YadmanX microservices integrate and communicate with each other and the frontend application. Each service exposes REST APIs and follows specific integration patterns.

## Integration Patterns

### 1. Frontend-to-Service (Direct HTTP)

**Pattern**: Frontend makes direct HTTP calls to service APIs

**Used For**:
- Quote calculation (Frontend → Pricing)
- Enrollment management (Frontend → Enrollment)
- Agent authentication (Frontend → Agent)
- AI conversations (Frontend → LLM Quote)

**Example**:
```typescript
// Frontend service client
class PricingService {
  private baseURL = process.env.REACT_APP_PRICING_SERVICE_URL;

  async calculateQuote(data: QuoteRequest): Promise<Quote> {
    const response = await fetch(`${this.baseURL}/api/v1/quotes/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}
```

### 2. Service-to-Service (Internal HTTP)

**Pattern**: Backend services call other backend services' APIs

**Used For**:
- LLM Quote Service → Pricing Service (quote calculation)
- Agent Service → Enrollment Service (fetch enrollments)

**Example**:
```typescript
// LLM Quote Service calling Pricing Service
class QuoteIntegration {
  private baseURL = process.env.PRICING_SERVICE_URL;

  async calculateQuote(data: ExtractedData): Promise<Quote> {
    const response = await fetch(`${this.baseURL}/api/v1/quotes/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.transformData(data)),
      timeout: 10000
    });
    return response.json();
  }
}
```

### 3. Token-Based Authentication

**Pattern**: JWT tokens for service authentication

**Used For**:
- Agent authentication
- Protected enrollment operations

**Flow**:
```
Frontend → Agent Service (request OTP)
         → Agent Service (verify OTP, get JWT)
         → Store JWT in localStorage
         → Include JWT in subsequent requests
         → Services validate JWT
```

## Service Integration Matrix

| From Service | To Service | Integration Type | Purpose |
|--------------|------------|------------------|---------|
| Frontend | Pricing | Direct HTTP | Calculate quotes |
| Frontend | Enrollment | Direct HTTP + JWT | Manage enrollments |
| Frontend | Agent | Direct HTTP | Authentication |
| Frontend | LLM Quote | Direct HTTP | AI conversations |
| LLM Quote | Pricing | Service-to-Service | Calculate quotes |
| Agent | Enrollment | JWT validation | Fetch agent's enrollments |

## Integration Specifications

### 1. Frontend → Pricing Service

**Purpose**: Calculate insurance quotes

**Endpoint**: `POST /api/v1/quotes/calculate`

**Request Format**:
```json
{
  "productType": "term_life",
  "applicant": {
    "gender": "Male",
    "birthDate": "1990-05-15",
    "height": 180,
    "weight": 80,
    "city": "Casablanca",
    "usesNicotine": false
  },
  "policy": {
    "termLength": 20,
    "coverageAmount": 500000
  }
}
```

**Response Format**:
```json
{
  "success": true,
  "quote": {
    "quoteId": "quote_...",
    "productType": "term_life",
    "pricing": {
      "monthlyPremium": 45.50,
      "annualPremium": 546.00
    },
    "riskAssessment": {
      "riskClass": "Preferred",
      "bmi": 24.7,
      "age": 34,
      "riskFactors": []
    },
    "eligibilityFlags": {
      "wouldDeclinePostUnderwriting": false,
      "requiresAdditionalUnderwriting": false
    },
    "createdAt": "2025-12-11T10:00:00Z",
    "expiresAt": "2026-01-10T10:00:00Z"
  }
}
```

**Frontend Implementation**:
```typescript
// src/services/pricingService.ts
export class PricingService {
  async calculateQuote(formData: QuoteFormData): Promise<Quote> {
    const request = this.transformToAPI(formData);

    const response = await fetch(
      `${process.env.REACT_APP_PRICING_SERVICE_URL}/api/v1/quotes/calculate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      }
    );

    if (!response.ok) {
      throw new Error('Failed to calculate quote');
    }

    const data = await response.json();
    return data.quote;
  }

  private transformToAPI(formData: QuoteFormData): PricingRequest {
    return {
      productType: 'term_life',
      applicant: {
        gender: formData.gender === 'male' ? 'Male' : 'Female',
        birthDate: formData.dateOfBirth,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        city: formData.city,
        usesNicotine: formData.usesNicotine
      },
      policy: {
        termLength: parseInt(formData.termLength),
        coverageAmount: 500000
      }
    };
  }
}
```

**Error Handling**:
```typescript
try {
  const quote = await pricingService.calculateQuote(formData);
  // Handle success
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error
    showError('Please check your input');
  } else if (error.response?.status === 503) {
    // Service unavailable
    showError('Service temporarily unavailable');
  } else {
    // Network or unknown error
    showError('Failed to calculate quote');
  }
}
```

---

### 2. Frontend → Agent Service (Authentication)

**Purpose**: Agent login via OTP

**Flow**:
```
1. Request OTP    → POST /api/v1/auth/request-otp
2. Verify OTP     → POST /api/v1/auth/verify-otp
3. Get Profile    → GET /api/v1/agents/profile (with JWT)
```

**Step 1: Request OTP**

**Endpoint**: `POST /api/v1/auth/request-otp`

**Request**:
```json
{
  "phoneNumber": "612345678",
  "countryCode": "+212"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 600
}
```

**Step 2: Verify OTP**

**Endpoint**: `POST /api/v1/auth/verify-otp`

**Request**:
```json
{
  "phoneNumber": "612345678",
  "countryCode": "+212",
  "otp": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "agent": {
    "id": "agent-uuid",
    "firstName": "Ahmed",
    "lastName": "Benali",
    "email": "ahmed@example.com",
    "phoneNumber": "+212612345678",
    "licenseNumber": "AG-2025-001234"
  }
}
```

**Frontend Implementation**:
```typescript
// src/services/agentService.ts
export class AgentService {
  async requestOTP(phoneNumber: string, countryCode: string) {
    const response = await fetch(
      `${process.env.REACT_APP_AGENT_SERVICE_URL}/api/v1/auth/request-otp`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, countryCode })
      }
    );
    return response.json();
  }

  async verifyOTP(phoneNumber: string, countryCode: string, otp: string) {
    const response = await fetch(
      `${process.env.REACT_APP_AGENT_SERVICE_URL}/api/v1/auth/verify-otp`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, countryCode, otp })
      }
    );

    const data = await response.json();

    if (data.success) {
      // Store JWT in localStorage
      localStorage.setItem('agent_token', data.token);
      localStorage.setItem('agent_profile', JSON.stringify(data.agent));
    }

    return data;
  }

  async getProfile() {
    const token = localStorage.getItem('agent_token');

    const response = await fetch(
      `${process.env.REACT_APP_AGENT_SERVICE_URL}/api/v1/agents/profile`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return response.json();
  }

  logout() {
    localStorage.removeItem('agent_token');
    localStorage.removeItem('agent_profile');
  }
}
```

---

### 3. Frontend → Enrollment Service

**Purpose**: Manage customer enrollments

**Endpoints**:
```
POST   /api/v1/enrollments       - Create
GET    /api/v1/enrollments       - List
GET    /api/v1/enrollments/:id   - Get one
PUT    /api/v1/enrollments/:id   - Update
DELETE /api/v1/enrollments/:id   - Delete
```

**Create Enrollment**:

**Request**:
```http
POST /api/v1/enrollments
Authorization: Bearer <jwt-token>
```

**Response**:
```json
{
  "success": true,
  "enrollment": {
    "id": "enrollment-uuid",
    "agent_id": "agent-uuid",
    "customer_id": null,
    "data": {},
    "created_at": "2025-12-11T10:00:00Z"
  }
}
```

**Update Enrollment** (Merge Pattern):

**Request**:
```http
PUT /api/v1/enrollments/enrollment-uuid
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "personalInfo": {
    "subscriber": {
      "firstName": "Ahmed",
      "lastName": "Benali",
      "email": "ahmed@example.com",
      "phone": "+212612345678",
      "cin": "AB123456",
      "dateOfBirth": "1990-05-15",
      "city": "Casablanca"
    },
    "insured": {
      "sameAsSubscriber": true
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "enrollment": {
    "id": "enrollment-uuid",
    "agent_id": "agent-uuid",
    "customer_id": "customer-uuid",
    "data": {
      "personalInfo": {
        "subscriber": { /* full data */ }
      }
    },
    "updated_at": "2025-12-11T10:05:00Z"
  }
}
```

**Frontend Implementation**:
```typescript
// src/services/enrollmentService.ts
export class EnrollmentService {
  private getHeaders() {
    const token = localStorage.getItem('agent_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async createEnrollment() {
    const response = await fetch(
      `${process.env.REACT_APP_ENROLLMENT_SERVICE_URL}/api/v1/enrollments`,
      {
        method: 'POST',
        headers: this.getHeaders()
      }
    );
    return response.json();
  }

  async updateEnrollment(id: string, data: Partial<EnrollmentData>) {
    const response = await fetch(
      `${process.env.REACT_APP_ENROLLMENT_SERVICE_URL}/api/v1/enrollments/${id}`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      }
    );
    return response.json();
  }

  async getEnrollment(id: string) {
    const response = await fetch(
      `${process.env.REACT_APP_ENROLLMENT_SERVICE_URL}/api/v1/enrollments/${id}`,
      {
        headers: this.getHeaders()
      }
    );
    return response.json();
  }
}
```

**JSONB Merge Behavior**:
```typescript
// Enrollment has: { personalInfo: {...} }

// Update with contribution
await enrollmentService.updateEnrollment(id, {
  contribution: { amount: 100, ... }
});

// Result: { personalInfo: {...}, contribution: {...} }
// personalInfo is preserved!
```

---

### 4. Frontend → LLM Quote Service

**Purpose**: AI-powered conversational quote generation

**Flow**:
```
1. Create conversation
2. Send messages (multiple turns)
3. Confirm and calculate quote
```

**Create Conversation**:

**Request**:
```http
POST /api/v1/conversations
```

**Response**:
```json
{
  "success": true,
  "sessionId": "uuid",
  "initialMessage": "Hello! I can help you get a quote...",
  "status": "collecting"
}
```

**Send Message**:

**Request**:
```http
POST /api/v1/conversations/uuid/message
Content-Type: application/json

{
  "message": "I'm a 34 year old male"
}
```

**Response**:
```json
{
  "success": true,
  "sessionId": "uuid",
  "aiResponse": "Great! What is your height in centimeters?",
  "extractedData": {
    "gender": "male",
    "dateOfBirth": "1989-12-11"
  },
  "status": "collecting",
  "progress": {
    "current": 2,
    "total": 7,
    "fieldsCollected": ["gender", "dateOfBirth"]
  },
  "inputType": "number"
}
```

**Frontend Implementation**:
```typescript
// src/services/llmQuoteService.ts
export class LLMQuoteService {
  async createConversation() {
    const response = await fetch(
      `${process.env.REACT_APP_LLM_QUOTE_SERVICE_URL}/api/v1/conversations`,
      { method: 'POST' }
    );
    return response.json();
  }

  async sendMessage(sessionId: string, message: string) {
    const response = await fetch(
      `${process.env.REACT_APP_LLM_QUOTE_SERVICE_URL}/api/v1/conversations/${sessionId}/message`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      }
    );
    return response.json();
  }

  async confirmAndCalculate(sessionId: string) {
    const response = await fetch(
      `${process.env.REACT_APP_LLM_QUOTE_SERVICE_URL}/api/v1/conversations/${sessionId}/confirm`,
      { method: 'POST' }
    );
    return response.json();
  }
}
```

---

### 5. LLM Quote Service → Pricing Service

**Purpose**: Calculate quote after data collection

**Internal Integration**:

```typescript
// llm-quote-service/src/services/QuoteIntegration.ts
export class QuoteIntegration {
  private baseURL = process.env.PRICING_SERVICE_URL;

  async calculateQuote(data: ExtractedData): Promise<Quote> {
    // Transform extracted data to pricing format
    const request = {
      productType: 'term_life',
      applicant: {
        gender: data.gender === 'male' ? 'Male' : 'Female',
        birthDate: data.dateOfBirth,
        height: data.height,
        weight: data.weight,
        city: data.city,
        usesNicotine: data.usesNicotine
      },
      policy: {
        termLength: data.termLength,
        coverageAmount: data.coverageAmount || 500000
      }
    };

    // Call pricing service
    const response = await fetch(
      `${this.baseURL}/api/v1/quotes/calculate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        timeout: 10000
      }
    );

    if (!response.ok) {
      throw new Error(`Pricing service error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.quote;
  }
}
```

**Error Handling**:
```typescript
try {
  const quote = await this.quoteIntegration.calculateQuote(extractedData);
  // Return quote to user
} catch (error) {
  logger.error('Quote calculation failed', { error, sessionId });
  // Return error to user
  return {
    aiResponse: 'Sorry, I encountered an error calculating your quote. Please try again.',
    status: 'error'
  };
}
```

---

## Environment Configuration

### Frontend (.env.local)
```bash
REACT_APP_PRICING_SERVICE_URL=http://localhost:3001
REACT_APP_ENROLLMENT_SERVICE_URL=http://localhost:3002
REACT_APP_AGENT_SERVICE_URL=http://localhost:3003
REACT_APP_LLM_QUOTE_SERVICE_URL=http://localhost:3004
REACT_APP_ENV=development
```

### Backend Services

**Pricing Service** (.env):
```bash
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@pricing-db:5432/pricing
REDIS_URL=redis://pricing-redis:6379
NODE_ENV=development
```

**Enrollment Service** (.env):
```bash
PORT=3002
DATABASE_URL=postgresql://postgres:postgres@enrollment-db:5432/enrollment
ENCRYPTION_KEY=dev-key-change-in-production
NODE_ENV=development
```

**Agent Service** (.env):
```bash
PORT=3003
DATABASE_URL=postgresql://postgres:postgres@agent-db:5432/agent
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_EXPIRES_IN=24h
ENROLLMENT_SERVICE_URL=http://enrollment-service:3002
NODE_ENV=development
```

**LLM Quote Service** (llm-quote-service/.env):
```bash
CLAUDE_API_KEY=sk-ant-api03-...
PORT=3004
REDIS_HOST=llm-quote-redis
PRICING_SERVICE_URL=http://pricing-service:3001
NODE_ENV=development
```

---

## CORS Configuration

### Pricing Service
```typescript
// pricing-service/src/index.ts
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true
}));
```

### All Services
```bash
# Development
CORS_ORIGINS=http://localhost:3000

# Production
CORS_ORIGINS=https://yadmanx.com,https://www.yadmanx.com
```

---

## Error Handling Patterns

### 1. Network Errors

**Frontend**:
```typescript
try {
  const quote = await pricingService.calculateQuote(data);
} catch (error) {
  if (error.message === 'Failed to fetch') {
    // Network error
    showError('Network connection failed. Please check your internet.');
  }
}
```

### 2. Service Unavailable

**Backend**:
```typescript
// LLM Quote Service calling Pricing Service
try {
  const quote = await fetch(pricingServiceURL, { timeout: 10000 });
} catch (error) {
  logger.error('Pricing service unavailable', { error });
  throw new ServiceUnavailableError('Pricing service is temporarily unavailable');
}
```

**Frontend**:
```typescript
if (error.response?.status === 503) {
  showError('Service temporarily unavailable. Please try again in a moment.');
}
```

### 3. Validation Errors

**Backend Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "height": "Height must be between 100 and 250 cm",
      "weight": "Weight is required"
    }
  }
}
```

**Frontend Handling**:
```typescript
if (error.response?.status === 400) {
  const { details } = error.response.data.error;
  Object.entries(details).forEach(([field, message]) => {
    setFieldError(field, message);
  });
}
```

### 4. Authentication Errors

**Backend Response**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

**Frontend Handling**:
```typescript
if (error.response?.status === 401) {
  // Clear token
  localStorage.removeItem('agent_token');
  // Redirect to login
  navigate('/agent/login');
}
```

---

## Testing Integration

### Integration Test Example

```typescript
// Test: LLM Quote Service → Pricing Service
describe('LLM Quote Integration', () => {
  it('should calculate quote after data collection', async () => {
    // 1. Create conversation
    const conv = await llmQuoteService.createConversation();

    // 2. Provide all 7 fields
    await llmQuoteService.sendMessage(conv.sessionId, 'I am a 34 year old male');
    await llmQuoteService.sendMessage(conv.sessionId, '180 cm');
    await llmQuoteService.sendMessage(conv.sessionId, '80 kg');
    await llmQuoteService.sendMessage(conv.sessionId, 'Casablanca');
    await llmQuoteService.sendMessage(conv.sessionId, 'No nicotine');
    await llmQuoteService.sendMessage(conv.sessionId, '20 years');

    // 3. Confirm and calculate
    const result = await llmQuoteService.confirmAndCalculate(conv.sessionId);

    // 4. Verify quote was calculated
    expect(result.quote).toBeDefined();
    expect(result.quote.pricing.monthlyPremium).toBeGreaterThan(0);
  });
});
```

---

## Monitoring Integration

### Health Check All Services

```bash
#!/bin/bash
# check-all-services.sh

services=(
  "Pricing:3001"
  "Enrollment:3002"
  "Agent:3003"
  "LLM Quote:3004"
)

for service in "${services[@]}"; do
  name="${service%%:*}"
  port="${service##*:}"

  if curl -sf "http://localhost:$port/health" > /dev/null 2>&1 || \
     curl -sf "http://localhost:$port/api/v1/health" > /dev/null 2>&1; then
    echo "✅ $name (port $port) - healthy"
  else
    echo "❌ $name (port $port) - unhealthy"
  fi
done
```

---

**Last Updated**: December 2025
**Document Owner**: Engineering Team
**Version**: 1.0
