# Frontend Application Guide

## Overview

The YadmanX frontend is a modern React application built with TypeScript, providing multiple user flows for insurance quotes, enrollment, and agent management.

## Technology Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Build Tool**: Create React App (CRA)
- **Icons**: Lucide React
- **Utilities**: class-variance-authority, clsx

## Project Structure

```
src/
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Select.tsx
│   │   └── ...
│   ├── common/                  # Layout components
│   │   ├── Header.tsx
│   │   ├── PageFooter.tsx
│   │   ├── HeroHeader.tsx
│   │   └── ProtectedRoute.tsx
│   ├── agent/                   # Agent-specific components
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   └── dashboard/
│   │       └── Dashboard.tsx
│   ├── ai-quote/               # AI quote components
│   │   ├── AiQuotePage.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ConversationContainer.tsx
│   │   ├── InputField.tsx
│   │   ├── TypingIndicator.tsx
│   │   ├── ProgressIndicator.tsx
│   │   └── AIQuoteDisplay.tsx
│   ├── QuoteForm.tsx           # Traditional quote form
│   ├── QuoteDisplay.tsx        # Quote results
│   ├── InsuranceForm.tsx       # Personal info form
│   ├── EnhancedContributionForm.tsx  # Payment setup
│   ├── BeneficiariesPage.tsx   # Beneficiaries
│   ├── ContactPage.tsx         # Contact page
│   └── AboutPage.tsx           # About page
│
├── context/
│   ├── QuoteContext.tsx        # Quote state management
│   └── AgentAuthContext.tsx    # Authentication state
│
├── services/
│   ├── pricingService.ts       # Pricing API client
│   ├── enrollmentService.ts    # Enrollment API client
│   ├── agentService.ts         # Agent API client
│   └── llmQuoteService.ts      # LLM Quote API client
│
├── hooks/
│   └── useConversation.ts      # AI conversation hook
│
├── types/
│   └── index.ts                # TypeScript definitions
│
├── utils/
│   └── validators.ts           # Form validation utilities
│
├── App.tsx                     # Main app component
├── index.tsx                   # App entry point
└── index.css                   # Global styles (Tailwind)
```

## Routing Architecture

### Route Configuration

```typescript
// App.tsx
function App() {
  return (
    <AgentAuthProvider>
      <QuoteProvider>
        <Router>
          <Routes>
            {/* Agent Routes */}
            <Route path="/agent/login" element={<LoginForm />} />
            <Route path="/agent/register" element={<RegisterForm />} />
            <Route
              path="/agent/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Public Routes */}
            <Route path="/" element={<QuoteForm />} />
            <Route path="/quote" element={<QuoteDisplay />} />
            <Route path="/ai-quote" element={<AiQuotePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Enrollment Routes */}
            <Route path="/enroll/start" element={<InsuranceForm />} />
            <Route path="/enroll/contribution" element={<EnhancedContributionForm />} />
            <Route path="/enroll/beneficiaries" element={<BeneficiariesPage />} />
            <Route path="/enroll/confirmation" element={<EnrollmentConfirmation />} />
            <Route path="/enroll/success" element={<EnrollmentSuccess />} />
            <Route path="/enroll/error" element={<EnrollmentError />} />
          </Routes>
        </Router>
      </QuoteProvider>
    </AgentAuthProvider>
  );
}
```

### Route Groups

| Route Group | Purpose | Auth Required |
|-------------|---------|---------------|
| `/` | Public quote calculator | No |
| `/ai-quote` | AI conversational quote | No |
| `/about`, `/contact` | Informational pages | No |
| `/agent/*` | Agent authentication | Varies |
| `/agent/dashboard` | Agent dashboard | Yes |
| `/enroll/*` | Enrollment workflow | No |

## State Management

### 1. QuoteContext

**Purpose**: Manage quote data across the application

**State**:
```typescript
interface QuoteContextType {
  quote: Quote | null;
  setQuote: (quote: Quote) => void;
  clearQuote: () => void;
  formData: QuoteFormData | null;
  setFormData: (data: QuoteFormData) => void;
}
```

**Usage**:
```typescript
// In a component
import { useQuote } from '../context/QuoteContext';

function QuoteDisplay() {
  const { quote, formData } = useQuote();

  return (
    <div>
      <h1>Your Quote</h1>
      <p>Monthly Premium: ${quote.pricing.monthlyPremium}</p>
    </div>
  );
}
```

**Provider Setup**:
```typescript
// App.tsx
<QuoteProvider>
  <Routes>
    {/* All routes have access to quote context */}
  </Routes>
</QuoteProvider>
```

### 2. AgentAuthContext

**Purpose**: Manage agent authentication state

**State**:
```typescript
interface AgentAuthContextType {
  agent: Agent | null;
  token: string | null;
  login: (token: string, agent: Agent) => void;
  logout: () => void;
  isAuthenticated: boolean;
}
```

**Usage**:
```typescript
import { useAgentAuth } from '../context/AgentAuthContext';

function Dashboard() {
  const { agent, logout, isAuthenticated } = useAgentAuth();

  if (!isAuthenticated) {
    return <Navigate to="/agent/login" />;
  }

  return (
    <div>
      <h1>Welcome, {agent.firstName}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Protected Route**:
```typescript
// components/common/ProtectedRoute.tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAgentAuth();

  if (!isAuthenticated) {
    return <Navigate to="/agent/login" replace />;
  }

  return <>{children}</>;
}
```

## Key User Flows

### 1. Traditional Quote Flow

```
User lands on homepage (/)
  ↓
QuoteForm displays
  ↓
User fills form:
  - Gender
  - Date of birth
  - Height, weight
  - City
  - Nicotine use
  - Term length
  ↓
Submit form
  ↓
pricingService.calculateQuote()
  ↓
quote stored in QuoteContext
  ↓
Navigate to /quote
  ↓
QuoteDisplay shows results
  ↓
User clicks "Enroll Now"
  ↓
Navigate to /enroll/start
```

**Component Flow**:
```typescript
// 1. QuoteForm.tsx
const handleSubmit = async (formData) => {
  const quote = await pricingService.calculateQuote(formData);
  setQuote(quote);
  setFormData(formData);
  navigate('/quote');
};

// 2. QuoteDisplay.tsx
const { quote, formData } = useQuote();

const handleEnroll = () => {
  navigate('/enroll/start');
};

// 3. InsuranceForm.tsx
const { quote } = useQuote();
// Prepopulate form with quote data
```

### 2. AI Quote Flow

```
User navigates to /ai-quote
  ↓
AiQuotePage loads
  ↓
useConversation hook creates session
  ↓
Initial AI message displays
  ↓
User types message
  ↓
llmQuoteService.sendMessage()
  ↓
AI response displays
  ↓
Progress indicator updates
  ↓
... (7 rounds of dialogue)
  ↓
All fields collected
  ↓
llmQuoteService.confirmAndCalculate()
  ↓
Quote displays in AIQuoteDisplay
  ↓
User clicks "Apply Now"
  ↓
Navigate to /enroll/start
```

**Component Structure**:
```typescript
// AiQuotePage.tsx
function AiQuotePage() {
  const {
    messages,
    sendMessage,
    isLoading,
    quote,
    progress
  } = useConversation();

  return (
    <div>
      <ProgressIndicator progress={progress} />
      <ConversationContainer messages={messages} />
      {quote ? (
        <AIQuoteDisplay quote={quote} />
      ) : (
        <InputField onSend={sendMessage} disabled={isLoading} />
      )}
    </div>
  );
}

// useConversation.ts
export function useConversation() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Create conversation on mount
    const createSession = async () => {
      const session = await llmQuoteService.createConversation();
      setSessionId(session.sessionId);
      setMessages([{
        role: 'assistant',
        content: session.initialMessage,
        timestamp: new Date()
      }]);
    };
    createSession();
  }, []);

  const sendMessage = async (message: string) => {
    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: message,
      timestamp: new Date()
    }]);

    // Get AI response
    const response = await llmQuoteService.sendMessage(sessionId, message);

    // Add AI message
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: response.aiResponse,
      timestamp: new Date()
    }]);

    // Update progress
    setProgress(response.progress);

    // Check if quote ready
    if (response.status === 'complete') {
      const quoteResponse = await llmQuoteService.confirmAndCalculate(sessionId);
      setQuote(quoteResponse.quote);
    }
  };

  return { messages, sendMessage, quote, progress };
}
```

### 3. Enrollment Flow

```
User has quote (from traditional or AI flow)
  ↓
Navigate to /enroll/start
  ↓
InsuranceForm (personal info)
  - Prepopulated from quote
  - User completes additional fields
  ↓
enrollmentService.createEnrollment()
enrollmentService.updateEnrollment(personalInfo)
  ↓
Navigate to /enroll/contribution
  ↓
EnhancedContributionForm (payment)
  - Amount, frequency
  - Bank details
  - Origin of funds
  ↓
enrollmentService.updateEnrollment(contribution)
  ↓
Navigate to /enroll/beneficiaries
  ↓
BeneficiariesPage
  - Add multiple beneficiaries
  - Must total 100%
  ↓
enrollmentService.updateEnrollment(beneficiaries)
  ↓
Navigate to /enroll/confirmation
  ↓
Review all data
  ↓
Final submit
  ↓
Navigate to /enroll/success
```

**JSONB Merge Pattern**:
```typescript
// Step 1: Create enrollment
const enrollment = await enrollmentService.createEnrollment();
const enrollmentId = enrollment.id;

// Step 2: Update with personal info
await enrollmentService.updateEnrollment(enrollmentId, {
  personalInfo: { /* data */ }
});
// Enrollment now has: { personalInfo: {...} }

// Step 3: Update with contribution
await enrollmentService.updateEnrollment(enrollmentId, {
  contribution: { /* data */ }
});
// Enrollment now has: { personalInfo: {...}, contribution: {...} }

// Step 4: Update with beneficiaries
await enrollmentService.updateEnrollment(enrollmentId, {
  beneficiaries: [ /* data */ ]
});
// Enrollment now has: { personalInfo: {...}, contribution: {...}, beneficiaries: [...] }
```

### 4. Agent Authentication Flow

```
Agent navigates to /agent/login
  ↓
LoginForm displays
  ↓
Agent enters phone number
  ↓
agentService.requestOTP()
  ↓
OTP input appears
  ↓
Agent enters OTP
  ↓
agentService.verifyOTP()
  ↓
JWT token stored in localStorage
  ↓
Agent profile stored in AgentAuthContext
  ↓
Navigate to /agent/dashboard
  ↓
Dashboard displays agent's enrollments
```

**Component Implementation**:
```typescript
// LoginForm.tsx
function LoginForm() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const { login } = useAgentAuth();

  const handleRequestOTP = async () => {
    await agentService.requestOTP(phoneNumber, '+212');
    setStep('otp');
  };

  const handleVerifyOTP = async (otp: string) => {
    const response = await agentService.verifyOTP(phoneNumber, '+212', otp);
    login(response.token, response.agent);
    navigate('/agent/dashboard');
  };

  return (
    <div>
      {step === 'phone' ? (
        <PhoneInput onSubmit={handleRequestOTP} />
      ) : (
        <OTPInput onSubmit={handleVerifyOTP} />
      )}
    </div>
  );
}
```

## UI Components Library

### Button Component

```typescript
// components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded font-semibold transition-colors';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
  };
  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size])}
      {...props}
    />
  );
}
```

### Input Component

```typescript
// components/ui/Input.tsx
interface InputProps {
  label?: string;
  error?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}

export function Input({
  label,
  error,
  ...inputProps
}: InputProps) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium mb-1">
          {label}
          {inputProps.required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        className={clsx(
          'w-full px-3 py-2 border rounded',
          error ? 'border-red-500' : 'border-gray-300',
          'focus:outline-none focus:ring-2 focus:ring-blue-500'
        )}
        {...inputProps}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
```

### Card Component

```typescript
// components/ui/Card.tsx
interface CardProps {
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({ title, children, footer }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {title && (
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 border-t bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
}
```

## Services (API Clients)

### Pricing Service

```typescript
// services/pricingService.ts
class PricingService {
  private baseURL = process.env.REACT_APP_PRICING_SERVICE_URL;

  async calculateQuote(data: QuoteFormData): Promise<Quote> {
    const response = await fetch(`${this.baseURL}/api/v1/quotes/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.transformToAPI(data))
    });

    if (!response.ok) {
      throw new Error('Failed to calculate quote');
    }

    const result = await response.json();
    return result.quote;
  }

  private transformToAPI(data: QuoteFormData): PricingRequest {
    return {
      productType: 'term_life',
      applicant: {
        gender: data.gender === 'male' ? 'Male' : 'Female',
        birthDate: data.dateOfBirth,
        height: parseFloat(data.height),
        weight: parseFloat(data.weight),
        city: data.city,
        usesNicotine: data.usesNicotine
      },
      policy: {
        termLength: parseInt(data.termLength),
        coverageAmount: 500000
      }
    };
  }
}

export const pricingService = new PricingService();
```

### Enrollment Service

```typescript
// services/enrollmentService.ts
class EnrollmentService {
  private baseURL = process.env.REACT_APP_ENROLLMENT_SERVICE_URL;

  private getHeaders() {
    const token = localStorage.getItem('agent_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async createEnrollment(): Promise<Enrollment> {
    const response = await fetch(`${this.baseURL}/api/v1/enrollments`, {
      method: 'POST',
      headers: this.getHeaders()
    });

    const result = await response.json();
    return result.enrollment;
  }

  async updateEnrollment(id: string, data: Partial<EnrollmentData>): Promise<Enrollment> {
    const response = await fetch(`${this.baseURL}/api/v1/enrollments/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    const result = await response.json();
    return result.enrollment;
  }

  async getEnrollment(id: string): Promise<Enrollment> {
    const response = await fetch(`${this.baseURL}/api/v1/enrollments/${id}`, {
      headers: this.getHeaders()
    });

    const result = await response.json();
    return result.enrollment;
  }
}

export const enrollmentService = new EnrollmentService();
```

## Styling with Tailwind CSS

### Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b'
      }
    }
  },
  plugins: []
};
```

### Common Patterns

**Container**:
```tsx
<div className="container mx-auto px-4 py-8">
  {/* Content */}
</div>
```

**Card**:
```tsx
<div className="bg-white rounded-lg shadow-md p-6">
  {/* Card content */}
</div>
```

**Form Group**:
```tsx
<div className="mb-4">
  <label className="block text-sm font-medium mb-1">Label</label>
  <input className="w-full px-3 py-2 border rounded" />
</div>
```

**Button**:
```tsx
<button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
  Submit
</button>
```

## Form Validation

### Pattern

```typescript
// Component with validation
function QuoteForm() {
  const [formData, setFormData] = useState<QuoteFormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 18 || age > 70) {
        newErrors.dateOfBirth = 'Age must be between 18 and 70';
      }
    }

    if (!formData.height || parseFloat(formData.height) < 100) {
      newErrors.height = 'Height must be at least 100 cm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const quote = await pricingService.calculateQuote(formData);
      setQuote(quote);
      navigate('/quote');
    } catch (error) {
      setErrors({ submit: 'Failed to calculate quote' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Height (cm)"
        type="number"
        value={formData.height}
        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
        error={errors.height}
        required
      />
      {/* More fields */}
      <Button type="submit">Calculate Quote</Button>
    </form>
  );
}
```

## Environment Variables

```bash
# .env.local
REACT_APP_PRICING_SERVICE_URL=http://localhost:3001
REACT_APP_ENROLLMENT_SERVICE_URL=http://localhost:3002
REACT_APP_AGENT_SERVICE_URL=http://localhost:3003
REACT_APP_LLM_QUOTE_SERVICE_URL=http://localhost:3004
REACT_APP_ENV=development
```

**Usage**:
```typescript
const baseURL = process.env.REACT_APP_PRICING_SERVICE_URL;
```

## Development Workflow

### Start Development Server

```bash
npm start
```

Runs on http://localhost:3000

### Build for Production

```bash
npm run build
```

Outputs to `build/` directory

### Run Tests

```bash
npm test
```

### Type Checking

```bash
npx tsc --noEmit
```

## Best Practices

### 1. Component Organization

- One component per file
- Group related components in folders
- Export from index files for cleaner imports

### 2. State Management

- Use Context for global state
- Use local state for component-specific data
- Lift state only when necessary

### 3. API Calls

- Centralize API logic in service files
- Handle errors consistently
- Show loading states

### 4. TypeScript

- Define interfaces for all data structures
- Avoid `any` type
- Use strict mode

### 5. Styling

- Use Tailwind utility classes
- Extract repeated patterns into components
- Keep responsive design in mind

---

**Last Updated**: December 2025
**Document Owner**: Engineering Team
**Version**: 1.0
