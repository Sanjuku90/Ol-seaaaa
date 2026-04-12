# BlockMint - Cloud Mining Investment Platform

## Overview

BlockMint is a cloud crypto mining investment platform where users can purchase mining contracts (machines) with different deposit amounts, durations, and daily yield rates. Users deposit funds, select a mining machine tier, and receive daily rewards that can be reinvested or withdrawn. The platform includes user authentication, wallet management, contract tracking, and an affiliate/referral system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for page transitions and effects
- **Charts**: Recharts for financial data visualization
- **Theme**: Dark mode default with emerald green accents on slate/zinc backgrounds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Build Tool**: esbuild for server, Vite for client
- **Session Management**: express-session with connect-pg-simple for PostgreSQL session storage
- **Authentication**: Passport.js with Local Strategy (email/password)
- **Password Hashing**: Node.js crypto scrypt

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains all table definitions

### Database Schema
Four main tables:
1. **users**: id, email, password, role, balance, referralCode, referredBy, kycStatus, createdAt
2. **machines**: id, name, minDeposit, durationDays, dailyRate, maxDailyRate
3. **contracts**: id, userId, machineId, amount, startDate, endDate, status, autoReinvest, accumulatedRewards
4. **transactions**: id, userId, type, amount, status, walletAddress, createdAt

### API Structure
- Type-safe API routes defined in `shared/routes.ts` using Zod schemas
- RESTful endpoints under `/api/` prefix
- Auth endpoints: `/api/login`, `/api/register`, `/api/logout`, `/api/user`
- Resource endpoints: `/api/machines`, `/api/contracts`, `/api/transactions`

### Project Structure
```
├── client/          # React frontend
│   └── src/
│       ├── components/  # UI components (shadcn/ui)
│       ├── hooks/       # Custom React hooks
│       ├── pages/       # Route pages
│       └── lib/         # Utilities
├── server/          # Express backend
│   ├── auth.ts      # Passport authentication setup
│   ├── db.ts        # Database connection
│   ├── routes.ts    # API route handlers
│   └── storage.ts   # Data access layer
├── shared/          # Shared code between client/server
│   ├── schema.ts    # Drizzle database schema
│   └── routes.ts    # API route definitions with Zod
└── migrations/      # Drizzle database migrations
```

### Key Design Decisions
1. **Monorepo structure** with shared types between frontend and backend
2. **Path aliases**: `@/` for client src, `@shared/` for shared code
3. **Protected routes** handled client-side with auth state from `/api/user` endpoint
4. **Decimal precision** for financial amounts (10,2 scale in database)
5. **Session-based auth** with PostgreSQL session store for persistence

## External Dependencies

### Database
- **PostgreSQL**: Primary database (connection via `DATABASE_URL` environment variable)
- **connect-pg-simple**: Session storage in PostgreSQL

### Frontend Libraries
- **@tanstack/react-query**: Async state management
- **shadcn/ui**: Component library built on Radix UI primitives
- **framer-motion**: Animation library
- **recharts**: Chart library for dashboards
- **wouter**: Client-side routing

### Backend Libraries
- **passport / passport-local**: Authentication
- **drizzle-orm**: Database ORM
- **zod**: Runtime type validation
- **express-session**: Session management

### Development Tools
- **Vite**: Frontend dev server and bundler
- **esbuild**: Server bundler for production
- **drizzle-kit**: Database migration tool (`npm run db:push`)

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption (required in production; development uses a local fallback)
- `EMAIL_USER`: SMTP username for outgoing BlockMint emails (optional; email sending is skipped when absent)
- `EMAIL_PASS`: SMTP password/app password for outgoing BlockMint emails (optional; email sending is skipped when absent)

## Recent Changes

### Replit Migration
- Configured the app to run as a Replit web app on port 5000 through the existing Express server.
- Moved outgoing email credentials out of source code and into environment variables.
- Updated Vite HMR settings for Replit's proxied preview environment.

### Admin Access and Plan Rates
- Increased the default daily earning rates for all mining plans by 10 percentage points.
- Admin users now redirect directly to the admin panel after login and admin API routes require an authenticated admin user.