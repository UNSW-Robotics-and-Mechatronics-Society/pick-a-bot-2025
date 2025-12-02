# Migration Guide: Current Architecture → AWS

**Document Version**: 1.0
**Last Updated**: December 2, 2025
**Timeline**: 6 months (24 weeks)
**Target Outcome**: Production-ready AWS deployment handling 400+ concurrent users

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Phase 1: Foundation (Weeks 1-4)](#phase-1-foundation-weeks-1-4)
4. [Phase 2: Core Backend (Weeks 5-8)](#phase-2-core-backend-weeks-5-8)
5. [Phase 3: Cron Jobs (Weeks 9-10)](#phase-3-cron-jobs-weeks-9-10)
6. [Phase 4: Frontend (Weeks 11-14)](#phase-4-frontend-weeks-11-14)
7. [Phase 5: Testing & CI/CD (Weeks 15-18)](#phase-5-testing--cicd-weeks-15-18)
8. [Phase 6: Polish & Launch (Weeks 19-24)](#phase-6-polish--launch-weeks-19-24)
9. [Rollback Procedures](#rollback-procedures)
10. [Risk Mitigation](#risk-mitigation)

---

## Overview

### Migration Strategy

**Approach**: Phased migration with parallel systems

**Key Principles**:
1. **Zero Downtime**: Current system stays live during migration
2. **Incremental Validation**: Test each component before moving to next
3. **Rollback Ready**: Can revert to current system at any point
4. **Data Safety**: No data loss during migration
5. **User Transparency**: Users won't notice the migration

### Migration Path

```
Current State                    Intermediate                  Target State
(Week 0)                        (Weeks 1-23)                  (Week 24)

┌─────────────┐                ┌─────────────┐               ┌─────────────┐
│ Cloudflare  │                │ Cloudflare  │               │             │
│   Pages     │────┐           │   Pages     │────┐          │             │
│  (Frontend) │    │           │  (Frontend) │    │          │             │
└─────────────┘    │           └─────────────┘    │          │             │
                   │                                │          │             │
┌─────────────┐    │           ┌─────────────┐    │          │             │
│ Cloudflare  │    │           │ Cloudflare  │    │          │             │
│  Workers    │────┼──►        │  Workers    │────┼──►       │             │
│   (Cron)    │    │           │   (Cron)    │    │          │             │
└─────────────┘    │           └─────────────┘    │          │             │
                   │                  +            │          │             │
┌─────────────┐    │           ┌─────────────┐    │          │   AWS       │
│  Supabase   │────┘           │  AWS (Test) │    │          │  (Prod)     │
│ (Database)  │                │  - RDS      │────┘          │  - Amplify  │
└─────────────┘                │  - Lambda   │               │  - RDS      │
                               │  - Amplify  │               │  - Lambda   │
                               └─────────────┘               │             │
                                                              │             │
                               Data synced in real-time ──►   └─────────────┘
                               during migration period
```

### Success Criteria

- [ ] All critical security issues fixed
- [ ] 400 concurrent users supported
- [ ] <200ms API response time (p95)
- [ ] 99.5% uptime
- [ ] Zero data loss during migration
- [ ] All features from current system working
- [ ] Cost within $50-100/month budget
- [ ] Automated deployment pipeline
- [ ] 80%+ test coverage

---

## Pre-Migration Checklist

Complete these **before** starting Week 1:

### Week -1: Preparation

**Documentation Review** (2 hours):
- [ ] Read FUTURE-PLANS.md completely
- [ ] Read AWS-ARCHITECTURE.md completely
- [ ] Read SECURITY-AUDIT.md completely
- [ ] Read IMPROVEMENTS-AND-RECOMMENDATIONS.md completely

**Current System Audit** (4 hours):
- [ ] Document all API endpoints and their behavior
- [ ] Export database schema (`pg_dump --schema-only`)
- [ ] List all environment variables in use
- [ ] Document cron job frequency and logic
- [ ] Take screenshots of current UI
- [ ] Record current user count and usage patterns

**Team Preparation** (2 hours):
- [ ] Assign roles (lead developer, tester, DevOps)
- [ ] Setup weekly sync meetings (Mondays, 1 hour)
- [ ] Create Slack/Discord channel for migration
- [ ] Setup shared task board (Trello/Jira/GitHub Projects)

**AWS Account Setup** (3 hours):
- [ ] Create AWS account
- [ ] Enable MFA on root account
- [ ] Create IAM admin user with MFA
- [ ] Configure AWS CLI
- [ ] Set up billing alerts ($50, $75, $100)
- [ ] Review AWS free tier limits

**Backup Strategy** (2 hours):
- [ ] Take full database backup
- [ ] Store backup in S3 or secure location
- [ ] Test restore procedure
- [ ] Document rollback steps
- [ ] Create snapshot of current system config

**Total Prep Time**: ~13 hours

---

## Phase 1: Foundation (Weeks 1-4)

**Goal**: AWS infrastructure setup and database migration
**Risk Level**: 🟢 LOW (no impact on production)

### Week 1: AWS Foundation

**Day 1-2: RDS Setup** (8 hours)

Tasks:
- [ ] Create VPC and security groups
- [ ] Provision RDS PostgreSQL instance (db.t3.micro for testing)
- [ ] Configure automated backups
- [ ] Enable encryption at rest
- [ ] Test database connection from local machine

Verification:
```bash
# Test connection
psql -h your-rds-endpoint.rds.amazonaws.com -U postgres -d pickabots

# Run simple query
psql "$RDS_URL" -c "SELECT version();"
```

**Day 3-4: Secrets Manager** (6 hours)

Tasks:
- [ ] Create secrets for database credentials
- [ ] Create secrets for API keys (Challonge, JWT)
- [ ] Create secret for access code (generate new strong one)
- [ ] Create secret for webhook verification
- [ ] Test secret retrieval via AWS CLI
- [ ] Document secret names and usage

Verification:
```bash
# Retrieve secrets
aws secretsmanager get-secret-value \
  --secret-id pick-a-bots/database-url \
  --query SecretString \
  --output text
```

**Day 5: IAM Roles** (4 hours)

Tasks:
- [ ] Create Lambda execution role
- [ ] Attach policies (CloudWatch, Secrets Manager, RDS)
- [ ] Create Amplify service role
- [ ] Test role assumptions

**Deliverable**: AWS infrastructure ready for database migration

---

### Week 2: Database Schema Migration

**Day 1-2: Schema Export and Modification** (10 hours)

Tasks:
- [ ] Export current database schema from Supabase
  ```bash
  pg_dump "$SUPABASE_URL" --schema-only > schema.sql
  ```
- [ ] Review schema for AWS RDS compatibility
- [ ] Update Drizzle config to point to RDS test instance
- [ ] Apply schema using Drizzle
  ```bash
  cd database
  DATABASE_URL=$RDS_TEST_URL bun run db:push
  ```
- [ ] Apply RLS policies
  ```bash
  DATABASE_URL=$RDS_TEST_URL bun run db:apply-policies
  ```
- [ ] Add missing indexes (see IMPROVEMENTS-AND-RECOMMENDATIONS.md PERF-02)

Verification:
```sql
-- Verify tables created
\dt

-- Verify RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('user', 'vote', 'match', 'current_match');

-- Verify indexes
\di
```

**Day 3-4: Test Data Migration** (10 hours)

Tasks:
- [ ] Export test data from Supabase (10-20 users, few matches)
  ```bash
  pg_dump "$SUPABASE_URL" \
    --data-only \
    --table=user \
    --table=match \
    --table=vote > test_data.sql
  ```
- [ ] Import to RDS
  ```bash
  psql "$RDS_TEST_URL" < test_data.sql
  ```
- [ ] Verify data integrity
  ```sql
  -- Count records
  SELECT
    (SELECT COUNT(*) FROM "user") as users,
    (SELECT COUNT(*) FROM "match") as matches,
    (SELECT COUNT(*) FROM "vote") as votes;

  -- Verify foreign keys
  SELECT * FROM vote v
  LEFT JOIN "user" u ON v.user_id = u.id
  WHERE u.id IS NULL;  -- Should be empty
  ```
- [ ] Test queries
- [ ] Compare performance (Supabase vs RDS)

**Day 5: Documentation** (4 hours)

Tasks:
- [ ] Document RDS connection details
- [ ] Document backup/restore procedure
- [ ] Update README with RDS setup instructions
- [ ] Create runbook for database operations

**Deliverable**: Database schema migrated to AWS RDS, tested with sample data

---

### Week 3: Full Data Migration (Read-Only)

**Day 1-2: Migration Script** (12 hours)

Create `scripts/migrate-to-rds.ts`:

```typescript
// scripts/migrate-to-rds.ts
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const rds = postgres(process.env.RDS_URL!);

async function migrateData() {
  console.log('Starting migration...');

  // 1. Migrate users
  const { data: users } = await supabase.from('user').select('*');
  console.log(`Migrating ${users.length} users...`);

  for (const user of users) {
    await rds`
      INSERT INTO "user" (id, email, name, zid, tokens, created_at)
      VALUES (
        ${user.id},
        ${user.email},
        ${user.name},
        ${user.zid},
        ${user.tokens},
        ${user.created_at}
      )
      ON CONFLICT (id) DO UPDATE SET
        tokens = EXCLUDED.tokens
    `;
  }

  // 2. Migrate matches
  const { data: matches } = await supabase.from('match').select('*');
  console.log(`Migrating ${matches.length} matches...`);

  for (const match of matches) {
    await rds`
      INSERT INTO "match" (id, tournament_id, bot1, bot2, state, winner, created_at)
      VALUES (
        ${match.id},
        ${match.tournament_id},
        ${match.bot1},
        ${match.bot2},
        ${match.state},
        ${match.winner},
        ${match.created_at}
      )
      ON CONFLICT (id) DO UPDATE SET
        state = EXCLUDED.state,
        winner = EXCLUDED.winner
    `;
  }

  // 3. Migrate votes
  const { data: votes } = await supabase.from('vote').select('*');
  console.log(`Migrating ${votes.length} votes...`);

  for (const vote of votes) {
    await rds`
      INSERT INTO "vote" (id, user_id, match_id, bot_chosen, used_tokens, created_at)
      VALUES (
        ${vote.id},
        ${vote.user_id},
        ${vote.match_id},
        ${vote.bot_chosen},
        ${vote.used_tokens},
        ${vote.created_at}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  // 4. Migrate token transactions
  const { data: transactions } = await supabase.from('token_transaction').select('*');
  console.log(`Migrating ${transactions.length} transactions...`);

  for (const txn of transactions) {
    await rds`
      INSERT INTO "token_transaction" (
        id, user_id, match_id, type, amount, balance_before, balance_after, created_at
      ) VALUES (
        ${txn.id}, ${txn.user_id}, ${txn.match_id}, ${txn.type},
        ${txn.amount}, ${txn.balance_before}, ${txn.balance_after}, ${txn.created_at}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  console.log('Migration complete!');
}

migrateData().catch(console.error);
```

Tasks:
- [ ] Write migration script
- [ ] Test with small dataset (10 users)
- [ ] Run full migration (read-only, no write operations yet)
- [ ] Verify data integrity

**Day 3-4: Continuous Sync Setup** (12 hours)

Setup real-time sync from Supabase → RDS during migration period:

```typescript
// scripts/sync-supabase-to-rds.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(/*...*/);

// Listen to changes
supabase
  .channel('db-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'user' }, handleUserChange)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'match' }, handleMatchChange)
  .subscribe();

async function handleUserChange(payload: any) {
  console.log('User changed:', payload);
  // Sync to RDS
  await syncUserToRDS(payload.new);
}
```

Tasks:
- [ ] Implement sync script
- [ ] Run sync in background
- [ ] Monitor for errors
- [ ] Verify changes propagate

**Day 5: Verification** (4 hours)

Tasks:
- [ ] Compare record counts (Supabase vs RDS)
- [ ] Verify data consistency
- [ ] Check foreign key integrity
- [ ] Performance benchmarks (query speed)

**Deliverable**: Full database migrated to RDS, continuously syncing

---

### Week 4: Database Migration Validation

**Day 1-3: Integration Testing** (18 hours)

Tasks:
- [ ] Test all queries against RDS
- [ ] Verify RLS policies work correctly
- [ ] Test concurrent connections (simulate 100 users)
- [ ] Load testing (400 concurrent queries)
- [ ] Verify backup/restore works
- [ ] Test failover procedures

**Day 4-5: Performance Tuning** (12 hours)

Tasks:
- [ ] Add missing indexes (see PERF-02)
- [ ] Optimize slow queries (use EXPLAIN ANALYZE)
- [ ] Configure connection pooling
- [ ] Set up pgBouncer if needed
- [ ] Monitor query performance with CloudWatch

**Deliverable**: Production-ready RDS database, validated and optimized

---

## Phase 2: Core Backend (Weeks 5-8)

**Goal**: Rebuild API routes with proper security
**Risk Level**: 🟡 MEDIUM (parallel to production system)

### Week 5: Authentication System

**Day 1-2: Fix Critical Security Issues** (12 hours)

Tasks:
- [ ] Rotate all secrets (see SECURITY-AUDIT.md VULN-01)
- [ ] Remove secrets from wrangler.toml
- [ ] Move secrets to Secrets Manager
- [ ] Generate strong webhook secret (32 bytes)
- [ ] Generate strong JWT secret (32 bytes)
- [ ] Update environment variables

**Day 3-5: Implement Per-User Authentication** (18 hours)

Tasks:
- [ ] Add `password_hash` column to user table
- [ ] Install bcrypt library
- [ ] Implement password hashing (see VULN-02 fix)
- [ ] Update registration endpoint (`/api/join`)
  ```typescript
  // Hash individual passwords, verify access code separately
  const passwordHash = await hash(params.password, 10);
  ```
- [ ] Update login endpoint
- [ ] Implement JWT token generation
- [ ] Add JWT verification middleware
- [ ] Test with multiple users
- [ ] Migrate existing users (set temporary passwords)

Verification:
```bash
# Test registration with individual password
curl -X POST http://localhost:3000/api/join \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "displayName": "Test User",
    "zid": "z1234567",
    "accessCode": "NEW_ACCESS_CODE_HERE"
  }'

# Verify passwords are different
psql "$RDS_URL" -c "SELECT email, password_hash FROM \"user\" LIMIT 5;"
```

**Deliverable**: Secure per-user authentication implemented

---

### Week 6: Webhook Security

**Day 1-3: Implement HMAC Verification** (18 hours)

Tasks:
- [ ] Install crypto libraries
- [ ] Implement HMAC signature verification (see VULN-03 fix)
- [ ] Add timestamp validation (prevent replay attacks)
- [ ] Implement idempotency tracking (Redis or in-memory)
- [ ] Update `/api/user/update-tokens` route
- [ ] Configure Supabase webhook with new headers
- [ ] Test valid/invalid signatures
- [ ] Test replay attack prevention

**Day 4-5: Testing & Documentation** (12 hours)

Tasks:
- [ ] Write unit tests for webhook verification
- [ ] Test with production-like payloads
- [ ] Document webhook configuration
- [ ] Create monitoring alerts for failed webhooks

**Deliverable**: Secure webhook authentication with HMAC

---

### Week 7: Rate Limiting

**Day 1-2: Setup Upstash Redis** (12 hours)

Tasks:
- [ ] Create Upstash account
- [ ] Create Redis database
- [ ] Install `@upstash/ratelimit` and `@upstash/redis`
- [ ] Configure connection
- [ ] Test basic rate limiting

**Day 3-5: Implement Rate Limits** (18 hours)

Tasks:
- [ ] Add rate limiting to `/api/vote` (10 req/min)
- [ ] Add rate limiting to `/api/join` (3 req/hour)
- [ ] Add rate limiting to `/api/leaderboard` (60 req/min)
- [ ] Add rate limiting to `/api/user/*` (30 req/min)
- [ ] Test rate limit thresholds
- [ ] Add proper error responses (429 with Retry-After header)
- [ ] Monitor rate limit violations

Verification:
```bash
# Test rate limiting
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/vote \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"matchId":"..."}' &
done
# Should see 429 errors after 10 requests
```

**Deliverable**: Rate limiting on all endpoints

---

### Week 8: API Routes Refactoring

**Day 1-3: Refactor Vote Endpoint** (18 hours)

Tasks:
- [ ] Fix race conditions in token updates (see HIGH-04 fix)
- [ ] Use database-level atomic operations
- [ ] Add input validation (see HIGH-01 fix)
- [ ] Prevent negative token balances
- [ ] Add proper error handling
- [ ] Write unit tests

**Day 4-5: Refactor Other Endpoints** (12 hours)

Tasks:
- [ ] Refactor `/api/leaderboard` (fix null pointer, add caching)
- [ ] Refactor `/api/join` (with new auth)
- [ ] Refactor `/api/user/vote-history` (add pagination)
- [ ] Add consistent error handling (see MEDIUM-05 fix)
- [ ] Update all endpoints to use RDS

**Deliverable**: All API routes secure and refactored

---

## Phase 3: Cron Jobs (Weeks 9-10)

**Goal**: Migrate match processor to Lambda
**Risk Level**: 🟡 MEDIUM (parallel to production)

### Week 9: Lambda Function Development

**Day 1-2: Lambda Setup** (12 hours)

Tasks:
- [ ] Create Lambda function in AWS
- [ ] Configure IAM role
- [ ] Setup VPC access to RDS
- [ ] Install dependencies
- [ ] Build deployment package

**Day 3-5: Port Match Processor** (18 hours)

Tasks:
- [ ] Port Challonge API client code
- [ ] Fix race conditions in current_match updates (see HIGH-03 fix)
- [ ] Implement atomic database operations
- [ ] Use transactions for vote resolution
- [ ] Add CloudWatch logging
- [ ] Test locally

**Deliverable**: Lambda function ready for deployment

---

### Week 10: Lambda Deployment & Testing

**Day 1-2: Deploy and Configure** (12 hours)

Tasks:
- [ ] Deploy Lambda function
- [ ] Create EventBridge rule (rate(2 minutes))
- [ ] Configure dead letter queue (DLQ)
- [ ] Setup CloudWatch alarms
- [ ] Test manual invocation

**Day 3-5: Parallel Testing** (18 hours)

Tasks:
- [ ] Run Lambda alongside current Cloudflare Worker
- [ ] Compare outputs (logs, database changes)
- [ ] Verify both systems produce same results
- [ ] Monitor for errors
- [ ] Fix any discrepancies

**Deliverable**: Lambda function deployed and validated in parallel

---

## Phase 4: Frontend (Weeks 11-14)

**Goal**: Migrate frontend to AWS Amplify
**Risk Level**: 🟠 HIGH (user-facing changes)

### Week 11: Amplify Setup

**Day 1-3: Initialize Amplify** (18 hours)

Tasks:
- [ ] Install Amplify CLI
- [ ] Initialize Amplify project
- [ ] Connect GitHub repository
- [ ] Configure build settings
- [ ] Add environment variables
- [ ] Test deployment

**Day 4-5: Update API Clients** (12 hours)

Tasks:
- [ ] Update API base URLs
- [ ] Update authentication flow (use JWT tokens)
- [ ] Test API calls from frontend
- [ ] Update error handling

**Deliverable**: Frontend deployed on Amplify (test environment)

---

### Week 12: Frontend Refactoring

**Day 1-3: Fix React Hooks** (18 hours)

Tasks:
- [ ] Fix memory leak in `useCurrentMatch` (see HIGH-05 fix)
- [ ] Stabilize callbacks with useRef
- [ ] Remove unnecessary dependencies
- [ ] Add error boundaries (see BUG-02 fix)
- [ ] Test subscription cleanup

**Day 4-5: Update Real-Time** (12 hours)

Tasks:
- [ ] Replace Supabase Realtime with polling (or AWS AppSync)
- [ ] Implement polling every 30 seconds
- [ ] Add optimistic UI updates
- [ ] Test real-time match updates

**Deliverable**: Frontend refactored and working with AWS backend

---

### Week 13: UI Improvements

**Day 1-3: Loading States** (18 hours)

Tasks:
- [ ] Add skeleton loaders
- [ ] Improve error messages
- [ ] Add toast notifications
- [ ] Better loading indicators
- [ ] Optimistic vote updates

**Day 4-5: Bundle Optimization** (12 hours)

Tasks:
- [ ] Remove React Query Devtools from production (see PERF-04)
- [ ] Move bad-words validation to server
- [ ] Dynamic imports for heavy components
- [ ] Optimize images
- [ ] Analyze bundle size

**Deliverable**: Improved UX and smaller bundle

---

### Week 14: Frontend Testing & Migration

**Day 1-3: End-to-End Testing** (18 hours)

Tasks:
- [ ] Install Playwright
- [ ] Write critical flow tests (register, vote, view history)
- [ ] Test on multiple browsers
- [ ] Test mobile responsiveness
- [ ] Fix any issues

**Day 4-5: Soft Launch** (12 hours)

Tasks:
- [ ] Deploy to production Amplify environment
- [ ] Test with 10-20 beta users
- [ ] Monitor errors
- [ ] Gather feedback
- [ ] Fix critical issues

**Deliverable**: Frontend fully migrated, tested with users

---

## Phase 5: Testing & CI/CD (Weeks 15-18)

**Goal**: Automated testing and deployment
**Risk Level**: 🟢 LOW (infrastructure)

### Week 15: Unit Testing

**Day 1-5: Write Tests** (30 hours)

Tasks:
- [ ] Install Vitest
- [ ] Configure test environment
- [ ] Write API endpoint tests (vote, join, leaderboard)
- [ ] Write service tests (auth, vote, match processor)
- [ ] Write utility tests
- [ ] Achieve 80%+ code coverage

**Deliverable**: Comprehensive unit test suite

---

### Week 16: Integration Testing

**Day 1-5: E2E Tests** (30 hours)

Tasks:
- [ ] Install Playwright
- [ ] Write user journey tests
  - Registration flow
  - Login flow
  - Vote submission
  - Leaderboard viewing
  - Vote history viewing
- [ ] Test error scenarios
- [ ] Test with different user roles
- [ ] Run tests in CI

**Deliverable**: E2E test suite covering all critical flows

---

### Week 17: CI/CD Pipeline

**Day 1-3: GitHub Actions** (18 hours)

Tasks:
- [ ] Create `.github/workflows/test.yml`
- [ ] Run tests on PR
- [ ] Run linting
- [ ] Type checking
- [ ] Security scanning (npm audit, Semgrep)

**Day 4-5: Deployment Pipeline** (12 hours)

Tasks:
- [ ] Create `.github/workflows/deploy.yml`
- [ ] Deploy database migrations
- [ ] Deploy Lambda function
- [ ] Deploy frontend (Amplify)
- [ ] Add smoke tests after deployment

**Deliverable**: Fully automated CI/CD pipeline

---

### Week 18: Monitoring Setup

**Day 1-3: CloudWatch Dashboards** (18 hours)

Tasks:
- [ ] Create CloudWatch dashboard
- [ ] Add Lambda metrics (invocations, errors, duration)
- [ ] Add RDS metrics (connections, CPU, queries)
- [ ] Add Amplify metrics (requests, latency)
- [ ] Add custom metrics (vote count, user count)

**Day 4-5: Alerts** (12 hours)

Tasks:
- [ ] Setup SNS topic for alerts
- [ ] Create alarms for Lambda errors
- [ ] Create alarms for RDS high CPU
- [ ] Create alarms for high latency
- [ ] Test alert delivery

**Deliverable**: Comprehensive monitoring and alerting

---

## Phase 6: Polish & Launch (Weeks 19-24)

**Goal**: Production readiness and launch
**Risk Level**: 🟠 HIGH (production cutover)

### Week 19: Email Notifications

**Day 1-3: Amazon SES Setup** (18 hours)

Tasks:
- [ ] Setup Amazon SES
- [ ] Verify domain
- [ ] Create email templates (match starting, vote confirmed, results)
- [ ] Implement email sending service
- [ ] Test email delivery

**Day 4-5: Integration** (12 hours)

Tasks:
- [ ] Send emails on match start (5 min before voting closes)
- [ ] Send emails on vote confirmation
- [ ] Send emails on match results
- [ ] Add unsubscribe functionality

**Deliverable**: Email notification system

---

### Week 20: Admin Dashboard

**Day 1-5: Build Dashboard** (30 hours)

Tasks:
- [ ] Create admin page (`/admin`)
- [ ] Add authentication (admin role)
- [ ] View system health metrics
- [ ] Manually trigger match processor
- [ ] View audit logs
- [ ] Manage user tokens (grant/deduct)
- [ ] Pause/resume tournament

**Deliverable**: Functional admin dashboard

---

### Week 21: Performance Optimization

**Day 1-3: Database Optimization** (18 hours)

Tasks:
- [ ] Analyze slow queries (CloudWatch Insights)
- [ ] Add missing indexes
- [ ] Optimize leaderboard query (materialized view)
- [ ] Setup query caching
- [ ] Add connection pooling

**Day 4-5: API Optimization** (12 hours)

Tasks:
- [ ] Add HTTP caching headers
- [ ] Implement response caching
- [ ] Optimize Lambda cold starts
- [ ] Add CloudFront CDN (optional)

**Deliverable**: Optimized performance (<200ms API response)

---

### Week 22: Load Testing

**Day 1-3: Setup Load Tests** (18 hours)

Tasks:
- [ ] Install k6 or Artillery
- [ ] Write load test scenarios
  - 400 concurrent users browsing
  - 100 users voting simultaneously
  - Leaderboard queries
- [ ] Run tests against staging
- [ ] Identify bottlenecks

**Day 4-5: Fix Performance Issues** (12 hours)

Tasks:
- [ ] Fix any bottlenecks found
- [ ] Scale RDS if needed (db.t3.small → db.t3.medium)
- [ ] Increase Lambda memory if needed
- [ ] Re-run load tests
- [ ] Verify 400 concurrent users supported

**Deliverable**: System validated for 400+ users

---

### Week 23: Security Audit & Fixes

**Day 1-3: Final Security Review** (18 hours)

Tasks:
- [ ] Review all security fixes from SECURITY-AUDIT.md
- [ ] Run OWASP ZAP security scan
- [ ] Test for SQL injection
- [ ] Test for XSS
- [ ] Test authentication bypass attempts
- [ ] Test rate limiting

**Day 4-5: Penetration Testing** (12 hours)

Tasks:
- [ ] Hire penetration tester (or use internal team)
- [ ] Run penetration tests
- [ ] Fix any issues found
- [ ] Re-test
- [ ] Document security posture

**Deliverable**: Security audit complete, all issues fixed

---

### Week 24: Production Cutover

**Day 1-2: Pre-Cutover Checklist** (12 hours)

Tasks:
- [ ] Final data sync from Supabase → RDS
- [ ] Verify all data migrated correctly
- [ ] Take final backups of both systems
- [ ] Test rollback procedure
- [ ] Notify users of maintenance window (if needed)

**Day 3: Cutover** (8 hours)

**Cutover Procedure**:

1. **Stop writes to Supabase** (15 min):
   ```bash
   # Put current system in read-only mode
   # Update frontend to show maintenance message
   ```

2. **Final data sync** (30 min):
   ```bash
   # Run final migration script
   bun run scripts/migrate-to-rds.ts

   # Verify data
   bun run scripts/verify-migration.ts
   ```

3. **Switch DNS/URLs** (15 min):
   ```bash
   # Update environment variables to point to AWS
   # Deploy frontend with new API URLs
   amplify publish
   ```

4. **Enable AWS systems** (10 min):
   ```bash
   # Enable Lambda cron
   aws events enable-rule --name pick-a-bots-match-processor-trigger

   # Verify first cron run
   aws logs tail /aws/lambda/pick-a-bots-match-processor --follow
   ```

5. **Monitor** (2 hours):
   - Watch CloudWatch logs
   - Monitor error rates
   - Check database connections
   - Verify cron runs successfully
   - Test voting with real users

6. **Announce launch** (10 min):
   - Send email to users
   - Post on social media
   - Update status page

**Day 4-5: Post-Cutover Monitoring** (12 hours)

Tasks:
- [ ] Monitor system for 48 hours
- [ ] Fix any critical issues immediately
- [ ] Respond to user feedback
- [ ] Verify all features working
- [ ] Check costs (should be within budget)

**Deliverable**: ✅ **PRODUCTION LAUNCH COMPLETE!**

---

## Rollback Procedures

### Emergency Rollback (Critical Issues)

If critical issues occur after cutover, roll back immediately:

**Time to Rollback**: ~30 minutes

**Steps**:

1. **Revert DNS/URLs** (5 min):
   ```bash
   # Update environment variables to point back to Supabase
   # Deploy old frontend
   git checkout main~1  # Previous version
   wrangler deploy --env production
   ```

2. **Sync data back to Supabase** (15 min):
   ```bash
   # Run reverse migration script
   bun run scripts/migrate-to-supabase.ts
   ```

3. **Re-enable old cron** (2 min):
   ```bash
   # Enable Cloudflare Worker cron
   wrangler publish --env production
   ```

4. **Verify old system** (8 min):
   - Test voting
   - Check database
   - Verify cron runs

5. **Notify users** (2 min):
   - Send status update
   - Explain issue

**Post-Rollback**:
- Fix issues in AWS
- Test thoroughly
- Retry cutover when ready

---

### Partial Rollback (Non-Critical Issues)

If non-critical issues occur, can operate both systems in parallel:

**Approach**:
- Keep AWS as primary
- Supabase as backup
- Fix issues in AWS
- Monitor closely

---

## Risk Mitigation

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Data loss during migration** | Low | Critical | Multiple backups, verify before cutover |
| **Performance degradation** | Medium | High | Load testing, monitoring, auto-scaling |
| **Security vulnerabilities** | Low | Critical | Security audit, penetration testing |
| **Cost overrun** | Medium | Medium | Billing alerts, reserved instances, monitoring |
| **User disruption** | Low | High | Parallel systems, rollback plan, monitoring |
| **Migration timeline slip** | High | Medium | Phased approach, buffer time, weekly reviews |
| **Team bandwidth** | High | High | Clear roles, external help if needed |
| **AWS learning curve** | Medium | Medium | Documentation, AWS training, support plan |

### Mitigation Strategies

**Data Safety**:
- Daily backups during migration
- Point-in-time recovery enabled
- Test restore procedures weekly
- Data validation scripts run continuously

**Performance**:
- Load testing before cutover
- Auto-scaling configured
- CloudWatch alarms for anomalies
- Performance budgets defined

**Security**:
- Security review every 2 weeks
- Automated security scanning in CI
- Penetration testing before launch
- Incident response plan documented

**Cost Control**:
- Billing alerts at $50, $75, $100
- Daily cost reviews
- Reserved instances for predictable workloads
- Automatic resource cleanup

**User Communication**:
- Announce migration timeline
- Beta testing with volunteers
- Maintenance window notifications
- Status page during cutover

---

## Success Metrics

Track these metrics throughout migration:

### Technical Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| API Response Time (p95) | Unknown | <200ms | TBD |
| Database Query Time (p95) | Unknown | <100ms | TBD |
| Uptime | Unknown | 99.5% | TBD |
| Test Coverage | 0% | 80%+ | TBD |
| Security Issues | 11 | 0 | TBD |
| Concurrent Users Supported | ~50 | 400+ | TBD |

### Cost Metrics

| Service | Estimated | Actual |
|---------|-----------|--------|
| RDS | $25/month | TBD |
| Lambda | $1/month | TBD |
| Amplify | $10/month | TBD |
| Other | $16/month | TBD |
| **Total** | **$52/month** | **TBD** |

### User Metrics

| Metric | Target |
|--------|--------|
| User Satisfaction | >4/5 |
| System Errors | <0.1% of requests |
| Vote Success Rate | >99% |
| Page Load Time | <3 seconds |

---

## Weekly Checklist

Use this template for weekly reviews:

```markdown
## Week X Review

### Completed
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

### In Progress
- [ ] Task 4 (80% complete)
- [ ] Task 5 (50% complete)

### Blockers
- [ ] Issue 1: Description and plan to resolve
- [ ] Issue 2: Description and plan to resolve

### Metrics
- Time spent: X hours
- Budget spent: $X
- Tests written: X
- Coverage: X%

### Next Week Goals
1. Goal 1
2. Goal 2
3. Goal 3

### Risks
- Risk 1: Mitigation plan
- Risk 2: Mitigation plan
```

---

## Conclusion

This 24-week migration plan provides a structured approach to migrating Pick-a-Bots from the current multi-platform architecture to a simplified AWS-native deployment.

**Key Takeaways**:
- ✅ Zero downtime migration with parallel systems
- ✅ Phased approach reduces risk
- ✅ Rollback plan ensures safety
- ✅ Security issues fixed early (Phase 2)
- ✅ Thorough testing before production cutover
- ✅ Clear success criteria and metrics

**Timeline Summary**:
- Weeks 1-4: Foundation (database)
- Weeks 5-8: Backend (API routes)
- Weeks 9-10: Cron jobs
- Weeks 11-14: Frontend
- Weeks 15-18: Testing & CI/CD
- Weeks 19-24: Polish & launch

**Total Effort**: ~600-700 hours (3-4 person-months)

**Next Steps**:
1. Review this guide with team
2. Assign roles and responsibilities
3. Complete pre-migration checklist
4. Start Week 1!

**Good luck with your migration!** 🚀

For questions or assistance, refer to:
- AWS-ARCHITECTURE.md (setup details)
- SECURITY-AUDIT.md (security fixes)
- IMPROVEMENTS-AND-RECOMMENDATIONS.md (all issues)
- FUTURE-PLANS.md (architecture rationale)

---

**Document Version**: 1.0
**Last Updated**: December 2, 2025
**Maintained By**: Development Team
**Next Review**: End of Phase 1 (Week 4)
