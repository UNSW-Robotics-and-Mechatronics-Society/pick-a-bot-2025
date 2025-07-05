# Pick-a-Bots 2025

**Pick-a-Bots** is an interactive tournament prediction platform built for RAMSOC’s annual Sumo Bot competition.
Participants can place predictions on ongoing matches, earn points, and track results in real time.

This repo contains everything needed to power the platform - from the frontend UI to the backend database and automated match updates.

## Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) with [Tailwind CSS](https://tailwindcss.com/), [Chakra UI](https://chakra-ui.com/), and [TanStack Query](https://tanstack.com/query/latest).
- **Backend**: Uses Next.js API routes for server-side logic.
- **Cron Jobs**: [Cloudflare Workers](https://developers.cloudflare.com/workers/) for scheduled tasks.
- **Database**: [Supabase](https://supabase.com/) provides the database, authentication, and real-time features. The database schema is managed using [Drizzle ORM](https://orm.drizzle.team/) and supports local development via Docker.
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/) for hosting the frontend and backend. [Cloudflare Workers](https://developers.cloudflare.com/workers/) for cron jobs.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Node.js](https://nodejs.org/en/download/) (v18+ recommended)
- [pnpm](https://pnpm.io/installation) (for running cron jobs)
- [bun](https://bun.sh/docs/installation) (for running database migrations and development)

## Getting Started

### Frontend (and Backend) Setup

1. **Install Dependencies**

   In the project root, run:

   ```bash
   cd frontend
   npm run install
   ```

2. **Setup Environment Variables**

   Copy `.env.example` -> `.env` and update all secrets before using in production.

   Especially:

   ```txt
   # For local development
   DB_URL=http://localhost:8000
   DB_SECRET_KEY=your-own-anon-key
   ```

3. **Run Development Server**

   ```bash
   npm run dev
   ```

   This spins up the Next.js development server. Open [http://localhost:3000](http://localhost:3000) to view the app.

### Local Database Setup

This local database setup ensures your app is fully functional offline, while mimicking your production Supabase project as closely as possible. Allows you to develop and test features without needing a live Supabase instance.

1. **Update Your Environment Variables**

   Copy `.env.example` -> `.env` and update all secrets before using in production.

   Especially:

   ```txt
   POSTGRES_PASSWORD=your-own-password
   JWT_SECRET=your-own-long-secret-32+chars
   ANON_KEY=generate-your-own
   SERVICE_ROLE_KEY=generate-your-own
   ```

   Can generate your anon and service role keys here if you like:
   <https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys>

2. **Start Supabase Locally**

   Ensure Docker app is running, then in your project root:

   ```bash
    cd database/docker
    docker compose up -d
   ```

   This may run for a few minutes. This starts:

   - PostgreSQL
   - Supabase Auth, API, Realtime
   - Supabase Studio Dashboard

   You can check the status of your containers with:

   ```bash
   docker compose ps
   ```

3. **Run Database Migrations**

   Right now, your local database is not in sync with the latest schema. From the project root, run:

   ```bash
   cd database
   bun run db:push
   ```

   This applies the latest database schema using Drizzle ORM.

4. **Access Supabase Studio**

   Open: <http://localhost:8000>

   Login with:

   - Username: `supabase`
   - Password: `this_password_is_insecure_and_should_be_updated`

### Cloudflare Cron Service (Local & Live)

#### Run Cron Locally

1. Open a new terminal:

   ```bash
   cd cron
   pnpm install
   pnpm run dev
   ```

   This starts the local Cloudflare Worker emulation for cron jobs. You can view the local dashboard at <http://localhost:8787>.

2. Open a new terminal and trigger it manually:

   ```bash
   curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
   ```

   This simulates a cron job hitting your local Worker endpoint.

#### Configure Tournaments (Admin UI)

The live development admin dashboard to manage tournaments (e.g. update tournament_id, set cron frequency) is available at the [DEV Pick-a-Bots 2025 Cron Admin Dashboard](https://pick-a-bots-2025-cron-dev.ramsocunsw.workers.dev).

- Updates run every 5 minutes
- Designed to auto-sync tournament state with dev Supabase

> Note: The production admin dashboard will be available at a later date to save quota costs.
