# LLM Quote Service - AI-Powered Conversational Quote Generation

## Overview

The LLM Quote Service provides an intelligent, conversational interface for collecting insurance quote information using Claude AI (Anthropic). Instead of traditional forms, users engage in natural dialogue where the AI guides them through the quote process.

## Key Features

✅ Natural language data collection
✅ Claude 3.5 Haiku integration (cost-effective, fast)
✅ Multi-turn conversation management
✅ Progressive field collection (7 required fields)
✅ Real-time validation and retry logic
✅ Session management with Redis
✅ Automatic quote calculation when complete
✅ Error handling with exponential backoff

## Technology Stack

- **Runtime**: Node.js with Express
- **Language**: TypeScript
- **AI Provider**: Anthropic Claude API (3.5 Haiku)
- **Session Store**: Redis (port 6380)
- **Integration**: Pricing Service (port 3001)

## Architecture

```
User (Browser)
      │
      ▼
┌──────────────────────────────────┐
│  Frontend (/ai-quote)            │
│  - AiQuotePage                   │
│  - ConversationContainer         │
│  - MessageBubble                 │
│  - InputField                    │
└─────────┬────────────────────────┘
          │ HTTP REST API
          ▼
┌──────────────────────────────────┐
│  LLM Quote Service (Port 3004)   │
│                                  │
│  ┌────────────────────────────┐ │
│  │ ConversationController     │ │
│  └──────────┬─────────────────┘ │
│             │                    │
│  ┌──────────▼─────────────────┐ │
│  │ ConversationManager        │ │
│  │  - Orchestrates dialogue   │ │
│  └──┬───┬───┬───┬─────────────┘ │
│     │   │   │   │                │
│  ┌──▼─┐ │ ┌─▼─┐ │ ┌────────────┐│
│  │LLM │ │ │Data│ │ │Quote       ││
│  │Prov│ │ │Extr│ │ │Integration ││
│  │ider│ │ │act│ │ │            ││
│  └──┬─┘ │ └─┬─┘ │ └──────┬─────┘│
│     │   │   │   │        │       │
└─────┼───┼───┼───┼────────┼───────┘
      │   │   │   │        │
      │   │   │   │        │
   ┌──▼───┴───▼───┘        │
   │ RedisService           │
   │  (Sessions)            │
   └────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Pricing Service  │
                  │  (Port 3001)     │
                  └──────────────────┘
```

## Service Components

### 1. ConversationController

**Purpose**: HTTP endpoint handler

**Endpoints**:
```typescript
POST   /api/v1/conversations              // Create new conversation
POST   /api/v1/conversations/:id/message  // Send message
GET    /api/v1/conversations/:id/summary  // Get conversation state
POST   /api/v1/conversations/:id/confirm  // Calculate quote
GET    /api/v1/health                    // Health check
```

**Responsibilities**:
- Request validation
- HTTP error handling
- Response formatting
- CORS configuration

### 2. ConversationManager

**Purpose**: Core business logic and dialogue orchestration

**Key Methods**:
```typescript
class ConversationManager {
  // Create new conversation session
  async createConversation(): Promise<{
    sessionId: string;
    initialMessage: string;
  }>

  // Process user message through LLM
  async processMessage(
    sessionId: string,
    userMessage: string
  ): Promise<SendMessageResponse>

  // Get conversation summary
  async getSummary(
    sessionId: string
  ): Promise<GetSummaryResponse>

  // Confirm data and calculate quote
  async confirmAndCalculate(
    sessionId: string
  ): Promise<ConfirmAndCalculateResponse>
}
```

**Workflow**:
1. Retrieve conversation state from Redis
2. Add user message to history
3. Send to LLMProvider for processing
4. Extract data using DataExtractor
5. Update conversation state
6. Save to Redis
7. Return AI response

### 3. LLMProvider

**Purpose**: Claude API integration

**Configuration**:
```typescript
{
  model: 'claude-3-5-haiku-20241022',
  max_tokens: 1024,
  temperature: 0.7,
  system: SYSTEM_PROMPT  // See prompts.ts
}
```

**Error Handling**:
- Automatic retry with exponential backoff
- Retry delays: 1s, 2s, 4s (max 3 attempts)
- Handles rate limits (529, 503 errors)
- Strips JSON blocks from user-facing messages

**Key Features**:
```typescript
class LLMProvider {
  // Call Claude API with context
  async chat(request: LLMRequest): Promise<LLMResponse>

  // Retry logic for transient failures
  private async retryWithBackoff(
    fn: () => Promise<T>,
    retries: number = 3
  ): Promise<T>
}
```

### 4. DataExtractor

**Purpose**: Extract and validate structured data from AI responses

**Extracted Fields** (7 required):
```typescript
{
  gender: 'male' | 'female',
  dateOfBirth: string,      // YYYY-MM-DD format
  height: number,            // centimeters
  weight: number,            // kilograms
  city: string,              // Moroccan city
  usesNicotine: boolean,
  termLength: 10 | 20        // years
}
```

**Validation Rules**:
- **Gender**: Must be 'male' or 'female'
- **Date of Birth**: Valid date, age 18-70
- **Height**: 100-250 cm
- **Weight**: 30-300 kg
- **City**: One of 10 major Moroccan cities
- **Nicotine**: Boolean (yes/no)
- **Term Length**: Exactly 10 or 20 years

**Methods**:
```typescript
class DataExtractor {
  // Extract data from AI message
  extractData(
    aiMessage: string,
    currentData: ExtractedData
  ): ExtractedData

  // Validate extracted field
  validateField(
    field: ConversationField,
    value: any
  ): boolean

  // Check if all fields collected
  isDataComplete(data: ExtractedData): boolean
}
```

### 5. QuoteIntegration

**Purpose**: Interface with Pricing Service

**Methods**:
```typescript
class QuoteIntegration {
  // Calculate quote via Pricing Service
  async calculateQuote(
    data: ExtractedData
  ): Promise<PricingServiceResponse>

  // Transform extracted data to pricing format
  private transformToPricingRequest(
    data: ExtractedData
  ): PricingServiceRequest
}
```

**Request Transformation**:
```typescript
// From LLM extracted data
{
  gender: 'male',
  dateOfBirth: '1990-05-15',
  height: 180,
  weight: 80,
  city: 'Casablanca',
  usesNicotine: false,
  termLength: 20
}

// To Pricing Service format
{
  productType: 'term_life',
  applicant: {
    gender: 'Male',          // Capitalized
    birthDate: '1990-05-15',
    height: 180,
    weight: 80,
    city: 'Casablanca',
    usesNicotine: false
  },
  policy: {
    termLength: 20,
    coverageAmount: 500000   // Default
  }
}
```

### 6. RedisService

**Purpose**: Session storage and retrieval

**Key Methods**:
```typescript
class RedisService {
  // Save conversation state (30min TTL)
  async saveConversation(
    state: ConversationState
  ): Promise<void>

  // Retrieve conversation state
  async getConversation(
    sessionId: string
  ): Promise<ConversationState | null>

  // Delete conversation
  async deleteConversation(
    sessionId: string
  ): Promise<void>
}
```

**Session Storage**:
```typescript
// Redis key: `session:${sessionId}`
// TTL: 1800 seconds (30 minutes)
{
  sessionId: 'uuid-v4',
  startedAt: Date,
  lastActivityAt: Date,
  extractedData: {
    gender: 'male',
    dateOfBirth: '1990-05-15',
    // ... other fields
  },
  collectionProgress: [
    'gender',
    'dateOfBirth',
    'height'
  ],
  conversationHistory: [
    {
      role: 'assistant',
      content: 'Hello! I can help...',
      timestamp: Date
    },
    {
      role: 'user',
      content: 'I need a quote',
      timestamp: Date
    }
  ],
  status: 'collecting',
  currentField: 'weight',
  retryCount: 0,
  errors: []
}
```

## Conversation Flow

### 1. Session Creation

**Request**:
```http
POST /api/v1/conversations
```

**Response**:
```json
{
  "success": true,
  "sessionId": "a1b2c3d4-...",
  "initialMessage": "Hello! I can help you get a quick life insurance quote...",
  "status": "collecting"
}
```

**Backend Process**:
1. Generate UUID session ID
2. Create initial conversation state
3. Store in Redis (30min TTL)
4. Return welcome message

### 2. Multi-Turn Dialogue

**Request**:
```http
POST /api/v1/conversations/a1b2c3d4-.../message
Content-Type: application/json

{
  "message": "I'm a 34 year old male"
}
```

**Response**:
```json
{
  "success": true,
  "sessionId": "a1b2c3d4-...",
  "aiResponse": "Great! And what is your height in centimeters?",
  "extractedData": {
    "gender": "male",
    "dateOfBirth": "1989-12-11"  // Calculated from age
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

**Backend Process**:
1. Retrieve session from Redis
2. Add user message to history
3. Call Claude API with full context
4. Extract data from AI response
5. Validate extracted fields
6. Update session state
7. Save to Redis (refresh TTL)
8. Return AI response + progress

### 3. Field Collection Progress

The system collects 7 fields progressively:

```
1. Gender        → "Are you male or female?"
2. Date of Birth → "What is your date of birth?"
3. Height        → "What is your height in centimeters?"
4. Weight        → "What is your weight in kilograms?"
5. City          → "Which city do you live in?"
6. Nicotine      → "Do you use nicotine products?"
7. Term Length   → "10 or 20 year term?"
```

**Progress Tracking**:
```typescript
{
  current: 4,              // 4 fields collected
  total: 7,                // 7 fields required
  fieldsCollected: [
    'gender',
    'dateOfBirth',
    'height',
    'weight'
  ]
}
```

### 4. Quote Calculation

**When All Fields Collected**:
The service automatically transitions to calculating:

**Request**:
```http
POST /api/v1/conversations/a1b2c3d4-.../confirm
```

**Response**:
```json
{
  "success": true,
  "sessionId": "a1b2c3d4-...",
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
    "createdAt": "2025-12-11T10:30:00Z",
    "expiresAt": "2026-01-10T10:30:00Z"
  },
  "applicantSummary": {
    "gender": "Male",
    "age": 34,
    "city": "Casablanca",
    "healthFactors": ["Preferred risk class", "Normal BMI"]
  }
}
```

**Backend Process**:
1. Retrieve session from Redis
2. Validate all 7 fields present
3. Call Pricing Service with data
4. Store quote in session
5. Update status to 'complete'
6. Return quote details

## API Endpoints Documentation

### POST /api/v1/conversations

Create a new conversation session.

**Request**: No body required

**Response**:
```typescript
{
  success: boolean;
  sessionId: string;
  initialMessage: string;
  status: 'collecting';
}
```

**Error Responses**:
- `500` - Failed to create conversation

---

### POST /api/v1/conversations/:id/message

Send a message in an existing conversation.

**Path Parameters**:
- `id` - Session ID

**Request Body**:
```json
{
  "message": "I'm 34 years old"
}
```

**Response**:
```typescript
{
  success: boolean;
  sessionId: string;
  aiResponse: string;
  extractedData: ExtractedData;
  status: ConversationStatus;
  progress: {
    current: number;
    total: number;
    fieldsCollected: string[];
  };
  inputType?: 'text' | 'number' | 'date' | 'dropdown';
  options?: string[];  // For dropdown fields
}
```

**Error Responses**:
- `400` - Missing message in request body
- `404` - Session not found (expired or invalid)
- `500` - LLM processing error

---

### GET /api/v1/conversations/:id/summary

Get current conversation state.

**Path Parameters**:
- `id` - Session ID

**Response**:
```typescript
{
  success: boolean;
  sessionId: string;
  extractedData: ExtractedData;
  progress: {
    current: number;
    total: number;
    fieldsCollected: string[];
  };
  sessionExpiry: Date;
  status: ConversationStatus;
}
```

**Error Responses**:
- `404` - Session not found

---

### POST /api/v1/conversations/:id/confirm

Confirm collected data and calculate quote.

**Path Parameters**:
- `id` - Session ID

**Response**:
```typescript
{
  success: boolean;
  sessionId: string;
  quote: Quote;
  applicantSummary: {
    gender: string;
    age: number;
    city: string;
    healthFactors: string[];
  };
}
```

**Error Responses**:
- `400` - Incomplete data (missing required fields)
- `404` - Session not found
- `500` - Quote calculation failed

---

### GET /api/v1/health

Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "service": "llm-quote-service",
  "timestamp": "2025-12-11T10:30:00Z"
}
```

## Error Handling

### Session Expiration

Sessions expire after 30 minutes of inactivity.

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "SESSION_EXPIRED",
    "message": "Your session has expired. Please start a new conversation."
  }
}
```

**Frontend Handling**:
```typescript
if (error.code === 'SESSION_EXPIRED') {
  // Create new conversation
  const newSession = await llmQuoteService.createConversation();
  // Redirect to fresh conversation
}
```

### LLM API Errors

**Transient Errors** (Automatically Retried):
- `529` - Overloaded
- `503` - Service unavailable
- Network timeouts

**Permanent Errors** (No Retry):
- `401` - Invalid API key
- `400` - Invalid request

**Retry Logic**:
```typescript
// Attempt 1: Immediate
// Attempt 2: 1 second delay
// Attempt 3: 2 second delay
// Attempt 4: 4 second delay
// After 4 attempts: Return error
```

### Validation Errors

**Invalid Field Value**:
```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    field: 'height',
    message: 'Height must be between 100 and 250 cm'
  }
}
```

**AI automatically asks for correction**:
```
AI: "I notice the height you provided (350 cm) seems unusual.
     Could you please confirm your height in centimeters?"
```

## Configuration

### Environment Variables

**Required**:
```bash
CLAUDE_API_KEY=sk-ant-api03-...  # Anthropic API key
```

**Optional (with defaults)**:
```bash
PORT=3004                        # Server port
NODE_ENV=development             # Environment

# Redis Configuration
REDIS_HOST=llm-quote-redis       # Redis hostname
REDIS_PORT=6379                  # Redis port
REDIS_PASSWORD=                  # Redis password (if any)
SESSION_TTL=1800                 # Session TTL in seconds (30min)

# Claude Configuration
CLAUDE_MODEL=claude-3-5-haiku-20241022
CLAUDE_MAX_TOKENS=1024
CLAUDE_TEMPERATURE=0.7

# Pricing Service Integration
PRICING_SERVICE_URL=http://pricing-service:3001
PRICING_SERVICE_TIMEOUT=10000    # 10 seconds

# Retry Configuration
MAX_FIELD_RETRIES=2              # Max retries per field
DEFAULT_COVERAGE_AMOUNT=500000   # Default coverage
```

### Docker Configuration

**Service Definition** (docker-compose.yml):
```yaml
llm-quote-service:
  build: ./llm-quote-service
  ports:
    - "3004:3004"
  env_file:
    - ./llm-quote-service/.env
  environment:
    - NODE_ENV=development
    - PORT=3004
    - PRICING_SERVICE_URL=http://pricing-service:3001
    - REDIS_HOST=llm-quote-redis
    - REDIS_PORT=6379
    - SESSION_TTL=1800
  depends_on:
    - llm-quote-redis
    - pricing-service
  volumes:
    - ./llm-quote-service:/app
    - /app/node_modules
  restart: unless-stopped

llm-quote-redis:
  image: redis:7-alpine
  ports:
    - "6380:6379"
  volumes:
    - llm-quote-redis-data:/data
  restart: unless-stopped
```

## Performance Considerations

### Response Times

**Typical Latency**:
- Create conversation: ~50ms (Redis write)
- Send message: ~1-3s (Claude API + processing)
- Get summary: ~20ms (Redis read)
- Calculate quote: ~100ms (Pricing Service call)

**Claude API Latency**:
- Average: 1-2 seconds
- P95: 2-3 seconds
- P99: 3-5 seconds

### Cost Optimization

**Model Selection**: Claude 3.5 Haiku
- Cost: ~$0.25 per 1M input tokens
- Cost: ~$1.25 per 1M output tokens
- Average conversation: ~3,000 tokens total
- Cost per conversation: ~$0.003 (very low)

**Token Usage Optimization**:
- System prompt: ~500 tokens
- Per message: ~200-300 tokens
- Full conversation: ~2,500-3,500 tokens

### Scaling

**Horizontal Scaling**:
```
        Load Balancer
              │
   ┌──────────┼──────────┐
   │          │          │
   ▼          ▼          ▼
LLM-1      LLM-2      LLM-3
   │          │          │
   └──────────┴──────────┘
              │
        Shared Redis
```

**Capacity**:
- Each instance: ~100 concurrent conversations
- Redis: ~10,000 sessions per GB
- Claude API: Rate limited by Anthropic

## Testing

### Unit Tests

```bash
cd llm-quote-service
npm test
```

**Test Coverage**:
- DataExtractor: Field validation
- ConversationManager: State transitions
- LLMProvider: Error handling
- RedisService: Session management

### Integration Tests

```bash
# Test complete conversation flow
curl -X POST http://localhost:3004/api/v1/conversations
# Returns sessionId

curl -X POST http://localhost:3004/api/v1/conversations/{id}/message \
  -H "Content-Type: application/json" \
  -d '{"message": "I am a 34 year old male"}'

# Continue conversation...
```

### Manual Testing

1. **Start service**:
   ```bash
   docker-compose up llm-quote-service
   ```

2. **Access frontend**:
   ```
   http://localhost:3000/ai-quote
   ```

3. **Test conversation**:
   - Enter natural language responses
   - Verify field extraction
   - Check progress indicator
   - Confirm quote calculation

## Monitoring

### Health Checks

```bash
curl http://localhost:3004/api/v1/health
```

### Redis Monitoring

```bash
# Connect to Redis
docker-compose exec llm-quote-redis redis-cli

# View all sessions
KEYS session:*

# Check specific session
GET session:a1b2c3d4-...

# Monitor real-time
MONITOR
```

### Logs

```bash
# View logs
docker-compose logs -f llm-quote-service

# Filter errors
docker-compose logs llm-quote-service | grep ERROR
```

**Structured Logging**:
```json
{
  "level": "info",
  "timestamp": "2025-12-11T10:30:00Z",
  "sessionId": "a1b2c3d4-...",
  "event": "message_processed",
  "fieldsCollected": 4,
  "totalFields": 7,
  "duration": 1250
}
```

## Troubleshooting

### Issue: Session Not Found

**Cause**: Session expired (30min TTL) or invalid ID

**Solution**:
```typescript
// Frontend should handle gracefully
try {
  await sendMessage(sessionId, message);
} catch (error) {
  if (error.code === 'SESSION_EXPIRED') {
    // Create new session
    const newSession = await createConversation();
    // Restart conversation
  }
}
```

### Issue: Claude API Errors

**429 Rate Limit**:
- Wait and retry automatically
- Check API key quota

**401 Authentication**:
- Verify `CLAUDE_API_KEY` in `.env`
- Check API key is valid

**Service Timeouts**:
- Check network connectivity
- Verify Anthropic API status

### Issue: Quote Calculation Fails

**Incomplete Data**:
```json
{
  "error": "Cannot calculate quote: missing required field 'city'"
}
```

**Solution**: Continue conversation to collect missing field

**Pricing Service Down**:
```json
{
  "error": "Pricing service unavailable"
}
```

**Solution**: Check pricing service health

### Issue: Redis Connection Failed

**Symptoms**:
- Cannot create conversation
- Sessions not persisting

**Solution**:
```bash
# Check Redis is running
docker-compose ps llm-quote-redis

# Test connection
docker-compose exec llm-quote-redis redis-cli ping

# Restart if needed
docker-compose restart llm-quote-redis
```

## Best Practices

### 1. Session Management
- Always check session expiry before operations
- Refresh session TTL on each interaction
- Clean up sessions when quote is complete

### 2. Error Handling
- Implement retry logic for transient failures
- Show user-friendly error messages
- Log errors for debugging

### 3. Data Validation
- Validate on both frontend and backend
- Provide helpful error messages
- Allow users to correct invalid input

### 4. Performance
- Cache frequent data in Redis
- Use connection pooling for external APIs
- Implement request timeouts

### 5. Security
- Never expose API keys to frontend
- Validate all user input
- Rate limit API endpoints
- Sanitize data before storage

---

**Last Updated**: December 2025
**Service Owner**: Engineering Team
**Version**: 1.0
