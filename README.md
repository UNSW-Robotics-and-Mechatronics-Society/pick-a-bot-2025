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
- [bun](https://bun.sh/docs/installation) (for running cron jobs and database migrations)
- [psql](https://www.postgresql.org/docs/current/app-psql.html) (PostgreSQL client for running migrations)
- [curl](https://curl.se/) (for testing local cron jobs)

> Check if you have the required tools installed

```bash
docker --version
node --version
bun --version
psql --version
curl --version
```

## Getting Started

### Local Database Setup

This local database setup ensures your app is fully functional offline, while mimicking your production Supabase project as closely as possible. Allows you to develop and test features without needing a live Supabase instance.

#### Docker Supabase Setup (`/docker`)

1. **Setup Your Environment Variables**

   From the `/docker` directory, copy `.env.example` -> `.env`:

   ```bash
   cp .env.example .env
   ```

   > Feel free to update any secrets for local development.

2. **Start Supabase Locally**

   Ensure Docker app is running, then in your project root:

   ```bash
    cd docker
    docker compose up -d # detached mode
   ```

   This may run for a few minutes. This starts:

   - PostgreSQL
   - Supabase Auth, API, Realtime
   - Supabase Studio Dashboard

   You can check the status of your containers with:

   ```bash
   docker compose ps
   ```

3. **Access Supabase Studio**

   Open: <http://localhost:8000>

   Login with your username and password set in `docker/.env` (default: `postgres`/`<your_password>`).

#### Database Setup (`/database`)

1. **Setup Your Environment Variables**

   From the `/database` directory, copy `.env.example` -> `.env`:

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your local environment variables:

   ```txt
   DATABASE_URL=postgres://postgres:<your_password>@localhost:54322/postgres
   # Replace <your_password> with the password you set in docker/.env
   ```

2. **Install Dependencies**

   In the `/database` directory, run:

   ```bash
   bun install
   ```

3. **Run Database Migrations**

   Right now, your local database is not in sync with the latest schema. From the project root, run:

   ```bash
   cd database
   # Applies the latest schema migrations using Drizzle ORM
   bun run db:push
   # Applies Supabase RLS policies and grants from supabase/policies.sql
   bun run db:apply-policies
   ```

   This applies the latest database schema using Drizzle ORM.

### Cloudflare Cron Service (`/cron`)

#### Run Cron Locally

1. **Install Dependencies**

   In the `/cron` directory, run:

   ```bash
   bun install
   ```

2. **Setup Environment Variables**

   Copy `.dev.vars.example` -> `.dev.vars`:

   ```bash
   cp .dev.vars.example .dev.vars
   ```

   Update the `.dev.vars` file with your local environment variables:

   ```txt
   ENVIRONMENT=local
   JOB_TRIGGER=local

   CHALLONGE_API_KEY=your-challonge-api-key
   # Get your Challonge API key from https://challonge.com/settings/account

   DEFAULT_SUPABASE_URL=http://localhost:8000
   SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
   # Check docker/.env for your service role key

   ADMIN_API_KEY=some-secret-key
   ```

   Your local service role key can be found in `docker/.env`.

3. **Run the Local Cron Worker**:

   ```bash
   bun dev
   ```

   This starts the local Cloudflare Worker emulation for cron jobs. You can view the local dashboard at <http://localhost:8787>.

4. **Open a new terminal and trigger it manually**:

   ```bash
   curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
   ```

   This simulates a cron job hitting your local Worker endpoint.

#### Configure Tournaments (Admin UI)

The live development admin dashboard to manage tournaments (e.g. update tournament_id, set cron frequency) is available at the [DEV Pick-a-Bots 2025 Cron Admin Dashboard](https://pick-a-bots-2025-cron-dev.ramsocunsw.workers.dev).

- Updates run every 5 minutes
- Designed to auto-sync tournament state with dev Supabase

> Note: The production admin dashboard will be available at a later date to save quota costs.

### Frontend (and Backend) Setup (`/frontend`)

1. **Install Dependencies**

   In the project root, run:

   ```bash
   cd frontend
   bun install
   ```

2. **Setup Environment Variables**

   Copy `.env.example` -> `.env` and update all secrets before using in production.

   Especially:

   ```txt
   # For local development
   DB_URL=http://localhost:8000
   DB_SECRET_KEY=your-local-anon-key
   ```

   Your local supabase anon key can be found in `docker/.env`.

3. **Run Development Server**

   ```bash
   bun dev
   ```

   This spins up the Next.js development server. Open [http://localhost:3000](http://localhost:3000) to view the app.
