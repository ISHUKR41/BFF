# Design Guidelines: BGMI & Free Fire Tournament Platform

## Design Approach

**Reference-Based Approach**: Drawing inspiration from modern gaming platforms (Discord, Steam) combined with sleek developer tools (Vercel, Linear, GitHub) to create a professional yet exciting tournament management experience.

**Key Design Principles**:
- Precision & clarity for tournament data
- Subtle gaming excitement without overwhelming professionalism
- Instant visual feedback for real-time slot updates
- Trust-building through clean, organized layouts

## Core Design Elements

### A. Color Palette

**Dark Mode Primary** (main background):
- Base: 220 15% 8%
- Elevated surfaces: 220 15% 12%
- Highest elevation: 220 12% 16%

**Primary Brand Colors**:
- BGMI Orange: 25 95% 58%
- Free Fire Red: 0 85% 60%
- Accent Blue (CTAs): 215 90% 60%

**Semantic Colors**:
- Success (approved): 142 76% 45%
- Warning (pending): 45 93% 58%
- Destructive (rejected): 0 72% 55%
- Text primary: 0 0% 98%
- Text secondary: 220 9% 65%

**Gradients** (use sparingly for hero sections):
- Hero gradient: from 220 15% 8% via 220 15% 10% to 215 25% 15%

### B. Typography

**Font Families**:
- Primary: 'Inter', -apple-system, system-ui, sans-serif
- Headings: 'Geist Sans', 'Inter', sans-serif (slightly tighter tracking)
- Monospace (IDs, transactions): 'JetBrains Mono', monospace

**Type Scale**:
- Hero headline: text-5xl md:text-7xl, font-bold, tracking-tight
- Section headlines: text-3xl md:text-4xl, font-bold
- Card titles: text-xl font-semibold
- Body text: text-base, leading-relaxed
- Small labels: text-sm text-muted-foreground
- Metadata: text-xs font-medium text-muted-foreground

### C. Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm

**Container Strategy**:
- Max width: max-w-7xl mx-auto
- Page padding: px-4 md:px-6 lg:px-8
- Section spacing: py-16 md:py-24 lg:py-32

**Grid Patterns**:
- Tournament cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Admin dashboard: grid-cols-1 lg:grid-cols-12 (sidebar + main content)
- Form layouts: Single column on mobile, max-w-2xl centered

### D. Component Library

**Navigation Header**:
- Fixed top, backdrop-blur-xl with bg-background/80
- Height: h-16
- Logo left, navigation center, admin link right
- Border bottom: border-b border-border/40

**Hero Section** (Homepage):
- Full viewport height with gradient background
- Large headline with gaming-themed tagline
- Two prominent CTAs: "Join BGMI Tournament" and "Join Free Fire Tournament"
- Floating stat cards showing live tournament stats (total players, active tournaments)
- Subtle animated gradient orbs in background (CSS only, no heavy animations)

**Tournament Tabs**:
- Horizontal tab list with rounded full backgrounds for active state
- Tab panels with smooth transitions
- Icons: Trophy for Solo, Users for Duo, Shield for Squad

**Registration Cards**:
- Elevated cards with border-l-4 accent in game color (orange for BGMI, red for Free Fire)
- Header: Game type badge, slot counter with pulsing dot if available
- Body: Rules accordion, pricing breakdown table, registration form
- Footer: Payment QR code with upload area

**Forms**:
- Floating labels on dark input backgrounds (bg-background/50 border border-border)
- Focus ring: ring-2 ring-primary ring-offset-2 ring-offset-background
- Input groups for player details with numbered badges
- File upload: Dashed border dropzone with drag-and-drop feedback
- Submit button: Full width on mobile, max-w-xs on desktop, with loading spinner state

**Admin Dashboard Cards**:
- Registration cards in masonry layout
- Team/player name as bold header
- Player details in compact table format
- Payment screenshot as clickable thumbnail (opens modal)
- Action buttons: Approve (green), Reject (red) with confirmation dialog
- Status badge: Pill-shaped with dot indicator

**Slot Counter Display**:
- Large numeric display: text-4xl font-bold with fraction format "24/25"
- Progress bar beneath with gradient fill
- Color coding: Green (>50% available), Yellow (20-50%), Red (<20%)
- Live update animation: Brief scale and glow effect on change

**Modal/Dialog**:
- Centered overlay with backdrop-blur-sm
- Max width: max-w-2xl
- Padding: p-6
- Close button in top-right corner
- Payment screenshot viewer: Full-size image with transaction ID overlay

### E. Animations

**Subtle Interactions Only**:
- Page transitions: None (instant navigation)
- Card hover: transform scale-[1.02] duration-200
- Button hover: Built-in shadcn/ui states only
- Slot counter update: Animate count change with spring transition
- Form submission: Button transform to spinner
- Toast notifications: Slide in from top-right

**Prohibited**:
- Scroll-triggered animations
- Parallax effects
- Complex SVG animations
- Auto-playing carousels

## Page-Specific Guidelines

### Homepage

**Structure**:
1. Hero: Full viewport with gradient, headline "Join India's Most Professional Gaming Tournaments", two game CTAs, live stats overlay
2. Games Overview: Two-column grid (BGMI left, Free Fire right) with game logos, brief descriptions, tournament types badges
3. How It Works: Three-step process with numbered icons (Register → Pay → Compete)
4. Prize Pool: Table layout showing all tournament types and prize breakdowns
5. Footer: Links, contact, social media

**Images**: Use large hero background image of competitive gaming setup (blurred, low opacity as overlay)

### BGMI/Free Fire Tournament Pages

**Structure**:
1. Page header: Game logo, breadcrumb navigation
2. Tabs: Solo | Duo | Squad (sticky below header)
3. Per tab: Rules section (collapsible accordion), Slot counter (prominent), Pricing table, Registration form, Payment section
4. Sidebar: Quick stats, upcoming matches, support contact

**Images**: Game-specific character artwork in page header (medium size, not full hero)

### Admin Dashboard

**Structure**:
1. Top bar: Game selector dropdown, logout button
2. Sidebar: Tournament type filters (Solo/Duo/Squad), status filters (All/Pending/Approved/Rejected)
3. Main area: Registration cards grid with filters applied
4. Bottom bar: Total count, pagination

**Images**: None (data-focused interface)

## Accessibility & Responsiveness

- Maintain WCAG AA contrast ratios throughout
- Focus indicators on all interactive elements
- Keyboard navigation support for all forms
- Mobile: Stack all multi-column layouts to single column
- Touch targets: Minimum 44x44px
- Form validation: Inline error messages below inputs with red text and icon