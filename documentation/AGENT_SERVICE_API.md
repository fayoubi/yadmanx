# Agent Service API Guide

Complete guide to the YadmanX Agent Service API with curl examples and authentication flow.

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Complete Authentication Flow](#complete-authentication-flow)
- [API Endpoints](#api-endpoints)
  - [Service Info](#service-info)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Agent Profile](#agent-profile)
  - [Enrollments](#enrollments)
- [Error Responses](#error-responses)
- [Postman Collection](#postman-collection)

## Overview

The Agent Service provides OTP-based authentication and enrollment management for insurance agents. It supports:
- Phone-based OTP authentication (Morocco +212 and France +33)
- JWT token management
- Agent profile management
- Enrollment creation and tracking

## Base URL

```
http://localhost:3003
```

## Authentication

Most endpoints require a JWT Bearer token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Token Expiration
- Access tokens: 24 hours
- OTP codes: 10 minutes
- Failed attempts: 5 max (30-minute lockout)

## Complete Authentication Flow

### Step 1: Register New Agent

```bash
curl -X POST http://localhost:3003/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Ahmed",
    "last_name": "Bennani",
    "email": "ahmed.bennani@example.com",
    "country_code": "+212",
    "phone_number": "612345678",
    "agency_name": "Agence Atlas Assurance",
    "license_number": "ABC007"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Agent registered successfully. Please verify OTP.",
  "data": {
    "agent": {
      "id": "uuid-here",
      "first_name": "Ahmed",
      "last_name": "Bennani",
      "email": "ahmed.bennani@example.com",
      "phone_number": "612345678",
      "country_code": "+212",
      "license_number": "AG-2025-482917",
      "agency_name": "Agence Atlas Assurance",
      "is_active": true,
      "created_at": "2025-10-08T10:00:00Z"
    },
    "otp": {
      "code": "123456",
      "expires_at": "2025-10-08T10:10:00Z"
    }
  }
}
```

### Step 2: Request OTP (for Existing Agents)

```bash
curl -X POST http://localhost:3003/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "612345678",
    "country_code": "+212"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone_number": "612345678",
    "otp": {
      "code": "123456",
      "expires_at": "2025-10-08T10:10:00Z"
    }
  }
}
```

### Step 3: Verify OTP and Get Token

```bash
curl -X POST http://localhost:3003/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "612345678",
    "code": "123456"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "agent": {
    "id": "uuid-here",
    "first_name": "Ahmed",
    "last_name": "Bennani",
    "email": "ahmed.bennani@example.com",
    "phone_number": "612345678",
    "country_code": "+212",
    "license_number": "AG-2025-482917",
    "agency_name": "Agence Atlas Assurance",
    "is_active": true,
    "last_login_at": "2025-10-08T10:00:00Z"
  }
}
```

**Save the token for authenticated requests!**

---

## API Endpoints

### Service Info

#### Get Service Information

```bash
curl http://localhost:3003/
```

**Response:**
```json
{
  "service": "yadmanx Agent Service",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2025-10-08T10:00:00Z",
  "documentation": "/api/docs/"
}
```

#### Health Check

```bash
curl http://localhost:3003/api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-08T10:00:00Z",
  "database": "connected"
}
```

#### View API Documentation

```bash
curl http://localhost:3003/api/docs/
```

Returns HTML documentation page.

---

### Authentication Endpoints

#### Validate Token (Inter-Service)

Public endpoint for other services to validate JWT tokens.

```bash
curl -X POST http://localhost:3003/api/v1/auth/validate \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**Response (200 OK - Valid):**
```json
{
  "status": "success",
  "data": {
    "valid": true,
    "agent": {
      "id": "uuid-here",
      "phoneNumber": "+212612345678",
      "email": "ahmed.bennani@example.com",
      "firstName": "Ahmed",
      "lastName": "Bennani"
    }
  }
}
```

**Response (401 Unauthorized - Invalid):**
```json
{
  "status": "error",
  "data": {
    "valid": false,
    "reason": "Token expired"
  }
}
```

#### Refresh Token

```bash
curl -X POST http://localhost:3003/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token-here"
  }'
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "token": "new-access-token",
    "refreshToken": "new-refresh-token",
    "expiresAt": "2025-10-09T10:00:00Z"
  }
}
```

#### Logout

```bash
curl -X POST http://localhost:3003/api/v1/auth/logout \
  -H "Authorization: Bearer <your-token>"
```

**Response:**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

### Agent Profile

#### Get My Profile

**Requires Authentication**

```bash
curl http://localhost:3003/api/v1/agents/me \
  -H "Authorization: Bearer <your-token>"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "agent": {
      "id": "uuid-here",
      "firstName": "Ahmed",
      "lastName": "Bennani",
      "email": "ahmed.bennani@example.com",
      "phoneNumber": "+212612345678",
      "countryCode": "+212",
      "licenseNumber": "AG-2025-482917",
      "agencyName": "Agence Atlas Assurance",
      "isActive": true,
      "createdAt": "2025-10-08T10:00:00Z",
      "updatedAt": "2025-10-08T10:00:00Z"
    }
  }
}
```

#### Update My Profile

**Requires Authentication**

```bash
curl -X PATCH http://localhost:3003/api/v1/agents/me \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Ahmed",
    "last_name": "El Bennani",
    "email": "ahmed.elbennani@example.com"
  }'
```

**Updatable Fields:**
- `first_name`
- `last_name`
- `email`

**Response:**
```json
{
  "status": "success",
  "data": {
    "agent": {
      "id": "uuid-here",
      "firstName": "Ahmed",
      "lastName": "El Bennani",
      "email": "ahmed.elbennani@example.com",
      "phoneNumber": "+212612345678",
      "countryCode": "+212",
      "licenseNumber": "AG-2025-482917",
      "agencyName": "Agence Atlas Assurance",
      "isActive": true,
      "updatedAt": "2025-10-08T11:00:00Z"
    }
  }
}
```

---

### Enrollments

#### Get All My Enrollments

**Requires Authentication**

```bash
curl http://localhost:3003/api/v1/agents/enrollments \
  -H "Authorization: Bearer <your-token>"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "enrollment-uuid-1",
      "enrollment_id": "enrollment-uuid-1",
      "applicantName": "Mohammed Hassan",
      "status": "in_progress",
      "startDate": "2025-10-05T10:00:00Z",
      "lastUpdated": "2025-10-08T14:30:00Z",
      "customer": {
        "first_name": "Mohammed",
        "last_name": "Hassan",
        "email": "mohammed@example.com",
        "phone": "+212612345678"
      },
      "policy_type": "term_life",
      "coverage_amount": "500000"
    }
  ]
}
```

**Possible Statuses:**
- `draft` - Initial creation
- `in_progress` - Being completed
- `submitted` - Submitted for review
- `approved` - Approved
- `issued` - Policy issued
- `declined` - Application declined

#### Get Enrollment by ID

**Requires Authentication**

```bash
curl http://localhost:3003/api/v1/agents/enrollments/<enrollment-id> \
  -H "Authorization: Bearer <your-token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "enrollment-uuid",
    "enrollment_id": "enrollment-uuid",
    "agent_id": "agent-uuid",
    "status": "in_progress",
    "customer": {
      "first_name": "Mohammed",
      "last_name": "Hassan",
      "email": "mohammed@example.com",
      "phone": "+212612345678",
      "date_of_birth": "1990-05-15",
      "cin": "AB123456",
      "address": {
        "street": "123 Rue Mohammed V",
        "city": "Casablanca",
        "country": "Morocco",
        "postal_code": "20000"
      }
    },
    "policy_type": "term_life",
    "coverage_amount": "500000",
    "billing": {
      "contribution_amount": "500",
      "contribution_frequency": "monthly",
      "payment_method_type": "bank_draft",
      "effective_date": "2025-10-01"
    },
    "beneficiaries": [
      {
        "first_name": "Fatima",
        "last_name": "Hassan",
        "relationship": "spouse",
        "percentage": 100,
        "date_of_birth": "1992-03-20"
      }
    ],
    "created_at": "2025-10-05T10:00:00Z",
    "updated_at": "2025-10-08T14:30:00Z"
  }
}
```

#### Create New Enrollment

**Requires Authentication**

```bash
curl -X POST http://localhost:3003/api/v1/agents/enrollments \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "first_name": "Mohammed",
      "last_name": "Hassan",
      "email": "mohammed.hassan@example.com",
      "phone": "+212623456789",
      "date_of_birth": "1990-05-15",
      "cin": "AB123456",
      "address": {
        "street": "123 Rue Mohammed V",
        "city": "Casablanca",
        "country": "Morocco",
        "postal_code": "20000"
      }
    },
    "policy_type": "term_life",
    "coverage_amount": "500000",
    "billing": {
      "contribution_amount": "500",
      "contribution_frequency": "monthly",
      "payment_method_type": "bank_draft",
      "effective_date": "2025-10-01"
    },
    "beneficiaries": [
      {
        "first_name": "Fatima",
        "last_name": "Hassan",
        "relationship": "spouse",
        "percentage": 100,
        "date_of_birth": "1992-03-20"
      }
    ]
  }'
```

**Required Fields:**
- `customer.first_name`
- `customer.last_name`
- `customer.email`
- `customer.phone`
- `policy_type` (e.g., "term_life", "whole_life")
- `coverage_amount`

**Optional Fields:**
- `customer.date_of_birth`
- `customer.cin`
- `customer.address`
- `billing` (contribution details)
- `beneficiaries` (array)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Enrollment created successfully",
  "data": {
    "enrollment_id": "new-enrollment-uuid",
    "status": "draft",
    "created_at": "2025-10-08T15:00:00Z"
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "phone_number",
      "message": "Phone number must be 9 digits"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "status": "error",
  "message": "Invalid or expired token"
}
```

### 404 Not Found

```json
{
  "status": "error",
  "message": "Resource not found"
}
```

### 429 Too Many Requests

```json
{
  "status": "error",
  "message": "Too many failed attempts. Please try again later.",
  "lockedUntil": "2025-10-08T10:30:00Z"
}
```

### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "Internal server error",
  "error": "Detailed error message"
}
```

---

## Postman Collection

A complete Postman collection is available at:
```
agent-service/YadmanX_Agent_Service.postman_collection.json
```

### Features:
- ✅ Automatic OTP extraction and storage
- ✅ Automatic token management
- ✅ Pre-configured environment variables
- ✅ Test scripts for response validation
- ✅ Organized by workflow (Auth → Profile → Enrollments)

### Import Instructions:
1. Open Postman
2. Click **Import** button
3. Select the JSON file
4. Collection will be ready to use!

### Environment Variables:
The collection uses these variables:
- `baseUrl` - Default: http://localhost:3003
- `accessToken` - Auto-populated from verify-otp
- `otpCode` - Auto-populated from register/request-otp
- `phoneNumber` - Your test phone number
- `agentId` - Auto-populated after login
- `enrollmentId` - Auto-populated after creating enrollment

---

## Testing Workflow

### 1. Quick Test with Existing Agent

```bash
# 1. Request OTP
curl -X POST http://localhost:3003/api/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "612345678", "country_code": "+212"}'

# 2. Copy OTP code from response and verify
curl -X POST http://localhost:3003/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "612345678", "code": "123456"}'

# 3. Copy token from response
export TOKEN="your-token-here"

# 4. Get your profile
curl http://localhost:3003/api/v1/agents/me \
  -H "Authorization: Bearer $TOKEN"

# 5. Get enrollments
curl http://localhost:3003/api/v1/agents/enrollments \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Complete New Agent Flow

```bash
# 1. Register
curl -X POST http://localhost:3003/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "Agent",
    "email": "test@example.com",
    "country_code": "+212",
    "phone_number": "698765432",
    "agency_name": "Test Agency"
  }'

# 2. Verify OTP from response
# 3. Use token for authenticated requests
```

---

## Rate Limiting

- **OTP Requests**: 5 per phone number per hour
- **Failed OTP Attempts**: 5 max (30-minute lockout)
- **General API**: 100 requests per IP per 15 minutes

---

## Development Tips

### Check OTP Codes
In development mode, OTP codes are included in responses. In production, they're sent via SMS.

### Token Management
- Store tokens securely
- Implement refresh token logic before expiration
- Handle 401 responses by requesting new login

### Testing Phone Numbers
Use test phone numbers in Morocco (+212) or France (+33) format:
- Morocco: +212 followed by 9 digits
- France: +33 followed by 9 digits

### Database Access
Check agent data directly:
```bash
psql -h localhost -p 5434 -U postgres -d agent
SELECT * FROM agents;
SELECT * FROM otp_sessions WHERE phone_number = '612345678';
```

---

For interactive API testing, visit: **http://localhost:3003/api/docs/**
