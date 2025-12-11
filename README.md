
# Quote - Life Insurance Application

A modern React application for life insurance quotes and enrollment with contribution management.

## ✅ Start all services (Frontend + All Backend Services)

The application consists of a React frontend and four backend microservices:

### Quick Start with Script

The easiest way to start everything and verify health:

```bash
./start-yadmanx.sh
```

**Prerequisites:**
- Docker and Docker Compose installed
- Node.js and npm installed
- `llm-quote-service/.env` file configured with your Claude API key (copy from `.env.example`)

This script will:
- Verify required environment files exist
- Start all backend services (pricing, enrollment, agent, llm-quote)
- Wait for all services to be healthy
- Start the React development server
- Display service status and health checks

### Manual Start

1. **Start all backend services:**
   ```bash
   docker-compose up -d
   ```

2. **Wait for services to be ready:**
   ```bash
   # Check pricing service (port 3001)
   curl http://localhost:3001/api/v1/health

   # Check enrollment service (port 3002)
   curl http://localhost:3002/health

   # Check agent service (port 3003)
   curl http://localhost:3003/health

   # Check LLM quote service (port 3004)
   curl http://localhost:3004/api/v1/health
   ```

3. **Configure frontend environment:**
   ```bash
   echo "REACT_APP_PRICING_SERVICE_URL=http://localhost:3001" > .env.local
   echo "REACT_APP_ENROLLMENT_SERVICE_URL=http://localhost:3002" >> .env.local
   echo "REACT_APP_AGENT_SERVICE_URL=http://localhost:3003" >> .env.local
   echo "REACT_APP_LLM_QUOTE_SERVICE_URL=http://localhost:3004" >> .env.local
   echo "REACT_APP_ENV=development" >> .env.local
   ```

4. **Start the React app:**
   ```bash
   npm start
   ```

### Service Endpoints

- **Frontend**: http://localhost:3000
- **Pricing Service**: http://localhost:3001
- **Enrollment Service**: http://localhost:3002
- **Agent Service**: http://localhost:3003
- **LLM Quote Service** (AI-powered quotes): http://localhost:3004

### Databases

- **Pricing DB**: PostgreSQL on port 5432
- **Enrollment DB**: PostgreSQL on port 5433
- **Agent DB**: PostgreSQL on port 5434
- **Pricing Redis Cache**: port 6379
- **LLM Quote Redis Cache**: port 6380

#### Quick psql Access

```bash
# Pricing Service
psql -h localhost -p 5432 -U postgres -d pricing

# Enrollment Service
psql -h localhost -p 5433 -U postgres -d enrollment

# Agent Service
psql -h localhost -p 5434 -U postgres -d agent
```

Password for all: `postgres`

See [DATABASE_ACCESS.md](./documentation/DATABASE_ACCESS.md) for detailed database documentation.

**Note**: The pricing service currently uses **in-memory calculations** for quote generation. The database tables (`products`, `rate_tables`) are populated but not queried during normal operation. See [REDIS_USAGE.md](./documentation/REDIS_USAGE.md) for details on data flow.

## 🚀 Quick Start

### Development Setup

To run the complete application locally, you need both the frontend and all backend services:

#### Local Development

1. **Start all backend services** (Docker Compose):
   ```bash
   docker-compose up -d
   ```

2. **Configure environment** (if not already done):
   ```bash
   echo "REACT_APP_PRICING_SERVICE_URL=http://localhost:3001" > .env.local
   echo "REACT_APP_ENROLLMENT_SERVICE_URL=http://localhost:3002" >> .env.local
   echo "REACT_APP_AGENT_SERVICE_URL=http://localhost:3003" >> .env.local
   echo "REACT_APP_LLM_QUOTE_SERVICE_URL=http://localhost:3004" >> .env.local
   echo "REACT_APP_ENV=development" >> .env.local
   ```

3. **Start the React App**:
   ```bash
   npm start
   ```

### Testing the API

Run the comprehensive API test suite:
```bash
npm run test-api
```

This validates:
- Health check endpoint
- Quote calculation
- Contribution validation
- Error handling

## 📋 Features

### ✅ Quote Calculation
- Interactive form with real-time validation
- Age, height, weight, and location-based pricing
- Nicotine use consideration
- Instant quote generation

### ✅ AI-Powered Quote Generation (New!)
- Conversational interface for gathering quote information
- Natural language processing using Claude AI
- Progressive data collection with intelligent follow-up questions
- Automatic quote calculation upon completion
- Accessible via `/ai-quote` route

### ✅ Contribution Management
- Payment frequency selection (Monthly, Quarterly, Bi-annual, Annual)
- Minimum contribution validation:
  - Monthly: 250 MAD
  - Quarterly: 750 MAD
  - Bi-annual: 1,500 MAD
  - Annual: 3,000 MAD
- Automatic monthly equivalent and annual total calculation

### ✅ Enrollment Flow
- Step-by-step process: Quote → Personal Info → Contribution
- Form validation and error handling
- Prepopulation of enrollment forms from quote data

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Components**: Modular React components with TypeScript
- **Services**: API integration with fallback validation
- **Context**: Quote and application state management
- **UI Kit**: Reusable components (Button, Input, Card, etc.)

### Backend (Mock Service)
- **Quote Calculation**: Risk assessment and premium calculation
- **Contribution Validation**: Business rule enforcement
- **CORS Enabled**: Ready for frontend integration

## 🔧 Available Scripts

- `npm start` - Start React development server
- `npm run build` - Build for production
- `npm run test` - Run React tests
- `npm run test-api` - Test API endpoints

## 🛠️ Configuration

### Environment Variables

Create a `.env.local` file for the frontend:
```
REACT_APP_PRICING_SERVICE_URL=http://localhost:3001
REACT_APP_ENROLLMENT_SERVICE_URL=http://localhost:3002
REACT_APP_AGENT_SERVICE_URL=http://localhost:3003
REACT_APP_LLM_QUOTE_SERVICE_URL=http://localhost:3004
REACT_APP_ENV=development
```

Configure `llm-quote-service/.env` (required for AI quotes):
```
CLAUDE_API_KEY=your_claude_api_key_here
CLAUDE_MODEL=claude-3-5-haiku-20241022
```

### API Endpoints

**Pricing Service** (port 3001):
- `GET /api/v1/health` - Health check
- `POST /api/v1/quotes/calculate` - Quote calculation
- `POST /api/v1/contributions/validate` - Contribution validation

**LLM Quote Service** (port 3004):
- `GET /api/v1/health` - Health check
- `POST /api/v1/conversations` - Create new conversation
- `POST /api/v1/conversations/:id/message` - Send message
- `POST /api/v1/conversations/:id/confirm` - Confirm and calculate quote
- `GET /api/v1/conversations/:id/summary` - Get conversation summary

## 🚨 Troubleshooting

### "Failed to fetch" Error

If you encounter a "Failed to fetch" error:

1. **Check if the pricing service is running**:
   ```bash
   curl http://localhost:3001/api/v1/health
   ```

2. **Test the API**:
   ```bash
   npm run test-api
   ```

3. **Check the console** for any CORS or network errors

### Port Conflicts

- Frontend runs on port 3000
- Backend runs on port 3001
- Kill any existing processes: `lsof -ti:3000 | xargs kill -9`

## 🔄 Deployment

For production deployment:

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Deploy the `build` folder to your hosting service

3. Replace the mock server with a real pricing service API

## 📁 Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── QuoteForm.tsx   # Quote calculation form
│   │   ├── ContributionForm.tsx # Contribution management
│   │   └── InsuranceForm.tsx # Personal information form
│   ├── services/           # API integration
│   ├── types/             # TypeScript type definitions
│   └── context/           # React context providers
├── pricing-service/        # Real pricing backend (Docker Compose)
├── documentation/          # Documentation files
│   ├── DATABASE_ACCESS.md
│   ├── REDIS_USAGE.md
│   └── ... (other docs)
├── test-quote-api.js      # API test suite
└── README.md
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test with `npm run test-api`
4. Build with `npm run build`
5. Submit a pull request

---

For questions or issues, please check the API test results first with `npm run test-api`.
