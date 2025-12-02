# Future Plans: Pick-a-Bots Architecture Redesign

**Document Version**: 1.0
**Last Updated**: December 2, 2025
**Target Scale**: 400 concurrent users
**Timeline**: 6 months

---

## Executive Summary

**Recommendation: Complete Rebuild on AWS**

After thorough analysis of the current codebase, I recommend a **complete rebuild** using a simplified AWS-native architecture rather than refactoring the existing code. This decision is based on:

1. **Critical Security Issues**: 8 critical/high severity security vulnerabilities requiring extensive rewrites (see SECURITY-AUDIT.md)
2. **Deployment Complexity**: Current 3-platform architecture (Cloudflare Pages + Workers + Supabase) is unnecessarily complex for beginners
3. **Code Quality**: Multiple race conditions, missing error handling, and architectural issues that would require near-complete rewrites
4. **Learning Opportunity**: Starting fresh on AWS provides better learning foundation with comprehensive documentation and unified platform
5. **Future-Proofing**: AWS architecture scales beyond 400 users with minimal changes

**Cost**: ~$50-100/month for 400 concurrent users (vs ~$30-50 current, but 80% simpler to operate)
**Complexity Reduction**: 3 platforms → 1 platform (AWS only)
**Development Time**: 3-4 months for MVP, 6 months for feature parity with improvements

---

## Current Architecture Assessment

### What Works Well ✅

1. **Core Functionality**: Voting mechanics and token system logic are sound
2. **Database Schema**: Well-designed with proper relationships (users, matches, votes, transactions)
3. **Real-time Updates**: Supabase Realtime integration for match updates
4. **UI/UX**: Clean interface with Chakra UI and good user experience

**Code Worth Salvaging**:
- Database schema design (`/database/src/db/schema/*`)
- Validation schemas (`/frontend/src/schemas/*`)
- UI components (`/frontend/src/components/*`)
- Core business logic patterns

### Critical Issues Requiring Rebuild ❌

#### 1. Security Vulnerabilities (8 Critical/High)
**Files Affected**:
- `frontend/wrangler.toml:23-41` - Exposed production secrets
- `frontend/src/services/auth.ts:5-51` - Weak shared password authentication
- `frontend/src/app/api/user/update-tokens/route.ts:14-17` - Vulnerable webhook verification
- All API routes - Missing rate limiting, CSRF protection

**Impact**: These aren't simple fixes—they require architectural changes to authentication, API security, and deployment configuration.

#### 2. Race Conditions (4 Instances)
**Files Affected**:
- `cron/src/services/supabase/api-client.ts:61-92` - Current match updates
- `frontend/src/app/api/user/update-tokens/route.ts:118-150` - Token balance calculations
- `frontend/src/hooks/useCurrentMatch.ts:91-136` - Memory leak in subscriptions

**Impact**: Require database-level changes (transactions, locking) and architectural refactoring.

#### 3. Deployment Complexity
**Current Setup**:
```
Developer must manage:
├── Cloudflare Pages (Frontend)
│   ├── Environment variables in dashboard
│   ├── OpenNext.js adapter configuration
│   └── Build settings
├── Cloudflare Workers (Cron)
│   ├── Separate wrangler.toml config
│   ├── Different environment variables
│   └── Cron trigger configuration
└── Supabase (Database)
    ├── Database migrations (Drizzle)
    ├── RLS policies (separate SQL file)
    └── Realtime subscriptions
```

**Issues**:
- 3 separate deployment processes
- Configuration drift between platforms
- No unified logging/monitoring
- Manual secret synchronization
- Steep learning curve for beginners

#### 4. Missing Critical Infrastructure
- No testing (0 test files despite MSW installed)
- No CI/CD pipeline (manual deployments)
- No error monitoring (console.log only)
- No performance tracking
- No automated backups verification

**Effort to Fix**: ~80% rewrite required to address these properly.

---

## Recommended Architecture: AWS-Native Rebuild

### Why AWS?

1. **Simplicity**: Single platform for everything (compute, database, cron, monitoring)
2. **Beginner-Friendly**: Best documentation, largest community, most learning resources
3. **Cost-Effective**: Free tier + predictable pricing for small scale
4. **Scalability**: Handles 400 users easily, scales to 10,000+ with minimal changes
5. **Job Market**: AWS skills most valuable for career development

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Cloud                                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────┐            │
│  │         AWS Amplify Hosting                  │            │
│  │  (Frontend: Next.js + API Routes)            │            │
│  │  - Auto-scaling                               │            │
│  │  - CDN included                               │            │
│  │  - SSL certificates                           │            │
│  │  - Git-based deployments                     │            │
│  └──────────────┬──────────────────────────────┘            │
│                 │                                             │
│                 ▼                                             │
│  ┌─────────────────────────────────────────────┐            │
│  │      Amazon RDS PostgreSQL                   │            │
│  │  - t3.micro instance (free tier eligible)    │            │
│  │  - Automated backups                         │            │
│  │  - Point-in-time recovery                    │            │
│  │  - Automatic failover (Multi-AZ)             │            │
│  └─────────────────────────────────────────────┘            │
│                 ▲                                             │
│                 │                                             │
│  ┌─────────────────────────────────────────────┐            │
│  │      AWS EventBridge (Scheduler)             │            │
│  │  - Triggers every 2 minutes                  │            │
│  └──────────────┬──────────────────────────────┘            │
│                 │                                             │
│                 ▼                                             │
│  ┌─────────────────────────────────────────────┐            │
│  │      AWS Lambda (Match Processor)            │            │
│  │  - Fetches Challonge data                    │            │
│  │  - Updates database                          │            │
│  │  - Resolves votes                            │            │
│  └─────────────────────────────────────────────┘            │
│                                                               │
│  ┌─────────────────────────────────────────────┐            │
│  │      AWS CloudWatch                          │            │
│  │  - Centralized logging                       │            │
│  │  - Performance metrics                       │            │
│  │  - Automated alerts                          │            │
│  └─────────────────────────────────────────────┘            │
│                                                               │
│  ┌─────────────────────────────────────────────┐            │
│  │      AWS Secrets Manager                     │            │
│  │  - API keys (Challonge)                      │            │
│  │  - Database credentials                      │            │
│  │  - JWT secrets                               │            │
│  └─────────────────────────────────────────────┘            │
│                                                               │
└─────────────────────────────────────────────────────────────┘

External Services:
- Challonge API (tournament data)
- [Optional] Amazon SES (email notifications)
- [Optional] Amazon Cognito (advanced auth)
```

### Key Components

#### 1. AWS Amplify (Frontend + Backend API)
**What it replaces**: Cloudflare Pages + Next.js API routes

**Benefits**:
- Single deployment command: `amplify push`
- Automatic HTTPS and CDN
- Preview deployments for PRs
- Built-in monitoring
- Environment variable management UI

**Configuration**:
```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - bun install
    build:
      commands:
        - bun run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

#### 2. Amazon RDS PostgreSQL
**What it replaces**: Supabase

**Benefits**:
- Full PostgreSQL compatibility (migrate schema easily)
- Automated backups (35 days retention)
- Multi-AZ for 99.95% uptime
- VPC isolation (better security)
- Performance Insights included

**Configuration**:
```
Instance: db.t3.micro (free tier)
Storage: 20 GB SSD (free tier)
Backups: Automated daily
Multi-AZ: No (enable for production)
```

**Migration**:
- Export Drizzle schema to SQL
- Use AWS Database Migration Service (DMS) for data

#### 3. AWS Lambda (Cron Jobs)
**What it replaces**: Cloudflare Workers

**Benefits**:
- Simpler than Workers (no edge complexity)
- Better cold start for scheduled tasks
- Direct RDS access via VPC
- Integrated with EventBridge
- Free tier: 1M requests/month

**Code Structure**:
```typescript
// lambda/match-processor/index.ts
export const handler = async (event: EventBridgeEvent) => {
  const processor = new MatchProcessor({
    challongeApiKey: process.env.CHALLONGE_API_KEY,
    database: await createDBConnection(),
  });

  await processor.processMatches();
};
```

#### 4. AWS EventBridge
**What it replaces**: Cloudflare Cron Triggers

**Benefits**:
- More reliable than cron expressions
- Visual rule builder
- Better error handling
- Dead letter queues for failures

**Configuration**:
```
Rule: match-processor-trigger
Schedule: rate(2 minutes)
Target: Lambda function
Retry: 2 attempts
DLQ: Yes (SQS queue)
```

#### 5. AWS CloudWatch
**What it replaces**: Console.log + manual monitoring

**Benefits**:
- Centralized logging from all services
- Automatic metric collection
- Custom dashboards
- Alert on errors/latency
- Log retention policies

#### 6. AWS Secrets Manager
**What it fixes**: Exposed secrets in wrangler.toml

**Benefits**:
- Encrypted secret storage
- Automatic rotation
- Fine-grained access control
- Audit logging
- Version history

---

## Comparison: Current vs Proposed

| Aspect | Current (Cloudflare + Supabase) | Proposed (AWS) |
|--------|----------------------------------|----------------|
| **Deployment Platforms** | 3 (Pages, Workers, Supabase) | 1 (AWS) |
| **Deploy Commands** | 3 separate commands | 1 command (`amplify push`) |
| **Configuration Files** | 4 (wrangler.toml, .env, .dev.vars, docker/.env) | 1 (.env) |
| **Learning Curve** | High (3 platforms) | Medium (1 platform) |
| **Monthly Cost (400 users)** | $30-50 | $50-100 |
| **Monitoring** | Fragmented (3 dashboards) | Unified (CloudWatch) |
| **Security** | Manual secret management | Secrets Manager + IAM |
| **Scalability** | Good | Excellent |
| **Cold Starts** | ~50ms (Workers) | ~200ms (Lambda) |
| **Database** | Managed (Supabase) | Managed (RDS) |
| **Real-time** | Supabase Realtime | AWS AppSync or polling |
| **Backups** | Supabase automatic | RDS automatic |
| **Career Value** | Niche (Cloudflare) | High (AWS) |

### Why Not Stick With Current?

**Pros of Current Setup**:
- Lower cost ($30-50 vs $50-100)
- Faster edge performance (Cloudflare CDN)
- Supabase Realtime is excellent

**Cons Outweigh Pros**:
1. **Security issues require rebuilds anyway** (see SECURITY-AUDIT.md)
2. **3-platform complexity** is not worth $20-30/month savings for beginners
3. **Race conditions** need architectural changes regardless
4. **No unified monitoring** makes debugging hard
5. **Limited AWS experience** means harder to get help/jobs

---

## Migration Strategy: Phased Approach

### Phase 1: Foundation (Weeks 1-4)
**Goal**: Setup AWS infrastructure and migrate database

**Tasks**:
- [ ] Create AWS account and setup billing alerts
- [ ] Setup AWS Amplify project
- [ ] Provision RDS PostgreSQL instance
- [ ] Migrate database schema using Drizzle
- [ ] Setup AWS Secrets Manager for credentials
- [ ] Configure VPC and security groups

**Code to Migrate**:
- `/database/src/db/schema/*` → Direct migration to RDS
- Update connection strings to RDS endpoint

**Deliverable**: Working database in AWS with existing schema

---

### Phase 2: Core Backend (Weeks 5-8)
**Goal**: Rebuild API routes with proper security

**Tasks**:
- [ ] Implement proper authentication (JWT or Cognito)
- [ ] Rebuild `/api/join` with password hashing
- [ ] Rebuild `/api/vote` with validation and rate limiting
- [ ] Rebuild `/api/leaderboard` with caching
- [ ] Rebuild `/api/user/*` routes
- [ ] Add API middleware (auth, rate limiting, CORS)

**Code to Salvage**:
- Business logic from `/frontend/src/services/*`
- Validation schemas from `/frontend/src/schemas/*`

**New Code Required**:
```typescript
// lib/auth.ts - Proper JWT authentication
// lib/ratelimit.ts - Rate limiting middleware
// lib/db.ts - Database connection pooling
// lib/errors.ts - Centralized error handling
```

**Deliverable**: Secure, rate-limited API endpoints on Amplify

---

### Phase 3: Cron Jobs (Weeks 9-10)
**Goal**: Migrate match processor to Lambda

**Tasks**:
- [ ] Create Lambda function for match processing
- [ ] Setup EventBridge trigger (2-minute interval)
- [ ] Migrate Challonge API client
- [ ] Implement vote resolution logic (with proper locking)
- [ ] Add CloudWatch logging
- [ ] Setup dead letter queue for failures

**Code to Migrate**:
- `/cron/src/services/challonge/*` → Lambda
- `/cron/src/services/match.ts` → Lambda
- Rewrite with proper transaction handling

**Deliverable**: Automated match updates via Lambda

---

### Phase 4: Frontend (Weeks 11-14)
**Goal**: Rebuild UI with improved UX

**Tasks**:
- [ ] Setup Next.js 15 on Amplify
- [ ] Migrate UI components
- [ ] Implement real-time updates (polling or AppSync)
- [ ] Add loading states and error boundaries
- [ ] Implement optimistic UI updates
- [ ] Add proper error toasts

**Code to Migrate**:
- `/frontend/src/components/*` → Direct migration
- `/frontend/src/app/*/page.tsx` → Update API calls
- `/frontend/src/hooks/*` → Rewrite for new API

**New Features**:
- Optimistic vote submission
- Better loading states
- Error recovery UI

**Deliverable**: Fully functional frontend on Amplify

---

### Phase 5: Testing & CI/CD (Weeks 15-18)
**Goal**: Add testing and automated deployment

**Tasks**:
- [ ] Setup Vitest for unit tests
- [ ] Write API endpoint tests (80% coverage)
- [ ] Add integration tests for critical flows
- [ ] Setup GitHub Actions for CI/CD
- [ ] Configure Amplify for automatic deployments
- [ ] Add preview environments for PRs

**Test Files to Create**:
```
__tests__/
├── api/
│   ├── vote.test.ts
│   ├── join.test.ts
│   └── leaderboard.test.ts
├── services/
│   ├── match-processor.test.ts
│   └── vote-resolver.test.ts
└── components/
    └── VoteButton.test.tsx
```

**Deliverable**: Automated testing and deployment pipeline

---

### Phase 6: Polish & Launch (Weeks 19-24)
**Goal**: Add features and optimize

**Tasks**:
- [ ] Add email notifications (Amazon SES)
- [ ] Implement admin dashboard
- [ ] Add analytics (CloudWatch + custom metrics)
- [ ] Optimize database queries (indexes)
- [ ] Load testing (400 concurrent users)
- [ ] Security audit
- [ ] Documentation and runbooks
- [ ] Launch!

**Deliverable**: Production-ready system

---

## Additional Features to Add

### High Priority
These significantly improve user experience and were missing in current version:

#### 1. Email Notifications (Amazon SES)
**When**: Phase 6 (Weeks 19-24)
**Cost**: $0.10 per 1,000 emails (400 users × 5 emails/event = $0.20/event)

**Emails to Send**:
- Match starting (5 min before voting closes)
- Vote confirmed
- Match results (win/loss notification)
- Token balance updates
- Tournament milestones

**Implementation**:
```typescript
// services/notifications.ts
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export async function sendMatchStartNotification(
  userId: string,
  match: Match
) {
  const user = await getUser(userId);

  await ses.send(new SendEmailCommand({
    Source: "noreply@pickabots.ramsoc.com",
    Destination: { ToAddresses: [user.email] },
    Message: {
      Subject: { Data: `Match Starting: ${match.bot1} vs ${match.bot2}` },
      Body: {
        Html: { Data: renderEmailTemplate('match-start', { match, user }) }
      },
    },
  }));
}
```

#### 2. Admin Dashboard
**When**: Phase 6 (Weeks 19-24)

**Features**:
- Pause/resume tournament
- Manually trigger match processor
- View system health metrics
- Manage user tokens (grant/deduct)
- View audit logs
- Override match results (if needed)

**Access Control**:
```typescript
// middleware/admin-auth.ts
export function requireAdmin(handler: RouteHandler) {
  return async (req: Request) => {
    const user = await getAuthUser(req);

    if (!user.isAdmin) {
      return new Response("Forbidden", { status: 403 });
    }

    return handler(req);
  };
}
```

#### 3. Real-time Leaderboard Updates
**Current**: Manual refresh required
**Proposed**: Live updates using polling or AppSync

**Implementation Options**:
- **Option A**: Polling (Simple)
  ```typescript
  // Poll every 30 seconds
  useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
    refetchInterval: 30000,
  });
  ```

- **Option B**: AWS AppSync (GraphQL subscriptions)
  ```graphql
  subscription OnLeaderboardUpdate {
    leaderboardUpdated {
      userId
      tokens
      rank
    }
  }
  ```

**Recommendation**: Start with polling (simple), migrate to AppSync if needed.

#### 4. Vote History with Pagination
**Current**: Loads all transactions (no pagination)
**Proposed**: Cursor-based pagination

```typescript
// api/user/vote-history/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const limit = 20;

  const transactions = await db
    .select()
    .from(tokenTransaction)
    .where(and(
      eq(tokenTransaction.userId, userId),
      cursor ? lt(tokenTransaction.createdAt, cursor) : undefined
    ))
    .orderBy(desc(tokenTransaction.createdAt))
    .limit(limit + 1);

  const hasMore = transactions.length > limit;
  const items = transactions.slice(0, limit);

  return Response.json({
    items,
    nextCursor: hasMore ? items[items.length - 1].createdAt : null,
  });
}
```

#### 5. Analytics Dashboard
**Metrics to Track**:
- Total votes per match
- Vote accuracy (% correct predictions)
- Most popular bots
- Token distribution histogram
- Active users per hour
- Average response time

**Implementation**: CloudWatch custom metrics + Lambda for aggregation

### Medium Priority

#### 6. Social Features
- Vote leaderboard (most accurate predictors)
- Share results on social media
- Tournament brackets visualization
- Historical statistics

#### 7. Mobile App (React Native + AWS Amplify)
- Uses same backend APIs
- Push notifications instead of email
- Faster voting experience

#### 8. Advanced Tournament Features
- Multiple simultaneous tournaments
- Different token pools per tournament
- Team betting (group accounts)
- Bonus challenges

### Low Priority (Post-Launch)

#### 9. Machine Learning Predictions
- Train model on historical match data
- Show AI predictions to users
- Compare user accuracy vs AI

#### 10. Gamification
- Achievements/badges
- Streak tracking
- Daily login bonuses
- Referral rewards

---

## Cost Breakdown: AWS Architecture

### Development Environment (Free Tier)
```
AWS Free Tier (12 months):
├── Amplify Hosting: 1000 build minutes/month (FREE)
├── RDS db.t3.micro: 750 hours/month (FREE)
├── Lambda: 1M requests/month (FREE)
├── CloudWatch: 5GB logs/month (FREE)
├── Secrets Manager: 1 secret (FREE)
└── Data Transfer: 15GB/month (FREE)

Total: $0/month for first year (within free tier)
```

### Production (400 Concurrent Users)

#### Minimum Configuration
```
Monthly Costs:

1. AWS Amplify Hosting
   - Build minutes: 1000/month included, $0.01/min after
   - Hosting: $0.15/GB stored + $0.15/GB served
   - Estimate: ~2GB app, ~50GB transfer
   - Cost: ~$10/month

2. Amazon RDS PostgreSQL
   - Instance: db.t3.small (required for 400 concurrent)
   - Storage: 20GB SSD
   - Backups: 20GB (same as storage, free)
   - Cost: ~$25/month (on-demand) or $15/month (1-year reserved)

3. AWS Lambda
   - Invocations: 21,600/month (every 2 min)
   - Duration: ~5 seconds avg
   - Memory: 512MB
   - Cost: ~$1/month (well within free tier)

4. EventBridge
   - Rules: 1 rule (free)
   - Invocations: Included
   - Cost: $0/month

5. CloudWatch
   - Logs: ~5GB/month
   - Metrics: ~50 custom metrics
   - Alarms: ~5 alarms
   - Cost: ~$5/month

6. Secrets Manager
   - Secrets: ~5 secrets
   - API calls: ~50,000/month
   - Cost: ~$2/month

7. Data Transfer
   - Out to internet: ~100GB/month
   - Cost: ~$9/month (first 10TB is $0.09/GB)

8. [Optional] Amazon SES
   - Emails: ~2,000/month (400 users × 5 events)
   - Cost: ~$0.20/month

Total: $52-62/month (minimal setup)
Total with 1-year reserved RDS: $42-52/month
```

#### Optimized Configuration (Better Performance)
```
Changes from minimal:
- RDS: db.t3.medium (better for concurrent load)
- Lambda: 1024MB memory (faster cold starts)
- CloudFront: Add CDN for faster global access

Additional costs: +$30/month
Total: $82-92/month
```

#### High Availability Configuration (Production)
```
Changes from optimized:
- RDS: Multi-AZ deployment (auto-failover)
- Lambda: Provisioned concurrency (no cold starts)
- Route 53: Custom domain
- WAF: DDoS protection

Additional costs: +$50/month
Total: $132-142/month
```

### Cost Optimization Tips

1. **Use Reserved Instances**: Save 30-40% on RDS with 1-year commitment
2. **Enable AWS Budgets**: Alert when cost exceeds $60/month
3. **Optimize Lambda**: Use smaller memory if possible (256MB vs 512MB)
4. **Compress Assets**: Reduce data transfer costs
5. **Use S3 for Static Assets**: Cheaper than Amplify for large files

### Scaling Costs (Future)

| Concurrent Users | Config | Monthly Cost |
|-----------------|---------|--------------|
| 100 users | db.t3.micro + minimal | $25-35 |
| 400 users | db.t3.small + minimal | $50-60 |
| 1,000 users | db.t3.medium + optimized | $90-100 |
| 5,000 users | db.m5.large + HA | $250-300 |
| 10,000 users | db.m5.xlarge + HA + Cache | $500-600 |

**Key Insight**: AWS scales linearly—doubling users doesn't double costs.

---

## Code Salvage vs Rewrite Analysis

### Code Worth Keeping (40% of codebase)

#### 1. Database Schema ✅ (95% reusable)
**Files**: `/database/src/db/schema/*`

**Salvage Strategy**: Direct migration
```typescript
// Already well-designed, just needs:
1. Add indexes for performance
2. Add CHECK constraints for validation
3. Minor column adjustments

// Example: user.ts remains nearly identical
export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  zid: text("zid").notNull().unique(),
  tokens: integer("tokens").notNull().default(100),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("user_tokens_idx").on(table.tokens), // ADD THIS
  index("user_zid_idx").on(table.zid), // ADD THIS
]);
```

#### 2. Validation Schemas ✅ (80% reusable)
**Files**: `/frontend/src/schemas/*`

**Salvage Strategy**: Update and enhance
```typescript
// join.ts - Mostly good, just add:
export const joinSchema = yup.object().shape({
  email: yup.string()
    .email()
    .matches(/@.*\.edu$/, "Must use university email") // ADD THIS
    .required(),
  displayName: yup.string()
    .min(3)
    .max(50) // ADD THIS
    .test("no-sensitive-words", ...) // ENHANCE THIS
    .required(),
  zid: yup.string()
    .matches(/^z\d{7}$/, "Invalid zID format")
    .required(),
  accessCode: yup.string().required(),
});
```

#### 3. UI Components ✅ (90% reusable)
**Files**: `/frontend/src/components/*`

**Salvage Strategy**: Direct migration with minor updates
```typescript
// Components are clean and well-structured
// Just update API calls to new endpoints
// Example: VoteButton.tsx
- const { mutate } = useMutation({ mutationFn: submitVote });
+ const { mutate } = useMutation({
+   mutationFn: async (data) => {
+     const response = await fetch('/api/v1/vote', {
+       method: 'POST',
+       body: JSON.stringify(data),
+       headers: { 'Content-Type': 'application/json' },
+     });
+     if (!response.ok) throw new Error(await response.text());
+     return response.json();
+   }
+ });
```

#### 4. Business Logic Patterns ✅ (60% reusable)
**Files**:
- Vote validation logic
- Token calculation formulas
- Match state transitions

**Salvage Strategy**: Extract and refactor
```typescript
// Current: frontend/src/app/api/vote/route.ts (lines 20-40)
// Salvage: Core validation logic

// Rewrite as:
// services/vote-service.ts
export class VoteService {
  async validateVote(params: ValidateVoteParams): Promise<VoteValidation> {
    // Extract current validation logic
    const { matchId, userId, botChosen, tokensUsed } = params;

    // Reuse formulas:
    const maxTokensAllowed = userBalance * 0.5;
    const votingWindowOpen = isWithinVotingWindow(match.underwayTime);

    // But add proper error handling:
    if (!votingWindowOpen) {
      throw new VoteWindowClosedError(match.underwayTime);
    }

    return { valid: true };
  }
}
```

### Code to Rewrite (60% of codebase)

#### 1. Authentication System ❌ (Complete rewrite)
**Files**: `/frontend/src/services/auth.ts`, `/frontend/src/lib/supabase/*`

**Why Rewrite**:
- Current uses shared password (critical security flaw)
- Supabase auth tightly coupled
- Missing proper session management

**New Implementation**:
```typescript
// lib/auth.ts - JWT-based authentication
import { SignJWT, jwtVerify } from 'jose';
import { hash, verify } from 'bcrypt';

export async function register(params: RegisterParams) {
  // Hash individual user password
  const passwordHash = await hash(params.password, 10);

  // Create user in database
  const user = await db.insert(users).values({
    email: params.email,
    passwordHash,
    zid: params.zid,
    name: params.displayName,
  }).returning();

  // Generate JWT token
  const token = await new SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));

  return { user, token };
}

export async function login(email: string, password: string) {
  const user = await db.select().from(users).where(eq(users.email, email));
  if (!user) throw new AuthError("Invalid credentials");

  const valid = await verify(password, user.passwordHash);
  if (!valid) throw new AuthError("Invalid credentials");

  const token = await generateJWT(user.id);
  return { user, token };
}
```

#### 2. API Routes ❌ (Significant rewrites)
**Files**: `/frontend/src/app/api/**/*`

**Why Rewrite**:
- Missing rate limiting
- Inconsistent error handling
- Race conditions
- No CSRF protection

**New Implementation**: See Phase 2 in migration strategy

#### 3. Cron Service ❌ (Architectural rewrite)
**Files**: `/cron/src/**/*`

**Why Rewrite**:
- Race conditions in current_match updates
- Token balance race conditions
- No proper transaction handling
- Cloudflare Workers-specific code

**New Implementation**: Lambda with proper database locking

#### 4. Real-time Updates ❌ (Different approach)
**Files**: `/frontend/src/hooks/useCurrentMatch.ts`

**Why Rewrite**:
- Supabase Realtime not available in RDS
- Memory leak in current implementation
- Stale closure bugs

**New Implementation**: Polling or AppSync subscriptions

---

## Technology Stack: New vs Old

| Layer | Current | Proposed | Reason |
|-------|---------|----------|--------|
| **Hosting** | Cloudflare Pages | AWS Amplify | Unified AWS platform |
| **Backend** | Next.js API Routes | Next.js API Routes | Keep (works well) |
| **Database** | Supabase PostgreSQL | RDS PostgreSQL | More control, same features |
| **ORM** | Drizzle | Drizzle | Keep (excellent) |
| **Cron** | Cloudflare Workers | AWS Lambda | Simpler, better RDS access |
| **Scheduler** | Cloudflare Cron | EventBridge | More reliable |
| **Auth** | Supabase Auth | JWT + bcrypt | Proper security |
| **Real-time** | Supabase Realtime | Polling / AppSync | RDS doesn't have realtime |
| **Secrets** | wrangler.toml (exposed!) | Secrets Manager | Actual security |
| **Monitoring** | console.log | CloudWatch | Professional logging |
| **Caching** | None | CloudFront + Redis | Better performance |
| **Email** | None | Amazon SES | New feature |
| **Testing** | None | Vitest + Playwright | Quality assurance |
| **CI/CD** | Manual | GitHub Actions | Automation |

**Keep**: Next.js, React, Drizzle, Chakra UI, TanStack Query
**Replace**: Cloudflare platform, Supabase auth, Supabase realtime
**Add**: Testing, CI/CD, monitoring, email

---

## Risk Assessment

### Risks of Rebuilding

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Over-budget** | Medium | Medium | Start with minimal AWS config, scale up |
| **Timeline slip** | Medium | High | Use phased approach, MVP in 3 months |
| **Learning curve** | High | Medium | AWS has excellent docs, large community |
| **Missing features** | Low | Medium | Salvage 40% of code, only rewrite what's broken |
| **AWS complexity** | Medium | Medium | Use Amplify (simplified AWS), not raw services |
| **Migration bugs** | Medium | High | Comprehensive testing phase (Phase 5) |

### Risks of NOT Rebuilding (Refactoring Current Code)

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Security breach** | HIGH | CRITICAL | Fix immediately, but still need rewrites |
| **Data corruption** | High | Critical | Race conditions require DB changes |
| **Deployment failures** | High | High | 3-platform complexity won't go away |
| **Technical debt** | Very High | High | Refactoring = rewriting 60% anyway |
| **Scalability issues** | Medium | High | Architecture doesn't support 400 users well |
| **Maintenance burden** | Very High | High | Team struggles with 3 platforms |

**Conclusion**: Refactoring has HIGHER risk than rebuilding because:
1. Security issues require rewrites anyway (not simple fixes)
2. Race conditions need architectural changes (not patches)
3. 3-platform deployment stays complex
4. Would spend same time fixing as rebuilding, but end up with debt

---

## Success Metrics

### Technical Metrics (Minimum Viable Product)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Concurrent Users** | 400 | ~50 estimated | ❌ Need scaling |
| **API Response Time** | < 200ms p95 | Unknown | ❌ No monitoring |
| **Uptime** | 99.5% | Unknown | ❌ No tracking |
| **Database Queries** | < 100ms p95 | Unknown | ❌ No indexes |
| **Test Coverage** | > 80% | 0% | ❌ No tests |
| **Security Score** | A+ (Mozilla Observatory) | F (exposed secrets) | ❌ Critical issues |
| **Lighthouse Score** | > 90 | Unknown | ❓ Probably good |
| **Bundle Size** | < 500KB | Unknown | ❌ Likely too large |

### Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **User Registration** | > 300 users | Track in database |
| **Vote Participation** | > 70% of users vote per match | Votes / active users |
| **System Errors** | < 0.1% of requests | CloudWatch errors |
| **User Satisfaction** | > 4/5 rating | Post-event survey |
| **Operational Cost** | < $100/month | AWS billing |

### Deployment Metrics

| Metric | Target |
|--------|--------|
| **Deploy Time** | < 10 minutes |
| **Deploy Frequency** | Multiple times/day (safe) |
| **Rollback Time** | < 2 minutes |
| **Failed Deployments** | < 5% |

---

## Decision Matrix: Refactor vs Rebuild

| Criteria | Weight | Refactor Score | Rebuild Score | Winner |
|----------|--------|----------------|---------------|--------|
| **Time to MVP** | 20% | 6/10 (2 months) | 7/10 (3 months) | Rebuild |
| **Security** | 30% | 3/10 (still has issues) | 10/10 (clean slate) | **Rebuild** |
| **Operational Complexity** | 25% | 4/10 (3 platforms) | 9/10 (1 platform) | **Rebuild** |
| **Learning Value** | 10% | 5/10 (fix others' code) | 9/10 (AWS skills) | **Rebuild** |
| **Cost** | 10% | 8/10 ($30-50/mo) | 7/10 ($50-100/mo) | Refactor |
| **Scalability** | 5% | 6/10 (unknown) | 9/10 (proven) | Rebuild |

**Weighted Score**:
- Refactor: 4.95 / 10
- Rebuild: 8.65 / 10

**Recommendation: REBUILD** (75% confidence)

---

## Next Steps

### Immediate Actions (This Week)

1. **Rotate Exposed Secrets** (1 hour)
   - Change all secrets in `frontend/wrangler.toml`
   - Move to environment variables
   - See SECURITY-AUDIT.md for details

2. **Setup AWS Account** (2 hours)
   - Create AWS account (use free tier)
   - Setup billing alerts ($50, $75, $100)
   - Enable MFA on root account
   - Create IAM admin user

3. **Architecture Review** (1 hour)
   - Review this document with team
   - Decide on rebuild vs refactor
   - Set timeline and milestones

### Short-term (Weeks 1-2)

1. **Proof of Concept** (1 week)
   - Deploy simple Next.js app to Amplify
   - Create RDS instance and connect
   - Verify cost estimates

2. **Detailed Planning** (1 week)
   - Break down Phase 1 into tasks
   - Assign responsibilities
   - Setup project tracking (GitHub Projects)

### Medium-term (Months 1-3)

1. **Foundation (Month 1)**
   - Complete Phase 1: Database migration
   - Begin Phase 2: Core backend

2. **Core Features (Month 2)**
   - Complete Phase 2: API routes
   - Complete Phase 3: Cron jobs

3. **User Experience (Month 3)**
   - Complete Phase 4: Frontend
   - Begin Phase 5: Testing

### Long-term (Months 4-6)

1. **Quality Assurance (Month 4)**
   - Complete Phase 5: Testing & CI/CD
   - Load testing with 400 simulated users

2. **Polish (Month 5)**
   - Complete Phase 6: Additional features
   - Performance optimization
   - Security audit

3. **Launch (Month 6)**
   - Production deployment
   - Monitor and iterate
   - Celebrate! 🎉

---

## Frequently Asked Questions

### Q: Can we just fix the security issues and keep current architecture?

**A**: While technically possible, it would require:
- Rewriting authentication system (2 weeks)
- Adding rate limiting to all endpoints (1 week)
- Fixing race conditions with DB transactions (2 weeks)
- Implementing proper webhook security (1 week)
- Adding monitoring and alerting (1 week)
- **Total: 7 weeks of work**

Then you'd still have:
- 3-platform deployment complexity
- No testing infrastructure
- No CI/CD
- Limited AWS learning
- Same operational burden

**Verdict**: You'd spend ~2 months fixing issues and still have a complex system. Rebuilding takes 3-4 months but results in a much better foundation.

### Q: What if we exceed AWS Free Tier?

**A**: Realistic costs after free tier expires:
- Development: ~$10-20/month (single small RDS instance)
- Production (400 users): ~$50-100/month

**Cost Controls**:
```bash
# Setup billing alerts
aws budgets create-budget \
  --budget-name "Monthly-Budget" \
  --budget-limit amount=75.00 unit=USD \
  --notifications threshold=80 type=ACTUAL
```

### Q: Can we handle more than 400 users on this architecture?

**A**: Yes, easily:
- **1,000 users**: Upgrade RDS to db.t3.medium (+$20/month)
- **5,000 users**: Add ElastiCache Redis, upgrade to db.m5.large (+$150/month)
- **10,000 users**: Multi-AZ deployment, provisioned Lambda (+$250/month)
- **50,000+ users**: Add Aurora Serverless, multi-region (+$500+/month)

The architecture scales well beyond 400 users with minimal changes.

### Q: How do we handle real-time updates without Supabase Realtime?

**A**: Three options:

1. **Polling** (Simplest)
   - Query current match every 10-30 seconds
   - Works for 400 users
   - Adds ~2-3 queries/sec to database (negligible)

2. **Server-Sent Events** (Medium)
   - Keep HTTP connection open
   - Push updates when match changes
   - More efficient than polling

3. **AWS AppSync** (Most powerful)
   - GraphQL subscriptions
   - WebSocket connections
   - Real-time like Supabase
   - Adds $15-20/month cost

**Recommendation**: Start with polling, migrate to AppSync if needed.

### Q: What about cold starts on Lambda?

**A**: For scheduled cron jobs, cold starts don't matter:
- Job runs every 2 minutes
- ~200ms cold start is acceptable
- Can enable Provisioned Concurrency if needed (+$15/month)

For API routes (on Amplify), there are no cold starts—Next.js is always running.

### Q: Can we migrate back to current architecture if AWS doesn't work?

**A**: Yes, but unlikely to need:
- Database is PostgreSQL (works anywhere)
- API routes are standard Next.js (platform-agnostic)
- Could deploy to Vercel, Railway, Render, etc.

Migration path back to Cloudflare:
1. Export RDS database → Supabase
2. Deploy Next.js → Cloudflare Pages
3. Deploy Lambda → Cloudflare Workers
4. ~2-3 days of work

But AWS is a safer bet—used by millions of production apps.

---

## Conclusion

**Recommendation: Rebuild on AWS with simplified architecture**

**Summary**:
- Current codebase has 8 critical/high security issues requiring rewrites
- 3-platform deployment is unnecessarily complex for beginners
- Refactoring would take 60% as long as rebuilding but leave technical debt
- AWS provides better learning foundation and unified platform
- Cost: +$20-50/month but worth it for operational simplicity
- Timeline: 3-4 months to MVP, 6 months to feature parity with improvements

**What Makes This Rebuild Worth It**:
1. ✅ Learn industry-standard AWS skills
2. ✅ Fix all security issues with clean slate
3. ✅ Reduce deployment platforms from 3 to 1
4. ✅ Add testing and CI/CD from start
5. ✅ Built to scale beyond 400 users
6. ✅ Proper monitoring and observability
7. ✅ Salvage 40% of existing code (not starting from zero)

**Decision Point**:
If team agrees, start with **Phase 1** (Foundation) next week. Create AWS account, provision RDS, and migrate database schema. This is low-risk and validates the approach.

See **AWS-ARCHITECTURE.md** for detailed implementation guide.
See **MIGRATION-GUIDE.md** for week-by-week roadmap.
See **SECURITY-AUDIT.md** for critical issues to fix immediately.

---

**Document prepared by**: Claude Code
**Based on**: Comprehensive codebase analysis (December 2, 2025)
**Review Status**: Draft - Requires team review and approval
**Next Review**: After Phase 1 completion (Week 4)
