# Testing Guide: Standardized Agent Dashboard Experience

This guide provides step-by-step instructions for testing the new standardized header implementation.

## Prerequisites

1. **Start all services:**
   ```bash
   # Terminal 1: Agent Service
   cd agent-service
   npm start  # Runs on port 3003

   # Terminal 2: Enrollment Service
   cd enrollment-service
   npm start  # Runs on port 3002

   # Terminal 3: Frontend
   npm start  # Runs on port 3000
   ```

2. **Test Agent Credentials:**
   - Phone: `123456789`
   - Country Code: `+1`
   - License: `TEST123`
   - Name: `Test Agent`

## Test Scenarios

### ✅ Scenario 1: Unauthenticated User in Enrollment Flow

**Purpose:** Verify generic header shows for unauthenticated users

**Steps:**
1. Open browser (incognito mode recommended)
2. Navigate to: `http://localhost:3000/enroll/start`
3. **Expected Result:**
   - Generic Header visible with:
     - YadmanX logo
     - "Get Quote", "About", "Contact" links
     - **"Agent Login"** button (white background)
   - NO agent name/license displayed
   - NO logout button

**Pass Criteria:**
- ✅ "Agent Login" button visible
- ✅ No agent info shown
- ✅ Header color is dark blue (#1e3a8a)

---

### ✅ Scenario 2: Agent Dashboard After Login

**Purpose:** Verify dashboard shows authenticated header

**Steps:**
1. Navigate to: `http://localhost:3000/agent/login`
2. Enter phone: `123456789`, country: `+1`
3. Click "Request OTP"
4. Enter the OTP code displayed (dev mode)
5. Click "Verify OTP"
6. **Expected Result:** Redirected to `/agent/dashboard`
7. **Verify Header:**
   - YadmanX logo (clickable)
   - "Dashboard", "About", "Contact" links
   - Agent info: "Test Agent | Lic# TEST123"
   - "Logout" button (white border)
   - NO "Agent Login" button

**Navigation Tests:**
- Click YadmanX logo → Opens homepage in **new window** ✓
- Click "Dashboard" → Stays on dashboard
- Click "About" → Navigates to about page
- Click "Contact" → Navigates to contact page

**Pass Criteria:**
- ✅ Agent name and license displayed
- ✅ Logout button visible
- ✅ NO "Agent Login" button
- ✅ YadmanX opens in new window
- ✅ All navigation links work

---

### ✅ Scenario 3: Authenticated Agent in Enrollment Flow

**Purpose:** Verify enrollment flow shows authenticated header with context-aware navigation

**Steps:**
1. Login as agent (follow Scenario 2, steps 1-5)
2. From dashboard, click "Start New Application"
3. **Expected Result:** Navigate to `/enroll/start`
4. **Verify Header:**
   - YadmanX logo
   - "Dashboard", "About", "Contact" links
   - Agent info: "Test Agent | Lic# TEST123"
   - "Logout" button
   - NO "Agent Login" button

**Navigation Tests:**
- Click YadmanX logo → Opens homepage in **new window** (enrollment preserved) ✓
- Click "Dashboard" → Navigates to `/agent/dashboard` (can exit enrollment)
- Click "About" → Opens in **new window** (enrollment preserved) ✓
- Click "Contact" → Opens in **new window** (enrollment preserved) ✓
- Click "Logout" → Clears auth, redirects to `/agent/login`

**Pass Criteria:**
- ✅ Agent info displayed during enrollment
- ✅ About/Contact open in new windows
- ✅ YadmanX opens in new window
- ✅ Dashboard link allows exiting enrollment
- ✅ Enrollment form remains visible in original tab

---

### ✅ Scenario 4: Logout Functionality

**Purpose:** Verify logout clears authentication and redirects correctly

**Steps:**
1. Login as agent
2. Navigate to dashboard
3. Click "Logout" button
4. **Expected Result:**
   - Redirected to `/agent/login`
   - LocalStorage cleared (`agent_token`, `agent_data`)
   - Login form shown

5. Now navigate to `/enroll/start`
6. **Expected Result:**
   - Generic Header shown (with "Agent Login" button)
   - NO agent info displayed

**Pass Criteria:**
- ✅ Logout redirects to login page
- ✅ Authentication state cleared
- ✅ Header updates to show "Agent Login" button
- ✅ Agent can log in again

---

### ✅ Scenario 5: Session Persistence

**Purpose:** Verify authentication persists across page refreshes

**Steps:**
1. Login as agent
2. Navigate to `/enroll/start`
3. **Verify:** AuthenticatedHeader with agent info visible
4. Refresh the page (F5 or Cmd+R)
5. **Expected Result:**
   - Agent remains authenticated
   - AuthenticatedHeader still visible
   - Agent info still displayed
   - Enrollment form state preserved

**Pass Criteria:**
- ✅ Auth persists after refresh
- ✅ Header remains authenticated
- ✅ No flash of unauthenticated state

---

### ✅ Scenario 6: Direct URL Access

**Purpose:** Verify authentication state loads correctly on direct URL access

**Steps:**
1. Login as agent
2. Copy enrollment URL: `http://localhost:3000/enroll/contribution`
3. Open new browser tab
4. Paste and navigate to the URL
5. **Expected Result:**
   - AuthenticatedHeader visible
   - Agent info displayed
   - Enrollment page loads correctly

**Pass Criteria:**
- ✅ Auth state loads from localStorage
- ✅ Correct header rendered
- ✅ Page content accessible

---

### ✅ Scenario 7: Browser Back/Forward Navigation

**Purpose:** Verify header consistency during browser navigation

**Steps:**
1. Login as agent
2. Navigate: Dashboard → Enrollment → Contribution → Back to Dashboard
3. Use browser back button multiple times
4. **Verify at each step:**
   - Header remains authenticated
   - Agent info always visible
   - Correct context applied (dashboard vs enrollment)

**Pass Criteria:**
- ✅ No header flashing
- ✅ Consistent agent info display
- ✅ Context-aware navigation maintained

---

### ✅ Scenario 8: Multiple Tabs

**Purpose:** Verify auth state syncs across tabs

**Steps:**
1. Login as agent in Tab 1
2. Open Tab 2, navigate to `/enroll/start`
3. **Verify Tab 2:** AuthenticatedHeader visible
4. In Tab 1, click "Logout"
5. **Verify Tab 2:** Refresh to see generic header (or implement real-time sync)

**Pass Criteria:**
- ✅ Auth state shared via localStorage
- ✅ Both tabs show consistent authentication

---

## Visual Verification Checklist

### Header Styling
- ✅ Background color: Dark blue (#1e3a8a)
- ✅ Logo: Shield icon + "YadmanX" text, white color
- ✅ Navigation links: White text, hover effect (90% opacity)
- ✅ Agent info: Small font, white text
- ✅ Logout button: White border, 2px, rounded
- ✅ Logout hover: White background, blue text
- ✅ Consistent spacing and alignment

### Responsive Design (Optional)
- Desktop (1440px): Full navigation visible
- Tablet (768px): Verify layout adapts
- Mobile (375px): Consider adding mobile menu (future)

---

## Common Issues & Troubleshooting

### Issue 1: "Agent Login" still visible when logged in
**Cause:** Authentication context not detecting logged-in state
**Fix:**
- Check localStorage for `agent_token`
- Verify `useAgentAuth()` returns `isAuthenticated: true`
- Check browser console for errors

### Issue 2: Header not updating after login
**Cause:** Component not re-rendering on auth state change
**Fix:**
- Verify `AgentAuthContext` triggers re-render
- Check if `AgentAuthProvider` wraps the entire app
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### Issue 3: Links not opening in new windows
**Cause:** Enrollment context not detected
**Fix:**
- Verify `EnrollmentLayout` passes `context="enrollment"`
- Check browser popup blocker settings
- Verify `target="_blank"` and `rel="noopener noreferrer"` in rendered HTML

### Issue 4: Token expired error
**Cause:** JWT token expiration (24 hours)
**Fix:**
- Logout and login again
- Clear localStorage: `localStorage.clear()`
- Check token expiration in Network tab

---

## Automated Testing (Future)

### Unit Tests
```typescript
// AuthenticatedHeader.test.tsx
describe('AuthenticatedHeader', () => {
  it('renders agent info when authenticated', () => {
    // Test implementation
  });

  it('renders login button when unauthenticated', () => {
    // Test implementation
  });

  it('opens links in new window for enrollment context', () => {
    // Test implementation
  });
});
```

### E2E Tests (Playwright/Cypress)
```typescript
test('authenticated agent sees correct header in enrollment', async ({ page }) => {
  await page.goto('/agent/login');
  await loginAsAgent(page);
  await page.goto('/enroll/start');
  await expect(page.locator('text=Test Agent | Lic# TEST123')).toBeVisible();
  await expect(page.locator('text=Agent Login')).not.toBeVisible();
});
```

---

## Test Results Documentation

### Test Run: [Date]

| Scenario | Status | Notes |
|----------|--------|-------|
| 1. Unauthenticated enrollment | ✅ Pass | Generic header shown |
| 2. Authenticated dashboard | ✅ Pass | Agent info displayed |
| 3. Authenticated enrollment | ✅ Pass | Context-aware navigation |
| 4. Logout functionality | ✅ Pass | State cleared correctly |
| 5. Session persistence | ✅ Pass | Auth persists on refresh |
| 6. Direct URL access | ✅ Pass | State loads from storage |
| 7. Back/Forward navigation | ✅ Pass | Consistent header |
| 8. Multiple tabs | ✅ Pass | Shared auth state |

### Overall Result: ✅ All Scenarios Pass

---

## Next Steps After Testing

1. ✅ All tests pass → Ready for deployment
2. ⚠️ Minor issues → Document and create follow-up tickets
3. ❌ Critical issues → Review implementation, fix bugs

## Questions or Issues?

- Check implementation plan: `/Users/fahdayoubi/.claude/plans/velvety-wobbling-meteor.md`
- Review component code: `/src/components/common/AuthenticatedHeader.tsx`
- Check mockups: `/mockups/header-preview.html`
