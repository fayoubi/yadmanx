# Agent Dashboard Header Mockups

This directory contains high-fidelity mockups demonstrating the standardized agent dashboard experience.

## Files

### HTML Mockup
- **header-preview.html** - Interactive HTML mockup with all design variations
  - View in browser: Open `header-preview.html` in any modern browser
  - Uses Tailwind CSS CDN for styling
  - Production-ready visual fidelity

### Screenshot Generator
- **generate-screenshots.js** - Automated PNG screenshot generator
  - Requires: `npm install puppeteer`
  - Usage: `node generate-screenshots.js`
  - Generates 8 PNG files

## Mockup Sections

1. **Dashboard Before** - Current inline header implementation
2. **Dashboard After** - New AuthenticatedHeader component
3. **Enrollment Before** - Generic header (unauthenticated)
4. **Enrollment After** - Authenticated agent header
5. **Side-by-Side Comparison** - Dashboard vs Enrollment navigation behaviors
6. **State Transitions** - Header adaptation on authentication changes
7. **Implementation Summary** - Key metrics and benefits

## Viewing the Mockups

### Option 1: Open HTML Directly
```bash
# macOS
open mockups/header-preview.html

# Linux
xdg-open mockups/header-preview.html

# Windows
start mockups/header-preview.html
```

### Option 2: Generate PNG Screenshots
```bash
cd mockups
npm install puppeteer
node generate-screenshots.js
```

This will create PNG files:
- `01-full-mockup-page.png` - Complete page
- `02-mockup-section-1.png` through `08-mockup-section-7.png` - Individual sections

### Option 3: Use a Local Server
```bash
# Using Python
cd mockups
python3 -m http.server 8000

# Using Node.js
npx http-server mockups -p 8000
```

Then visit: http://localhost:8000/header-preview.html

## Design Specifications

### Colors
- **Primary Dark Blue**: `#1e3a8a` (bg-primary-900)
- **White**: `#ffffff`
- **Blue hover**: 90% opacity white
- **Success Green**: `#10b981`
- **Warning Yellow**: `#fbbf24`

### Typography
- **Logo**: text-xl, font-bold
- **Navigation**: font-medium (Dashboard), normal weight (About/Contact)
- **Agent Info**: text-sm, font-medium
- **Logout Button**: text-sm, font-medium

### Spacing
- **Header padding**: py-5 (20px vertical)
- **Container**: max-w-7xl with px-4 sm:px-6 lg:px-8
- **Nav spacing**: space-x-6 (24px between links)
- **Agent info spacing**: space-x-4 (16px)

## Implementation Notes

### Navigation Behavior Matrix

| Link | Dashboard Context | Enrollment Context |
|------|------------------|-------------------|
| YadmanX Logo | New window | New window |
| Dashboard | React Router Link | React Router Link |
| About | React Router Link | New window (`target="_blank"`) |
| Contact | React Router Link | New window (`target="_blank"`) |

### Security
- All `target="_blank"` links include `rel="noopener noreferrer"`
- No token exposure in header component
- Logout clears all authentication data

## Questions?

For implementation details, see:
- `/Users/fahdayoubi/.claude/plans/velvety-wobbling-meteor.md` - Full implementation plan
- `/src/components/common/AuthenticatedHeader.tsx` - Component code
- `/src/components/common/EnrollmentLayout.tsx` - Layout wrapper
