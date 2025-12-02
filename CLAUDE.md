# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pick-a-Bots is an interactive tournament prediction platform for RAMSOC's annual Sumo Bot competition. The system enables real-time match predictions, token-based betting, and live leaderboard tracking.

**Architecture**: Monorepo with three main components:
- **Frontend** (`/frontend`): Next.js 15 app with Chakra UI and TanStack Query
- **Database** (`/database`): Drizzle ORM schema management for Supabase PostgreSQL
- **Cron** (`/cron`): Cloudflare Worker for automated match updates via Challonge API

## Development Setup

### 1. Local Database (Supabase via Docker)

```bash
# Start local Supabase instance
cd docker
docker compose up -d

# Access Supabase Studio at http://localhost:8000
# Default credentials: postgres/<password from docker/.env>
```

### 2. Database Migrations

```bash
cd database
bun install

# Apply Drizzle schema changes
bun run db:push

# Apply Supabase RLS policies and realtime configuration
bun run db:apply-policies

# Generate new migration files (after schema changes)
bun run db:generate
```

**Important**: After modifying database schema in `/database/src/db/schema/`, always run both `db:push` and `db:apply-policies`.

### 3. Frontend Development

```bash
cd frontend
bun install
bun dev  # Starts on http://localhost:3000

# Build and preview (Cloudflare Pages deployment)
bun run preview

# Deployment
bun run deploy  # Uses opennextjs-cloudflare adapter
```

### 4. Cron Jobs (Local Testing)

```bash
cd cron
bun install
bun dev  # Starts local worker at http://localhost:8787

# In another terminal, trigger scheduled job:
curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

## Code Architecture

### Frontend Structure (`/frontend/src`)

- **`/app`**: Next.js App Router pages and API routes
  - `/api/*`: Backend API endpoints (vote, join, leaderboard, user operations)
  - `/dashboard`, `/bracket`, `/vote-history`: Main user-facing pages
  - `middleware.ts`: Supabase auth session management (protects all routes except `/`, `/join`, and public assets)

- **`/components`**: Reusable UI components (Chakra UI + custom)

- **`/hooks`**: React hooks for data fetching
  - `useCurrentMatch.ts`: Real-time match subscription via Supabase Realtime
  - `useUserProfile.ts`: User authentication and token balance

- **`/services`**: API client functions
  - `auth.ts`: User authentication and session management
  - `vote.ts`: Vote submission and validation
  - `profile.ts`: User profile and token operations

- **`/lib`**: Utilities and configuration
  - `/supabase`: Supabase client initialization (browser, server, middleware)
  - `theme.ts`: Chakra UI theme configuration

- **`/schemas`**: Yup validation schemas for forms and API requests

### Database Schema (`/database/src/db/schema`)

Core tables (all use Drizzle ORM):
- **`user`**: User profiles, zID, tokens, created_at
- **`match`**: Tournament matches from Challonge (match_id, participant IDs, winner, state)
- **`current_match`**: Singleton table tracking active match for voting
- **`vote`**: User vote records (user_id, match_id, predicted_winner_id)
- **`token_transaction`**: Audit log of all token changes (type: 'initial_grant', 'vote_win', 'vote_loss')
- **`cron_log`**: Scheduled job execution history

**RLS Policies** (`/database/src/supabase/policies.sql`):
- Public read access to `match` and `current_match`
- Users can only read their own `user` and `vote` records
- Users can only create votes for themselves
- Supabase Realtime enabled for `match` and `current_match` tables

### Cron Service (`/cron/src`)

- **`index.ts`**: Cloudflare Worker entry point, delegates to `matchProcessorHandler`
- **`/cron-handlers/match-processor.ts`**: Main scheduled job logic
- **`/services/match.ts`**: Core match processing and vote resolution
- **`/services/challonge`**: Challonge API client for fetching tournament data
- **`/services/supabase`**: Database operations (match updates, vote resolution, token transfers)
- **`/routes`**: Admin API routes for tournament configuration (Hono framework)

**Match Processing Flow**:
1. Fetch latest tournament state from Challonge API
2. Sync matches to `match` table
3. Detect completed matches and resolve votes (award/deduct tokens)
4. Update `current_match` to next pending match
5. Log execution to `cron_log`

## Common Development Commands

### Database
```bash
cd database
bun run db:push              # Apply schema changes
bun run db:apply-policies    # Apply RLS policies
bun run db:generate          # Generate migration files
bun run db:migrate           # Run migrations
bun run db:drop              # Drop migration
```

### Frontend
```bash
cd frontend
bun dev                      # Development server
bun run build                # Production build
bun run lint                 # ESLint
bun run preview              # Preview production build locally
bun run deploy               # Deploy to Cloudflare Pages
```

### Cron
```bash
cd cron
bun dev                      # Local worker (port 8787)
bun run deploy               # Deploy to Cloudflare Workers
bun run cf-typegen           # Generate Cloudflare env types
```

### Docker (Supabase)
```bash
cd docker
docker compose up -d         # Start services
docker compose down          # Stop services
docker compose ps            # Check status
```

## Key Technical Details

### Authentication Flow
- Uses Supabase Auth with zID-based user identification
- Middleware (`/frontend/src/middleware.ts`) protects all routes except public endpoints
- Session managed via cookies (`@supabase/ssr`)

### Real-time Updates
- Frontend subscribes to `current_match` changes via Supabase Realtime
- Automatically updates UI when cron job advances to next match
- See `useCurrentMatch.ts` for implementation

### Token Economics
- Users start with initial token grant (configurable)
- Winning votes earn tokens, losing votes deduct tokens
- All transactions logged in `token_transaction` table
- Token balance calculated via aggregation of transactions

### Deployment
- **Frontend**: Cloudflare Pages via `@opennextjs/cloudflare` adapter
- **Cron**: Cloudflare Workers with scheduled triggers
- **Database**: Hosted Supabase (production) or local Docker (development)

## Testing Notes

When testing locally:
1. Ensure Docker Supabase is running (`docker compose ps`)
2. Verify database schema is up-to-date (`bun run db:push` in `/database`)
3. Check environment variables are correctly configured (`.env`, `.dev.vars`)
4. Use curl to manually trigger cron jobs for debugging
5. Monitor Supabase Studio (http://localhost:8000) for real-time data changes

## Conventions

- **Commit messages**: Follow conventional changelog format (feat:, fix:, refactor:, etc.)
- **PR requirements**: Must include screenshots for UI changes, test locally with `bun run preview`
- **Package manager**: Use `bun` for all operations (not npm/yarn/pnpm)
- **TypeScript**: Strict mode enabled across all packages
