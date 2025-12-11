# User Story: AI-Powered Conversational Life Insurance Quote Engine

## 📋 User Story

**As a** prospective life insurance customer  
**I want** to obtain a term life insurance quote through a natural, conversational AI interface  
**So that** I can quickly understand my insurance options without navigating complex forms, making the process feel personal and intuitive

## 🎯 Background Context

**Current State:**
- Form-based quoting system at `localhost:3001/quote` with fields: Gender, DOB, Height, Weight, City, Nicotine Usage
- Existing pricing service calculates quotes based on structured data
- Current form has 30-40% abandonment rate; users find multi-step forms tedious

**Vision:**
- New conversational quoting experience at `localhost:3001/ai-quote`
- LLM-powered interface that conducts natural dialogue to gather same data points
- Seamless integration with existing pricing engine (no changes to backend services)
- Both UIs coexist—users can choose their preferred experience

**Target User Persona:**
- End customers (not agents/brokers initially)
- Ages 25-65, seeking 10-20 year term life policies
- Prefer conversational, guided experience over form-filling
- May be doing research before commitment

## ✅ Acceptance Criteria

### 1. Conversational Flow & Data Collection

- [ ] **Welcome & Introduction**
  - [ ] AI greets user warmly and explains it will ask a few questions to provide a personalized quote
  - [ ] Sets expectation: "This will take about 2-3 minutes"
  - [ ] Conversational tone (friendly, professional, not robotic)

- [ ] **Gender Collection**
  - [ ] AI asks: "To get started, are you male or female?"
  - [ ] Accepts natural language responses ("I'm a man", "female", "I'm male", etc.)
  - [ ] Clarifies if response is ambiguous: "Just to confirm, you said [gender]—is that correct?"
  - [ ] Moves forward once confirmed

- [ ] **Date of Birth Collection**
  - [ ] AI asks: "When were you born? Please provide your date of birth (for example, January 15, 1985)"
  - [ ] Accepts multiple input formats: "1990-01-15", "01/15/1990", "January 15, 1990", "15th of January 1990"
  - [ ] Validates age is reasonable for life insurance (18-80 years old)
  - [ ] If invalid: "I didn't quite catch that. Could you provide your birth date again?" (retry up to 2 times)
  - [ ] Confirms extracted age: "So you're [X] years old—does that sound right?"

- [ ] **Height Collection**
  - [ ] AI asks: "How tall are you? (Please provide in centimeters, for example 175cm)"
  - [ ] Accepts: "175", "175cm", "1.75m", "5'9 inches" (converts imperial to metric)
  - [ ] Validates range (140cm-230cm for reasonable bounds)
  - [ ] If outside range: "That seems unusual. Could you double-check your height?"
  - [ ] Confirms: "So you're [height]cm—correct?"

- [ ] **Weight Collection**
  - [ ] AI asks: "What's your weight? (Please provide in kilograms, for example 75kg)"
  - [ ] Accepts: "75", "75kg", "75 kilos"
  - [ ] Validates range (40kg-200kg)
  - [ ] If invalid: "I want to make sure I have that right. Could you provide your weight again?"
  - [ ] Confirms: "That's [weight]kg—is that accurate?"

- [ ] **City/Location Collection**
  - [ ] AI asks: "Which city in Morocco are you located in? (For example: Casablanca, Rabat, Fes)"
  - [ ] Provides autocomplete suggestions as user types (top 10 cities)
  - [ ] Accepts city name variations/misspellings (fuzzy matching: "Daralbeda" → "Dar El Beida")
  - [ ] If not in database: "I'm not sure about that city. Could you try another city or the nearest major city?"
  - [ ] Confirms: "You're in [city]—is that right?"

- [ ] **Nicotine Usage Collection**
  - [ ] AI asks: "One last question: Do you currently use nicotine products (including cigarettes, cigars, or vaping)?"
  - [ ] Accepts: "yes", "no", "I used to but quit", "occasionally"
  - [ ] If "used to": "When did you quit? (Our system requires at least 12 months tobacco-free for standard rates)"
  - [ ] Clarifies ambiguous responses: "Just to clarify, you said [response]—meaning you do/don't use nicotine?"
  - [ ] Confirms: "So, no nicotine use—correct?" or "You're a [nicotine user]—got it"

- [ ] **Term Length Selection**
  - [ ] AI asks: "One final question: How long would you like your coverage? A 10-year term or a 20-year term?"
  - [ ] Explains briefly if needed: "A 10-year term has lower monthly payments, while 20-year provides longer protection"
  - [ ] Accepts: "10", "10-year", "10 years", "20", "20-year", "20 years"
  - [ ] If unsure: "Most people choose between 10 years (to retirement age) or 20 years (for long-term security). Which sounds better to you?"
  - [ ] Confirms: "So, a [10 or 20]-year term—correct?"

### 2. Data Validation & Error Handling

- [ ] **Real-time Validation**
  - [ ] Each extracted data point is validated immediately
  - [ ] If validation fails, AI asks for clarification (max 2 retries per field)
  - [ ] After 2 failed retries, user can skip to proceed (graceful degradation)

- [ ] **Data Confirmation**
  - [ ] After all 7 data points collected, AI summarizes: "Let me confirm the information I have: You're a [gender], born [date], [height]cm tall, [weight]kg, from [city], [nicotine status], and you'd like [10 or 20]-year coverage"
  - [ ] Asks: "Does everything look correct? (Yes/No/Let me change something)"
  - [ ] If "No" or correction requested: "Which information would you like to change?"
  - [ ] Returns to that specific field for correction

- [ ] **Conversation Context Management**
  - [ ] AI maintains context throughout conversation
  - [ ] User can refer to previous responses: "Like I said earlier..." or "Remember I'm from Casablanca?"
  - [ ] If user asks: "What did I say about height?" AI can reference it
  - [ ] Natural follow-ups feel continuous, not disjointed

### 3. Quote Calculation & Display

- [ ] **Pricing Engine Integration**
  - [ ] Once data confirmed, LLM service constructs API request to existing pricing service (`POST /api/v1/quotes`)
  - [ ] Request payload matches exact structure expected by pricing service:
    ```json
    {
      "productType": "TERM_LIFE",
      "gender": "male|female",
      "dateOfBirth": "YYYY-MM-DD",
      "height": 175,
      "weight": 75,
      "city": "Casablanca",
      "usesNicotine": true|false,
      "coverageAmount": 500000,
      "termLength": 20
    }
    ```
  - [ ] Handles pricing service errors gracefully: "I'm having trouble calculating your quote. Please try again in a moment."

- [ ] **Quote Display**
  - [ ] Shows loading state: "Calculating your personalized quote..."
  - [ ] Displays quote in clear, user-friendly format:
    - Applicant summary (gender, age, location, health factors)
    - Monthly premium for selected term length
    - Coverage amount
    - Term options available (10-year, 20-year)
    - Breakdown of pricing factors (age, health, location impact)
  - [ ] Shows quote expiration: "This quote is valid for 48 hours"

- [ ] **Post-Quote Options**
  - [ ] AI presents clear next steps: 
    - "Your [10 or 20]-year term quote is ready. Would you like to adjust your coverage amount, or shall we proceed to application?"
  - [ ] Allow modification of coverage amount: "How much coverage would you like? (Default: $500,000)"
  - [ ] If user wants to see alternate term: "I can also show you what a [10 or 20]-year term would cost instead—would that help?"
  - [ ] "Apply Now" button → transitions to existing application flow (preserves quote data)
  - [ ] "Email Quote" → email the quote to self or someone else
  - [ ] "Start Over" → reset conversation

### 4. User Interface Design

**Conversation Window Layout:**
- Clean, modern chat interface
- AI messages on left (with small avatar), user messages on right
- Messages appear naturally with slight animation
- Input field at bottom with send button
- Visual progress indicator (e.g., "Question 3 of 7")
- Estimated time remaining updates as conversation progresses

**UI Components:**
- Conversation history visible with ability to scroll up
- Quick-reply buttons for yes/no questions
- Date picker for DOB collection
- Dropdown with city autocomplete for location
- Slider or number input for height/weight
- Toggle buttons for nicotine usage
- Large "Apply Now" CTA button once quote generated

**Color & Branding:**
- Consistent with YadmanX brand (reference existing form UI at `localhost:3001/quote`)
- Professional blue/white theme
- Clear contrast for accessibility
- Mobile-responsive (works on phones, tablets, desktop)

**Route & Navigation:**
- New route: `localhost:3001/ai-quote`
- From homepage: Add link "Get Quote with AI Assistant" alongside "Get a Quote" (form)
- From existing form: Optional "Try our AI version instead?" suggestion
- Back button to return to homepage
- Breadcrumb or header showing current section

### 5. Session & Data Management

- [ ] **Session Handling**
  - [ ] Each conversation gets unique session ID
  - [ ] Session persists for 30 minutes of inactivity
  - [ ] If session expires: "Your session timed out. Let's start fresh!" → restart conversation
  - [ ] Session data stored in Redis with expiration

- [ ] **Quote Data Preservation**
  - [ ] Once quote generated, store in quote database with metadata:
    - quote_id, session_id, applicant_data, pricing_result, created_at, expires_at, source: "llm_conversational"
  - [ ] Quote data available for application prepopulation (extends existing quote prepopulation logic)
  - [ ] User can return to same quote within expiration window if they have quote ID

- [ ] **Privacy & Security**
  - [ ] No conversation history stored beyond session lifetime
  - [ ] All data transmitted over HTTPS
  - [ ] PII handled according to GDPR/local data protection regulations
  - [ ] Session IDs are cryptographically random (UUID v4)

### 6. Multi-Turn Conversation Logic

- [ ] **Handling Corrections**
  - [ ] User: "Actually, I'm 182cm not 175"
  - [ ] AI: "Got it, you're 182cm. Anything else you'd like to change?"
  - [ ] AI updates height field and re-summarizes

- [ ] **Handling Clarifications**
  - [ ] User: "What do you mean by nicotine products?"
  - [ ] AI: "Nicotine products include cigarettes, cigars, vaping devices, and nicotine patches. Do you use any of these?"

- [ ] **Handling Tangents**
  - [ ] User: "Is term life insurance better than whole life?"
  - [ ] AI: "Great question! For now, let me get your quote for term life. After we have your quote, I can explain the difference. Does that work?"

- [ ] **Handling Incomplete Information**
  - [ ] If user can't recall exact DOB: "No problem. What year were you born? I can estimate from there."
  - [ ] If unsure of exact height: "Approximate is fine—just give me your best guess"

### 7. Accessibility & Inclusivity

- [ ] **Language & Tone**
  - [ ] Clear, jargon-free language (avoid "underwriting", "risk assessment", etc.)
  - [ ] Tone is conversational but professional
  - [ ] Instructions are concise (max 1-2 sentences per message)

- [ ] **Accessibility Compliance**
  - [ ] WCAG 2.1 AA compliant
  - [ ] Text contrast meets accessibility standards
  - [ ] Form inputs have proper labels for screen readers
  - [ ] Keyboard navigation supported (Tab, Enter, Escape)
  - [ ] Screen reader compatible messages
  - [ ] Mobile-first responsive design

## 🔧 Technical Architecture

### Service Structure

```
llm-quote-service/ (NEW)
├── src/
│   ├── controllers/
│   │   └── ConversationController.ts
│   ├── services/
│   │   ├── ConversationManager.ts      (manages multi-turn dialogue)
│   │   ├── DataExtractor.ts            (parses natural language → structured data)
│   │   ├── LLMProvider.ts              (Claude API integration)
│   │   └── QuoteIntegration.ts         (calls pricing-service)
│   ├── models/
│   │   ├── types.ts                    (ConversationState, ExtractedData, etc.)
│   │   └── prompts.ts                  (system prompts for LLM)
│   ├── middleware/
│   │   ├── sessionManagement.ts
│   │   └── validation.ts
│   ├── database/
│   │   └── ConversationRepository.ts   (store conversation logs)
│   └── routes/
│       └── conversationRoutes.ts
├── tests/
├── Dockerfile
└── docker-compose.override.yml
```

### API Endpoints

**POST /api/v1/conversations**
- Creates new conversation session
- Returns: `{ sessionId, initialMessage }`

**POST /api/v1/conversations/{sessionId}/message**
- Receives user message
- Input: `{ message: string }`
- Returns: `{ sessionId, aiResponse, extractedData, status }`
- Status: "collecting" | "confirming" | "calculating" | "complete" | "error"

**GET /api/v1/conversations/{sessionId}/summary**
- Retrieves current conversation state and extracted data
- Returns: `{ extractedData, progress, sessionExpiry }`

**POST /api/v1/conversations/{sessionId}/confirm**
- Confirms all data and triggers quote calculation
- Returns: `{ quote, quoteId, expiresAt }`

### Integration with Pricing Service

```typescript
// Existing pricing service endpoint remains unchanged
POST /api/v1/quotes
{
  productType: "TERM_LIFE",
  gender: "male" | "female",
  dateOfBirth: "YYYY-MM-DD",
  height: number,
  weight: number,
  city: string,
  usesNicotine: boolean,
  coverageAmount: number,
  termLength: number
}
```

The LLM service transforms extracted conversation data into this exact payload.

### LLM Integration (Claude API)

**System Prompt Strategy:**
- Define clear instructions for data extraction and validation
- Provide examples of acceptable input formats
- Specify error handling behavior
- Train model to extract structured data while maintaining conversational flow

**Prompt Structure:**
```
You are a friendly, professional insurance assistant helping customers get a quick quote for term life insurance in Morocco.

Your goal: Collect 6 pieces of information through natural conversation:
1. Gender (male/female)
2. Date of Birth (YYYY-MM-DD format)
3. Height (cm)
4. Weight (kg)
5. City (Morocco)
6. Nicotine Usage (yes/no)

Rules:
- Ask one question at a time
- Use conversational, friendly tone
- Validate inputs immediately
- Clarify ambiguous responses
- Never ask for unnecessary information

Current Collected Data: {json}
Next Field Needed: {fieldName}

User Message: {userMessage}

Respond with:
1. AI message (conversational response, next question, or clarification)
2. Extracted/updated data (JSON)
3. Status (collecting | confirming | ready_for_quote | error)
```

### Session & State Management

**ConversationState:**
```typescript
{
  sessionId: string;                  // UUID
  startedAt: Date;
  lastActivityAt: Date;
  extractedData: {
    gender?: "male" | "female";
    dateOfBirth?: string;              // YYYY-MM-DD
    height?: number;                   // cm
    weight?: number;                   // kg
    city?: string;
    usesNicotine?: boolean;
    termLength?: 10 | 20;              // collected during conversation
    coverageAmount?: number;           // default: 500000
  };
  collectionProgress: string[];        // fields collected
  conversationHistory: Message[];
  status: "active" | "completed" | "expired" | "error";
  quoteId?: string;
  errors: ValidationError[];
}
```

**Storage:**
- ConversationState: Redis (30-minute expiration)
- Conversation logs: PostgreSQL (for analytics/audit)
- Generated quotes: Existing quote database (with `source: "llm_conversational"` metadata)

## 🧪 Testing Scenarios

### Happy Path
- [ ] User provides all data correctly on first attempt → Quote generated successfully
- [ ] User corrects one field during confirmation → Quote recalculates correctly
- [ ] User selects 10-year term → Quote shows 10-year rates
- [ ] User selects 20-year term → Quote shows 20-year rates
- [ ] User requests coverage amount change → New quote calculates with adjusted amount
- [ ] Quote → Apply button → Application flow receives prepopulated data

### Edge Cases - Input Formats
- [ ] DOB as "1990-01-15" → correctly parsed
- [ ] DOB as "January 15, 1990" → correctly parsed
- [ ] Height in feet/inches (5'9") → converted to cm (175)
- [ ] Weight in lbs (165 lbs) → converted to kg (75)
- [ ] City misspelling "Daralbeda" → matched to "Dar El Beida"
- [ ] User enters typo in gender ("amle") → clarification requested

### Edge Cases - Clarifications
- [ ] User says "I vape but don't smoke" → treated as nicotine user
- [ ] User says "I quit smoking 6 months ago" → AI asks for clarification on timeline
- [ ] User enters impossible data (height 400cm) → rejected with friendly message
- [ ] User provides future DOB → rejected with "That's in the future—could you double-check?"

### Error Handling
- [ ] Pricing service timeout → "Service temporarily unavailable, please try again"
- [ ] Session expires mid-conversation → "Session expired, let's start fresh"
- [ ] Invalid city not found → "City not recognized, could you provide the nearest major city?"
- [ ] User enters same wrong value twice → Option to skip that field

### Multi-Turn Conversation
- [ ] User asks question mid-flow → AI answers then returns to collection
- [ ] User wants to change something → Can specify which field to update
- [ ] User asks about product details → AI explains then refocuses on quote

### Mobile Experience
- [ ] Conversation fits on mobile screen (no horizontal scrolling)
- [ ] Input field remains accessible when virtual keyboard open
- [ ] Quick-reply buttons work on touch devices
- [ ] Date/height/weight inputs use native mobile controls where appropriate

## 📝 Definition of Done

- [ ] Conversation flow implemented and tested
- [ ] LLM integration working with data extraction
- [ ] All 6 data fields collecting correctly
- [ ] Quote calculation triggered and displayed
- [ ] UI built and responsive across devices
- [ ] Session management with Redis implemented
- [ ] Data validation working for all edge cases
- [ ] Pricing service integration tested end-to-end
- [ ] Conversation logs stored in PostgreSQL
- [ ] Quote prepopulation logic extends to AI quotes
- [ ] Error handling for all major failure modes
- [ ] Accessibility compliance verified
- [ ] API documentation complete and auto-updated
- [ ] All tests passing (unit, integration, e2e)
- [ ] Code reviewed and merged to main
- [ ] Feature deployed to staging environment

## 🎯 Success Metrics

- **Quote Completion Rate**: % of conversations that complete quote generation (target: 85%+)
- **Abandonment Rate**: Reduce from form's 30-40% to <15% with conversational flow
- **Average Time to Quote**: Target 2-3 minutes (measure: session start to quote display)
- **Data Accuracy**: % of quotes that require zero corrections post-conversation (target: 90%+)
- **User Satisfaction**: In-app satisfaction rating post-quote (target: 4.5+/5.0)
- **Mobile Adoption**: % of quotes from mobile devices (target: 50%+)

## 🚀 Implementation Roadmap

### Phase 1: MVP (Weeks 1-2)
- Implement basic conversation flow for 6 data points
- Simple LLM integration with Claude API
- Basic validation and error handling
- Simple chat UI
- Session management with Redis

### Phase 2: Polish (Weeks 3-4)
- Multi-turn conversation logic for clarifications
- Advanced input format handling (imperial/metric conversion, date formats)
- Enhanced UI with progress indicators and quick-reply buttons
- Comprehensive testing and edge case handling
- Analytics and conversation logging

### Phase 3: Optimization (Week 5)
- Performance optimization
- Mobile UX refinement
- A/B testing setup
- Metrics dashboard

## 📋 Dependencies

**External:**
- Claude API (Anthropic) for LLM
- Existing pricing-service API

**Internal:**
- Existing quote database schema
- Authentication/session management patterns
- Database and Redis infrastructure

**No changes required to:**
- pricing-service (API contract remains same)
- application-service (quote prepopulation extends naturally)
- Existing quote form

---

**Priority**: High  
**Story Points**: 21 (3 weeks full implementation)  
**Dependencies**: pricing-service API stable  
**Blocks**: Nothing; creates new feature branch  
**Blocked By**: None  

