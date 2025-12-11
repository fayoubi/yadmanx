# User Story: Email Quote Sharing

## 📋 User Story

**As a** prospective insurance customer  
**I want** to email my insurance quote to myself or someone else  
**So that** I can review it later, share it with a family member or financial advisor, or easily start my application from another device

## 🎯 Background Context

**Current State:**
- Users generate quotes through form-based or conversational AI interface
- Quote is displayed on screen but there's no mechanism to save/share it
- Users must manually note down premium information or navigate back to quote page

**Problem:**
- Users who aren't ready to apply immediately lose access to their quote
- No way to share with spouse, family member, or advisor for discussion
- High abandonment if user closes browser or navigates away

**Solution:**
- Provide "Email Quote" option from any quote display screen
- Allow users to send to themselves or custom email address
- Email includes quote summary, premium details, applicant info summary, and "Apply Now" link
- Preserve quote ID for later retrieval

**Scope:**
- Available on both form-based quote and conversational AI quote
- Quote-to-email on initial quote generation
- Email format: professional, branded, mobile-responsive HTML

## ✅ Acceptance Criteria

### 1. Email Entry & Validation

- [ ] **Email Input UI**
  - [ ] Display email input field on quote display page (after quote is shown)
  - [ ] Default to applicant's email if available (if quote collected email)
  - [ ] Label: "Email this quote to (yourself or someone else)"
  - [ ] Placeholder: "your.email@example.com"
  - [ ] Validation: Real-time email format validation

- [ ] **Email Validation**
  - [ ] Accept standard email format (RFC 5322 basic compliance)
  - [ ] Reject obviously invalid formats: no @, no domain, etc.
  - [ ] Show validation error: "Please enter a valid email address"
  - [ ] Allow up to 100 characters (domain length limits)

- [ ] **Multiple Recipients**
  - [ ] User can enter one email address for MVP
  - [ ] Future enhancement: Support comma-separated multiple emails (not MVP)

### 2. Email Quote Content

- [ ] **Email Subject Line**
  - [ ] "Your Term Life Insurance Quote - Quote ID: [quoteId]"
  - [ ] Concise and searchable

- [ ] **Email Body - HTML Format**
  - [ ] **Header**: YadmanX logo and branding
  - [ ] **Greeting**: "Hi [Name if available, otherwise 'there'],"
  - [ ] **Introduction**: 
    ```
    We've prepared your personalized term life insurance quote based on your information. 
    Review the details below and let us know if you have any questions.
    ```

  - [ ] **Applicant Summary Section**
    - Gender: Male/Female
    - Age: [calculated from DOB]
    - Location: [City, Morocco]
    - Health Profile: [Non-smoker/Smoker]

  - [ ] **Quote Details Section**
    - Monthly Premium: [Amount in Local Currency]
    - Coverage Amount: [e.g., $500,000]
    - Term Length: [10-year / 20-year]
    - Quote ID: [quoteId]
    - Valid Until: [Expiration date/time]

  - [ ] **Premium Comparison** (if available)
    - Show impact of key factors on pricing:
      - "Your monthly premium is $X because of:"
      - "Your age (X years): Base rate factor"
      - "Your location (City): Regional factor"
      - "Nicotine-free: Standard rates applied"

  - [ ] **Next Steps Section**
    - [ ] Large "Review & Apply" button/link
      - Links to application flow with quote pre-populated
      - If quote was from conversational AI: Link to `localhost:3001/application?quoteId=[quoteId]`
      - If quote was from form: Link to `localhost:3001/application?quoteId=[quoteId]`
    
    - [ ] Alternative CTA: "Have questions? Contact us at [support email]"

  - [ ] **Footer**
    - YadmanX branding/logo
    - Contact information
    - Privacy notice: "Your quote data is secure and private"
    - Unsubscribe option (optional for MVP)

  - [ ] **Mobile Responsive**
    - [ ] Email renders properly on mobile devices
    - [ ] Button click areas large enough for touch
    - [ ] Text readable on small screens
    - [ ] Images scale appropriately

### 3. Email Sending Functionality

- [ ] **Backend Service**
  - [ ] Email service microservice or utility handles SMTP delivery
  - [ ] Integrates with email provider (SendGrid, AWS SES, or similar)
  - [ ] Retry logic: 3 attempts if delivery fails
  - [ ] Timeout: 10 seconds max before returning result to user

- [ ] **User Feedback - Success**
  - [ ] After sending: "✓ Quote sent to [email address]"
  - [ ] Success message appears for 5 seconds then fades
  - [ ] Green color indicating success
  - [ ] Can send again to different email: "Send to another email?"

- [ ] **User Feedback - Failure**
  - [ ] If send fails: "We couldn't send the email. Please try again or contact support."
  - [ ] Provide retry button
  - [ ] Log error for support investigation

- [ ] **Rate Limiting**
  - [ ] Prevent spam: Max 5 emails per quote ID per hour
  - [ ] If limit reached: "You've already sent this quote multiple times. Please try again later."

### 4. Data & Security

- [ ] **Data Logging**
  - [ ] Log email sends: quoteId, recipientEmail, timestamp, status
  - [ ] Store in database: `quote_email_logs` table
  - [ ] Track for analytics: "X% of quotes are emailed"

- [ ] **Privacy**
  - [ ] Recipient email address is NOT displayed in quote emails
  - [ ] No tracking pixels or read receipts
  - [ ] Email does not expose applicant's full personal data to recipient unnecessarily
  - [ ] Email is not broadcast—only one specific recipient gets each email

- [ ] **Security**
  - [ ] All email transmission over TLS/SSL
  - [ ] Quote IDs are cryptographically random (UUID)
  - [ ] Email endpoint requires HTTPS
  - [ ] Rate limiting prevents email enumeration attacks

### 5. Integration Points

- [ ] **Quote Display Screen**
  - [ ] Works on form-based quote page (`localhost:3001/quote`)
  - [ ] Works on conversational AI quote page (`localhost:3001/ai-quote`)
  - [ ] Email button placed prominently below quote details
  - [ ] Accessible via keyboard (Tab navigation)

- [ ] **Quote Retrieval Link**
  - [ ] Email includes quote ID
  - [ ] User can return to quote via: `localhost:3001/quote?quoteId=[quoteId]`
  - [ ] Endpoint retrieves quote from database if still valid
  - [ ] Shows quote details + option to apply or email again

- [ ] **Application Prepopulation**
  - [ ] "Apply Now" link in email redirects to application with quote data
  - [ ] Application form prepopulated with applicant data from quote
  - [ ] No re-entry of information required

## 🔧 Technical Architecture

### Email Service Microservice (or Utility)

**Option A: Standalone Microservice (Recommended)**
```
email-service/ (NEW)
├── src/
│   ├── controllers/
│   │   └── EmailController.ts
│   ├── services/
│   │   ├── EmailService.ts
│   │   ├── SMTPProvider.ts          (SendGrid, SES integration)
│   │   └── TemplateRenderer.ts      (HTML template rendering)
│   ├── models/
│   │   └── types.ts
│   ├── templates/
│   │   └── quoteEmail.html          (Handlebars or similar)
│   ├── middleware/
│   │   ├── validation.ts
│   │   └── rateLimiting.ts
│   ├── database/
│   │   └── EmailLogRepository.ts
│   └── routes/
│       └── emailRoutes.ts
├── tests/
├── Dockerfile
└── docker-compose.override.yml
```

**Option B: Utility Module in Existing Service**
- Add email functionality to quote or application service
- Simpler for MVP, but less modular long-term

**Recommendation**: Option A (standalone microservice) for:
- Scalability (email sending can be bottleneck)
- Reusability (other services may need email later)
- Independent testing and deployment
- Clear separation of concerns

### API Endpoint

**POST /api/v1/quotes/{quoteId}/email**
- Request:
  ```json
  {
    "recipientEmail": "user@example.com"
  }
  ```

- Response (Success):
  ```json
  {
    "success": true,
    "message": "Quote sent to user@example.com",
    "emailLogId": "email_log_12345"
  }
  ```

- Response (Failure):
  ```json
  {
    "success": false,
    "error": "Email service unavailable",
    "retryable": true
  }
  ```

### Database Schema

**New Table: `quote_email_logs`**
```sql
CREATE TABLE quote_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id),
  recipient_email VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'failed', 'bounced'
  smtp_response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (quote_id),
  INDEX (sent_at)
);
```

### Email Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #003D82; color: white; padding: 20px; text-align: center; }
    .section { margin: 20px 0; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .summary-item { padding: 10px; background: #f5f5f5; border-radius: 4px; }
    .button { background: #00AA44; color: white; padding: 12px 30px; border-radius: 4px; text-decoration: none; display: inline-block; }
    .premium { font-size: 28px; font-weight: bold; color: #003D82; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://yadmanx.com/logo.png" alt="YadmanX" style="height: 40px;">
      <h1>Your Term Life Insurance Quote</h1>
    </div>

    <p>Hi {{applicantName}},</p>
    <p>We've prepared your personalized term life insurance quote. Review the details below and let us know if you have any questions.</p>

    <div class="section">
      <h2>Your Information</h2>
      <div class="summary-grid">
        <div class="summary-item"><strong>Gender:</strong> {{gender}}</div>
        <div class="summary-item"><strong>Age:</strong> {{age}} years</div>
        <div class="summary-item"><strong>Location:</strong> {{city}}, Morocco</div>
        <div class="summary-item"><strong>Health Status:</strong> {{healthStatus}}</div>
      </div>
    </div>

    <div class="section">
      <h2>Your Quote</h2>
      <div style="text-align: center;">
        <p style="color: #666; margin: 10px 0;">Monthly Premium</p>
        <p class="premium">MAD {{monthlyPremium}}</p>
      </div>
      <table style="width: 100%; margin-top: 20px;">
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td><strong>Coverage Amount:</strong></td>
          <td style="text-align: right;">{{coverageAmount}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td><strong>Term Length:</strong></td>
          <td style="text-align: right;">{{termLength}} years</td>
        </tr>
        <tr>
          <td><strong>Quote ID:</strong></td>
          <td style="text-align: right;">{{quoteId}}</td>
        </tr>
      </table>
      <p style="color: #999; font-size: 12px; margin-top: 15px;">
        This quote is valid until {{expirationDate}}
      </p>
    </div>

    <div class="section">
      <h2>What Affects Your Rate</h2>
      <ul style="color: #666;">
        <li>Your age ({{age}} years): Standard rate</li>
        <li>Your location ({{city}}): Regional factor</li>
        <li>{{nicotineStatus}}</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{applicationUrl}}" class="button">Review & Apply Now</a>
    </div>

    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px;">
      <p>Have questions? <a href="mailto:support@yadmanx.com">Contact our team</a></p>
      <p><img src="https://yadmanx.com/logo-small.png" alt="YadmanX" style="height: 20px;"></p>
      <p style="margin-top: 10px;">Your information is secure and private. <a href="#">View Privacy Policy</a></p>
    </div>
  </div>
</body>
</html>
```

## 🧪 Testing Scenarios

### Happy Path
- [ ] User receives quote, enters email, clicks "Email Quote" → Email arrives in inbox with correct content
- [ ] User opens email and clicks "Review & Apply" → Application loads with prepopulated data
- [ ] User can send same quote to multiple different emails (rate limit not exceeded)

### Email Content Validation
- [ ] All user data displayed correctly (age calculated from DOB, etc.)
- [ ] Email responsive on mobile (Litmus testing)
- [ ] All links in email are functional
- [ ] Button click-through tracked correctly

### Error Handling
- [ ] Invalid email format entered → Validation error shown
- [ ] Email provider timeout → User sees "Please try again"
- [ ] Email already sent 5 times in an hour → Rate limit message
- [ ] User enters email then closes page → Quote still retrievable via ID

### Security
- [ ] Recipient cannot access other quotes (quote ID protection)
- [ ] Rate limiting prevents spam/enumeration
- [ ] HTTPS enforced
- [ ] Email address not exposed in quote display

## 📝 Definition of Done

- [ ] Email service microservice created with full CRUD
- [ ] SMTP integration working (SendGrid or similar)
- [ ] Email template created and responsive
- [ ] API endpoint for sending emails implemented
- [ ] Rate limiting configured and working
- [ ] Email logs stored in database
- [ ] Quote display includes email input field
- [ ] Success/failure feedback displayed to user
- [ ] All validation tests passing
- [ ] Security review completed
- [ ] HTML email templates tested on multiple email clients
- [ ] Integration tests end-to-end passing
- [ ] API documentation complete
- [ ] Error handling for all failure modes
- [ ] Code reviewed and merged
- [ ] Feature deployed to staging

## 🎯 Success Metrics

- **Email Sending Success Rate**: 95%+ of emails delivered successfully
- **Email Adoption**: 30%+ of generated quotes are emailed
- **Click-Through Rate**: 40%+ of emailed quotes lead to application start
- **Email Client Compatibility**: Renders correctly in Gmail, Outlook, Apple Mail, mobile clients

---

**Priority**: Medium  
**Story Points**: 8 (1 week)  
**Dependencies**: pricing-service stable, quote database  
**Blocks**: Nothing  
**Blocked By**: Quote generation story (needs quoteId to exist)

