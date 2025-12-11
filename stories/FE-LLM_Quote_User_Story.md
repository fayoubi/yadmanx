# User Story: Conversational AI Quote UI/UX Implementation

## 📋 User Story

**As a** frontend developer building YadmanX  
**I want** to implement a beautiful, responsive conversational AI quote interface  
**So that** end customers can have an intuitive, engaging experience collecting their information and receiving a quote

## 🎯 Background Context

**Current State:**
- Form-based quote UI exists at `localhost:3001/quote` with traditional form fields
- Backend conversational logic and pricing integration implemented (separate story)
- Need polished frontend to deliver the conversational experience

**Vision:**
- New conversational interface at `localhost:3001/ai-quote`
- Modern chat interface with AI on left, user on right
- Smooth animations, clear visual progress
- Mobile-first responsive design
- Professional YadmanX branding

**Key Success Factor:**
- User completes quote in 2-3 minutes without friction
- Engagement: feels conversational, not robotic
- Mobile adoption: 50%+ of quotes from mobile devices

## ✅ Acceptance Criteria

### 1. Page Layout & Structure

- [ ] **Overall Layout**
  - [ ] Header with YadmanX logo and "AI Quote Assistant" title
  - [ ] Breadcrumb or back button to return to homepage
  - [ ] Main conversation container (centered, max-width 600px on desktop)
  - [ ] Conversation history scrollable, latest message visible
  - [ ] Input field fixed at bottom (persistent while scrolling)
  - [ ] Footer with copyright/contact info (visible on desktop, hidden on mobile)

- [ ] **Responsive Breakpoints**
  - [ ] **Desktop** (1200px+): Centered conversation window with sidebars
  - [ ] **Tablet** (768px-1199px): Full-width conversation with padding
  - [ ] **Mobile** (below 768px): Full-screen conversation with minimal padding
  - [ ] All elements function on all screen sizes

- [ ] **Page Route**
  - [ ] Route: `/ai-quote`
  - [ ] Query parameter support: `/ai-quote?resumeSession=sessionId` (for returning users)
  - [ ] No reload on sending messages (SPA behavior)

### 2. Conversation Display & Messages

- [ ] **Message Rendering**
  - [ ] AI messages: Bubble on left side, gray background (#f0f0f0)
  - [ ] User messages: Bubble on right side, blue background (YadmanX brand color #003D82)
  - [ ] Each message has timestamp (hidden on mobile, shown on hover on desktop)
  - [ ] Messages have slight fade-in animation as they appear
  - [ ] Avatar for AI (small icon/image on left)
  - [ ] Sender name above first message in sequence (optional)

- [ ] **Typing Indicator**
  - [ ] When waiting for AI response, show "AI is typing..." with animated dots
  - [ ] Typing indicator at bottom of conversation
  - [ ] Disappears when AI message arrives

- [ ] **Conversation History**
  - [ ] Full conversation visible on page load (scrolled to bottom)
  - [ ] User can scroll up to review earlier messages
  - [ ] New messages auto-scroll to bottom (unless user scrolled up)
  - [ ] Messages remain in order with clear chronology
  - [ ] Maximum 50 messages in view (lazy-load older messages if needed)

- [ ] **Message Content**
  - [ ] AI messages render as plain text with proper line breaks
  - [ ] Links in AI messages are clickable (if included)
  - [ ] User messages display exactly as user typed them
  - [ ] Special characters, emoji handled correctly

### 3. User Input & Interaction

- [ ] **Input Field**
  - [ ] Text input at bottom of screen with placeholder: "Your response..."
  - [ ] Input field expands as user types (up to 3 lines max)
  - [ ] Send button (icon: paper plane or "Send") to right of input
  - [ ] Submit on Enter key (Shift+Enter for new line)
  - [ ] Auto-focus on input field after message sent
  - [ ] Clear input after successful send

- [ ] **Quick-Reply Buttons** (Context-Dependent)
  - [ ] Show for yes/no questions: "Yes" and "No" buttons below AI message
  - [ ] Show for gender selection: "Male" and "Female" buttons
  - [ ] Show for term selection: "10-Year" and "20-Year" buttons
  - [ ] Show for confirmation: "Yes, Correct", "No, Let Me Change", "Change [Field]"
  - [ ] Buttons styled as gray boxes, highlight on hover, blue when clicked
  - [ ] Clicking button sends response as if user typed it
  - [ ] Disappear after response sent

- [ ] **Interactive Input Elements** (Context-Dependent)
  - [ ] **Date Picker** for DOB: Calendar widget or date input field (HTML5 `<input type="date">`)
  - [ ] **Dropdown** for City: Searchable dropdown with autocomplete (top 10 Moroccan cities visible)
  - [ ] **Number Input** for Height/Weight: Spinner control or plain number field
  - [ ] All inputs validate in real-time with visual feedback
  - [ ] Submit within input field (Enter key or button click)

- [ ] **Accessibility**
  - [ ] All interactive elements keyboard-accessible (Tab navigation)
  - [ ] Buttons have proper ARIA labels for screen readers
  - [ ] Input fields have associated labels
  - [ ] Proper focus indicators (blue outline on focused elements)
  - [ ] Skip-to-content link (optional but recommended)

### 4. Progress Indication & Feedback

- [ ] **Progress Indicator**
  - [ ] Shows "Question X of 7" at top or bottom of conversation
  - [ ] Visual progress bar (filled 1/7, 2/7, etc.)
  - [ ] Updates as conversation progresses
  - [ ] Estimated time remaining: "~2 min remaining" (updates as user progresses)

- [ ] **Validation Feedback**
  - [ ] Invalid input: Red error message below input field
  - [ ] Example: "Please enter a valid date (DD/MM/YYYY)"
  - [ ] Error clears when valid input provided
  - [ ] No page refresh or popup alerts

- [ ] **Loading States**
  - [ ] Typing indicator while awaiting AI response (animated dots)
  - [ ] "Calculating your quote..." message when pricing service called
  - [ ] Spinner or loading animation during calculation
  - [ ] Disable input while processing (prevent double-submit)

- [ ] **Success/Status Messages**
  - [ ] Green checkmark for confirmed fields: "✓ Confirmed"
  - [ ] Quote calculation success: Show quote clearly
  - [ ] Email sent: "✓ Quote sent to [email]"
  - [ ] Error states: Clear error message with retry option

### 5. Quote Display & Post-Quote UI

- [ ] **Quote Display Section**
  - [ ] When quote generated, display in special formatted box:
    - [ ] **Premium Amount**: Large, prominent number (MAD 5,000/month)
    - [ ] **Coverage & Term**: "Coverage: $500,000 | 20-year term"
    - [ ] **Quote ID**: "Quote ID: quote_12345" (small, for reference)
    - [ ] **Expiration**: "Valid until [date/time]"
    - [ ] **Applicant Summary**: 
      ```
      Male, 35 years old | Casablanca | Non-smoker
      ```
    - [ ] **Rate Factors** (collapsible/expandable):
      - Age: Standard
      - Location: +5% adjustment
      - Health: Standard rates

  - [ ] **Coverage Amount Adjustment**
    - [ ] Slider or number input to adjust coverage
    - [ ] Shows updated premium in real-time as slider moves
    - [ ] Range: $100,000 - $2,000,000
    - [ ] "Get New Quote" button after adjustment

  - [ ] **Alternative Term Display** (Optional)
    - [ ] "See 10-year rate instead?" link
    - [ ] Shows comparison quote without restarting

- [ ] **Post-Quote Buttons**
  - [ ] **Apply Now** (Primary CTA): Blue button, large, sends to application page
  - [ ] **Email Quote** (Secondary): Links to email form
  - [ ] **Start Over** (Tertiary): Link to reset conversation
  - [ ] Button styling: Primary buttons filled blue (#003D82), secondary buttons outlined
  - [ ] All buttons have clear labels and appropriate spacing

### 6. Visual Design & Branding

- [ ] **Color Scheme**
  - [ ] Primary: YadmanX blue #003D82
  - [ ] Secondary: Light gray #f0f0f0 (for AI messages)
  - [ ] Accent: Green #00AA44 (for success states)
  - [ ] Error: Red #d32f2f
  - [ ] Text: Dark gray #333 (primary), #666 (secondary)

- [ ] **Typography**
  - [ ] Font Family: System fonts (e.g., -apple-system, BlinkMacSystemFont, Segoe UI, Arial)
  - [ ] **Headings** (Page title, section titles): Bold, 24px on desktop / 20px on mobile
  - [ ] **Body Text** (AI messages, user messages): Regular, 16px on desktop / 16px on mobile
  - [ ] **Small Text** (timestamps, IDs, captions): Regular, 12px
  - [ ] Line height: 1.5 for readability
  - [ ] Letter spacing: Default/normal

- [ ] **Spacing & Layout**
  - [ ] Conversation padding: 20px on desktop, 12px on mobile
  - [ ] Message margin: 8px vertical, 0 horizontal
  - [ ] Input field margin: 16px top, 16px sides
  - [ ] Consistent gutters throughout

- [ ] **Visual Polish**
  - [ ] Smooth transitions (200ms) for hover states, animations
  - [ ] Box shadows on message bubbles (subtle, -0 2px 4px rgba)
  - [ ] Rounded corners on bubbles (12px border-radius)
  - [ ] Proper contrast ratios (WCAG AA: 4.5:1 for text)
  - [ ] No jarring colors or animations

- [ ] **YadmanX Branding**
  - [ ] Logo in header (left side)
  - [ ] "Powered by YadmanX" in footer
  - [ ] Brand colors used consistently
  - [ ] Professional, modern aesthetic

### 7. Mobile Experience

- [ ] **Touch-Friendly**
  - [ ] Button minimum size: 44px x 44px (iOS standard)
  - [ ] Input fields have proper padding for touch
  - [ ] Date picker uses native mobile date input
  - [ ] Dropdown/select uses native mobile keyboard

- [ ] **Mobile Layout**
  - [ ] Full-width conversation window (no sidebars)
  - [ ] Minimal padding (12px sides)
  - [ ] Bottom navigation doesn't overlap input field
  - [ ] Virtual keyboard doesn't hide content
  - [ ] Conversation scrolls smoothly on mobile

- [ ] **Mobile Optimization**
  - [ ] Page loads quickly (target: <3 seconds)
  - [ ] Images optimized (if any)
  - [ ] No horizontal scrolling
  - [ ] Swipe gestures optional (not required)

### 8. Error Handling & Edge Cases

- [ ] **Network Errors**
  - [ ] Timeout sending message: "Connection lost. Retry?" button
  - [ ] Pricing service unavailable: "Service temporarily unavailable. Try again?"
  - [ ] Session expired: "Your session ended. Start a new conversation?"

- [ ] **Session Management**
  - [ ] If user closes browser: Session stored in Redis, can resume (show "Resume Previous Session?" on load)
  - [ ] If session expires: Clear conversation, show message "Your session expired. Let's start fresh"
  - [ ] User can manually clear conversation: "Start Over" button resets

- [ ] **Data Validation**
  - [ ] Age out of range: "Age must be between 18 and 80"
  - [ ] Invalid city: "We don't recognize that city. Try [nearby cities]"
  - [ ] Invalid email format: "Please enter a valid email"

### 9. Transitions & Navigation

- [ ] **Route Transitions**
  - [ ] From homepage to `/ai-quote`: Smooth page load
  - [ ] Apply Now → `/application?quoteId=X`: Preserves quote data
  - [ ] Email Quote modal appears (or new page)
  - [ ] Back button returns to homepage

- [ ] **Conversation Transitions**
  - [ ] Each message appears smoothly (fade-in)
  - [ ] New question from AI feels like natural conversation flow
  - [ ] Status changes (collecting → confirming → completed) are clear

## 🔧 Technical Architecture

### Frontend Stack (React)

**Component Structure:**
```
src/pages/
  ├── AiQuotePage.tsx                 // Main page component
  │
components/
  ├── ConversationContainer.tsx       // Main conversation area
  ├── MessageBubble.tsx               // Individual message display
  ├── InputField.tsx                  // User input + send
  ├── ProgressIndicator.tsx           // "Question X of 7"
  ├── QuoteDisplay.tsx                // Quote summary/details
  ├── QuickReplyButtons.tsx           // Yes/No/etc buttons
  ├── ContextualInput.tsx             // Date picker, dropdown, etc.
  ├── LoadingIndicator.tsx            // Typing animation, spinner
  └── EmailQuoteModal.tsx             // Email sharing interface
  
hooks/
  ├── useConversation.ts              // Conversation state & logic
  ├── useSessionManager.ts            // Session handling
  └── useQuoteData.ts                 // Quote extraction & prep

styles/
  ├── AiQuote.module.css              // Component-specific styles
  ├── variables.css                   // Colors, spacing, typography
  └── responsive.css                  // Media queries

utils/
  ├── apiClient.ts                    // API calls to llm-quote-service
  ├── validators.ts                   // Input validation
  └── formatters.ts                   // Date, currency formatting
```

**Component Responsibilities:**

- `ConversationContainer`: Manages message display, scrolling
- `InputField`: Text input, send button, validation
- `QuickReplyButtons`: Context-aware quick response options
- `ContextualInput`: Dynamic input based on field type (date, dropdown, etc.)
- `QuoteDisplay`: Shows quote details and post-quote options

### API Integration

**Frontend calls to llm-quote-service:**

```typescript
// Start new conversation
POST /api/v1/conversations
Response: { sessionId, initialMessage }

// Send message
POST /api/v1/conversations/{sessionId}/message
Body: { message: string }
Response: { sessionId, aiResponse, extractedData, status, inputType? }

// Get current state (optional, for session recovery)
GET /api/v1/conversations/{sessionId}/summary
Response: { extractedData, progress, sessionExpiry }

// Confirm and calculate quote
POST /api/v1/conversations/{sessionId}/confirm
Response: { quote, quoteId, expiresAt }
```

### State Management

**Local state (per conversation):**
```typescript
{
  sessionId: string;
  messages: Message[];                 // conversation history
  currentProgress: number;             // question number (1-7)
  isLoading: boolean;                  // awaiting AI response
  error?: string;                      // error message if any
  extractedData: ExtractedData;        // user's collected info
  quote?: Quote;                       // when generated
  status: "collecting" | "confirming" | "complete" | "error";
}
```

**Persistence:**
- SessionId stored in URL params and localStorage for recovery
- Conversation history stored in sessionStorage (cleared on close)
- Quote data available in state and localStorage for prepopulation

### Styling Approach

**CSS Modules** (recommended):
- Scoped component styles
- Variables for colors, spacing
- Responsive utilities for mobile-first design
- BEM naming convention

**Example Structure:**
```css
/* AiQuote.module.css */
.container { /* main wrapper */ }
.header { /* logo + title */ }
.conversationWindow { /* message area */ }
.messageBubble { /* message styles */ }
.messageBubble--ai { /* AI message variant */ }
.messageBubble--user { /* user message variant */ }
.inputArea { /* bottom input section */ }
.progressBar { /* progress indicator */ }
.quoteDisplay { /* quote result box */ }

/* Responsive */
@media (max-width: 768px) {
  .conversationWindow { /* mobile adjustments */ }
}
```

### Performance Considerations

- [ ] Lazy load older messages (if conversation very long)
- [ ] Memoize message components (prevent unnecessary re-renders)
- [ ] Debounce input validation (don't validate on every keystroke)
- [ ] Optimize re-renders with React.memo
- [ ] Asset optimization: compress logo/images

## 🧪 Testing Scenarios

### Happy Path - Desktop
- [ ] Page loads with initial AI greeting
- [ ] User types message, clicks send → message appears on right
- [ ] AI response appears on left with typing indicator
- [ ] Progress shows "Question 1 of 7"
- [ ] Conversation flows through all 7 questions
- [ ] Quote displays properly formatted
- [ ] "Apply Now" button navigates to application page

### Happy Path - Mobile
- [ ] Page loads full-width on mobile (no horizontal scroll)
- [ ] Virtual keyboard doesn't hide input field
- [ ] Quick reply buttons easily tappable
- [ ] Date picker uses native mobile input
- [ ] Conversation scrolls smoothly
- [ ] Quote displays clearly on mobile

### Interactive Elements
- [ ] Quick reply buttons work (click sends response)
- [ ] Date picker shows calendar/date input
- [ ] Dropdown shows autocomplete suggestions
- [ ] Input validation shows errors
- [ ] Send button disabled while processing

### Error States
- [ ] Network error → "Retry?" button appears
- [ ] Session timeout → "Session expired" message
- [ ] Invalid input → Error message shown
- [ ] Service unavailable → Clear error message

### Edge Cases
- [ ] User refreshes page → Can resume session
- [ ] User goes back/forward in browser → Conversation preserved
- [ ] Very long conversation (20+ messages) → Scrolls smoothly
- [ ] User on slow network → Loading states appear properly

## 📝 Definition of Done

- [ ] All components created and functional
- [ ] Responsive design tested on desktop, tablet, mobile
- [ ] Messages display and send correctly
- [ ] Quick reply buttons working
- [ ] Contextual inputs (date picker, dropdown) functional
- [ ] Quote display formatted and styled
- [ ] Progress indicator updating correctly
- [ ] Error handling and validation working
- [ ] API integration complete
- [ ] Session management implemented
- [ ] Mobile optimized and tested
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] All tests passing (component, integration, e2e)
- [ ] Code reviewed and merged
- [ ] Page deployed to staging
- [ ] Performance metrics acceptable (<3s load time)
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)

## 🎯 Success Metrics

- **Page Load Time**: < 3 seconds
- **Time to First Quote**: 2-3 minutes average
- **Mobile Adoption**: 50%+ of conversations
- **Completion Rate**: 85%+ of started conversations generate quote
- **Error Rate**: < 5% of interactions cause errors
- **User Satisfaction**: 4.5+/5.0 in post-quote survey

---

**Priority**: High  
**Story Points**: 13 (2 weeks)  
**Dependencies**: llm-quote-service API finalized, pricing-service stable  
**Blocks**: User cannot complete AI quote without UI  
**Blocked By**: None  

