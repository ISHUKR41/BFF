# BGMI & Free Fire Tournament Platform

## Overview

This is a professional tournament management platform for BGMI (Battlegrounds Mobile India) and Free Fire mobile games. The platform enables tournament organizers to manage registrations for different game modes (Solo, Duo, Squad) with real-time slot tracking, payment verification via QR codes, and an admin dashboard for managing participant approvals.

**Key Features:**
- Multi-game support (BGMI and Free Fire)
- Three tournament modes per game (Solo, Duo, Squad)
- Real-time slot availability tracking
- Payment submission with QR code and transaction verification
- Admin dashboard for registration approval/rejection
- Session-based authentication for admin access
- Professional, modern UI with dark mode design inspired by gaming platforms

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