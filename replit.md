# BGMI & Free Fire Tournament Platform

## Overview

This is a professional tournament management platform for BGMI (Battlegrounds Mobile India) and Free Fire mobile games. The platform enables tournament organizers to manage registrations for different game modes (Solo, Duo, Squad) with real-time slot tracking, payment verification via QR codes, and an admin dashboard for managing participant approvals.

**Key Features:**
- Multi-game support (BGMI and Free Fire)
- Three tournament modes per game (Solo, Duo, Squad)
- Real-time slot availability tracking with circular progress indicators
- Payment submission with QR code and transaction verification
- Advanced admin dashboard with statistics, bulk operations, and Excel export
- Enhanced registration form with multi-step progress, auto-save, and image compression
- Game-specific theming with animated hero banners
- Countdown timers and urgency messaging for slots
- Session-based authentication for admin access
- Professional, modern UI with dark mode design and smooth animations

## Recent Enhancements (Latest Update - October 23, 2025)

### Dark Mode Support Added
- **Fully functional dark mode with theme toggle**
  - ThemeProvider component manages theme state with React Context
  - Theme persists to localStorage and syncs across sessions
  - Detects system preference on first visit
  - Smooth theme toggle button with Sun/Moon icons in Header
  - All existing colors and design preserved - seamless light/dark transition

### Critical Database Migration & Performance Optimizations
- **Migrated from in-memory storage to PostgreSQL database**
  - Replaced `MemStorage` class with `DbStorage` using Drizzle ORM
  - All data now persists across server restarts and deployments
  - Fixes data loss issues when deploying to Vercel
  - Database initialization happens before server starts to ensure data integrity
  - Added capacity enforcement in createRegistration to prevent slot overflow
  
- **Fixed form state management**
  - Forms now properly reset after successful submission
  - LocalStorage is cleared on submission success
  - Better error handling - form returns to step 2 on submission failure
  - Fixed race condition where multiple users could register simultaneously

- **Performance optimizations for image compression**
  - Reduced max dimension from 1200px to 800px for faster processing
  - More aggressive compression (quality tiers: 0.6/0.4/0.2)
  - Added 30-second timeout protection with proper cleanup
  - Eliminates lag during form submission

## Previous Enhancements

### Admin Dashboard Improvements
- **Comprehensive Statistics Overview**: Total registrations across all games, total revenue from approved entries, pending approvals with animated indicators, approval rate percentage
- **QR Code Management**: Enhanced dialog with current QR preview, drag-and-drop upload zone, file validation and preview
- **Bulk Operations**: Approve all pending registrations, bulk export selected items to Excel, print-friendly view generation
- **Improved Registration Cards**: Avatar components with player initials, better visual separation, highlighted payment sections, relative timestamps (e.g., "2 hours ago")
- **Pagination**: 10 items per page with Previous/Next navigation, numbered page buttons, auto-reset on filter change, "Select All on Page" functionality

### Home Page Enhancements
- **5-Step "How It Works" Section**: Step-by-step instructions with numbered cards, icons, and staggered animations
- **FAQ Section**: Comprehensive Q&A using Accordion component covering registration, match details, disconnections, prizes, and refunds
- **Features Showcase**: 6 key benefits in responsive grid layout with icons and hover animations (Real-time Tracking, Instant Approval, Secure Payments, Fair Play, 24h Prizes, 24/7 Support)
- **Enhanced Hero Animations**: Staggered animations for stats, fade-in effects, subtle float animation for badges
- **Testimonials Section**: Social proof with player reviews, 5-star ratings, and avatar placeholders

### Registration Form Improvements
- **Multi-Step Progress Indicator**: Visual progress bar showing Team/Player Details → Payment → Review & Submit with dynamic completion percentage
- **Advanced File Upload**: 5MB size validation, file name and size display, "Change Image" and "Remove" buttons, automatic image compression for files >1MB
- **Helpful Hints & Tooltips**: Context-sensitive help text for WhatsApp and Transaction ID fields with info icons
- **Real-time Validation**: Instant feedback as user types, green checkmarks for valid fields, required field indicators
- **Form Auto-Save**: localStorage persistence with unique keys per game/tournament, automatic restoration on page refresh, unsaved changes warning

### Tournament Page Enhancements
- **Enhanced Hero Banners**: Multiple gradient overlays for text readability, 15 animated floating particles, larger game titles (text-8xl), animated trophy icons
- **Game-Specific Theming**: BGMI orange and Free Fire red colors applied consistently to borders, badges, highlights, icons, and progress indicators
- **Circular Slot Counter**: SVG-based progress indicator with percentage display, animated count transitions, color-coded status (green/yellow/red), urgency messaging
- **Live Countdown Timer**: Hours:minutes:seconds display in separate animated boxes, game-specific colors, updates every second
- **Enhanced Rules Accordion**: Unique icons for each section (Shield, CreditCard, Trophy, AlertCircle), color-coded backgrounds (blue/game-color/green/red), individual rule checkmarks

### Technical Improvements
- **Framer Motion Animations**: Smooth entrance animations, scroll-triggered effects, hover states, staggered transitions throughout the application
- **Complete Test Coverage**: All interactive elements have data-testid attributes for automated testing
- **Default QR Code**: Integrated payment QR code image from attached assets, automatically loaded on tournament initialization
- **React Hooks Compliance**: Fixed hooks ordering in AdminDashboard to eliminate console errors
- **Image Compression**: Client-side compression for payment screenshots before base64 encoding (adaptive quality based on file size)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tool:**
- React 18 with TypeScript
- Vite for development and production builds
- Wouter for client-side routing (lightweight alternative to React Router)

**UI Component System:**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component library (New York style variant)
- Tailwind CSS for styling with custom design tokens
- Class Variance Authority (CVA) for component variant management

**State Management:**
- TanStack Query (React Query) for server state management
- Auto-refetching enabled for real-time slot updates (5-second intervals on admin dashboard)
- Optimistic updates for better UX

**Form Handling:**
- React Hook Form for form state management
- Zod for schema validation
- @hookform/resolvers for integration between the two

**Design System:**
- Custom color palette with game-specific branding (BGMI orange, Free Fire red)
- Dark-mode-first approach with carefully tuned elevation layers
- Typography system using Inter, Geist Sans, and JetBrains Mono fonts
- Semantic color tokens for status indicators (success, warning, destructive)

### Backend Architecture

**Runtime & Framework:**
- Node.js with Express.js
- TypeScript with ESM modules
- Development mode uses tsx for hot reloading

**Session Management:**
- express-session with MemoryStore (in-memory storage)
- Session-based authentication for admin routes
- HTTP-only cookies with secure flag in production
- 24-hour session expiration

**Data Storage Pattern:**
- In-memory storage implementation (MemStorage class)
- Interface-based design (IStorage) for potential database migration
- Drizzle ORM schema definitions prepared for PostgreSQL migration
- Three main entities: Admins, Tournaments, Registrations

**API Design:**
- RESTful endpoints following resource-oriented patterns
- Middleware-based authentication for admin routes
- JSON request/response format
- Proper HTTP status codes and error handling

**Tournament Configuration:**
- Hardcoded tournament rules in shared schema
- BGMI: Solo (100 players), Duo (50 teams), Squad (25 teams)
- Free Fire: Solo (48 players), Duo (24 teams), Squad (12 teams)
- Entry fees and prize structure defined per mode

### Authentication & Authorization

**Admin Authentication:**
- bcrypt for password hashing
- **Default Admin Credentials:**
  - Username: `admin`
  - Password: `admin123`
  - *Note: For production use, change these credentials immediately after deployment*
- Session-based auth (no JWT to avoid token management complexity)
- Protected routes using requireAdmin middleware
- Default admin account initialized on startup

**Security Measures:**
- HTTP-only session cookies
- Secure cookies in production environment
- Password hashing with bcrypt (10 rounds)
- Session secret from environment variables

### File Upload & Storage

**Payment Screenshots:**
- Base64 encoding for image storage
- Images embedded directly in registration records
- No external file storage service required
- Client-side preview before submission

### Project Structure

```
client/                 # Frontend React application
  src/
    components/        # Reusable UI components
      ui/             # shadcn/ui components
    pages/            # Route-level page components
    hooks/            # Custom React hooks
    lib/              # Utility functions and clients
server/               # Backend Express application
  routes.ts           # API route definitions
  storage.ts          # Data storage implementation
  index.ts            # Server entry point
shared/               # Code shared between client and server
  schema.ts           # Drizzle schema and Zod validators
```

### Build & Deployment

**Development:**
- Vite dev server with HMR
- Concurrent client and server development
- Source maps for debugging

**Production Build:**
- Vite builds frontend to dist/public
- esbuild bundles backend to dist/index.js
- Static file serving from Express
- Designed for Vercel deployment

**Environment Variables:**
- DATABASE_URL: PostgreSQL connection (prepared but not yet used)
- SESSION_SECRET: Session encryption key
- NODE_ENV: Environment mode

## External Dependencies

### Core Dependencies

**Frontend Libraries:**
- @tanstack/react-query: Server state management and caching
- react-hook-form: Form state and validation
- @hookform/resolvers: Bridge between react-hook-form and Zod
- zod: Schema validation
- wouter: Lightweight routing
- date-fns: Date formatting utilities

**UI Component Libraries:**
- @radix-ui/*: 20+ accessible component primitives (dialog, dropdown, tabs, etc.)
- cmdk: Command palette component
- lucide-react: Icon library
- tailwindcss: Utility-first CSS framework
- class-variance-authority: Component variant utilities
- tailwind-merge & clsx: Class name utilities

**Backend Libraries:**
- express: Web application framework
- express-session: Session middleware
- memorystore: Memory-based session store
- bcryptjs: Password hashing
- drizzle-orm: TypeScript ORM (schema only, not actively used)
- @neondatabase/serverless: Neon Postgres driver (prepared for future use)

### Build Tools

- vite: Frontend build tool and dev server
- tsx: TypeScript executor for Node.js
- esbuild: JavaScript bundler for backend
- typescript: Type checking
- drizzle-kit: Database schema management CLI

### Replit-Specific

- @replit/vite-plugin-runtime-error-modal: Error overlay
- @replit/vite-plugin-cartographer: Development tools
- @replit/vite-plugin-dev-banner: Development banner

### Future Database Migration

The application is prepared for PostgreSQL migration:
- Drizzle ORM schema defined in shared/schema.ts
- drizzle.config.ts configured for PostgreSQL
- Storage interface (IStorage) abstracts data access
- Current implementation uses MemStorage (in-memory)
- Migration path: Implement IStorage with Drizzle queries

**Note:** While Drizzle schema uses PostgreSQL dialect, the current runtime uses in-memory storage. The database can be added later by implementing the IStorage interface with actual Drizzle ORM queries.