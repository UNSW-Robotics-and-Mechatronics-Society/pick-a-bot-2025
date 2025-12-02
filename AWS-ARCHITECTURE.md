# AWS Architecture Guide

**Document Version**: 1.0
**Last Updated**: December 2, 2025
**Target Audience**: Beginners to AWS
**Target Scale**: 400 concurrent users

---

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites](#prerequisites)
4. [AWS Account Setup](#aws-account-setup)
5. [Component Setup Guides](#component-setup-guides)
6. [Deployment Automation](#deployment-automation)
7. [Monitoring and Operations](#monitoring-and-operations)
8. [Cost Management](#cost-management)
9. [Scaling Beyond 400 Users](#scaling-beyond-400-users)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

This guide provides step-by-step instructions for deploying Pick-a-Bots on AWS infrastructure. The architecture is designed to be:

- **Simple**: Single platform (AWS only) instead of three (Cloudflare + Supabase + Workers)
- **Beginner-Friendly**: Clear instructions with explanations
- **Cost-Effective**: ~$50-100/month for 400 concurrent users
- **Scalable**: Handles 400+ users easily, scales to 10,000+ with minimal changes
- **Production-Ready**: Includes monitoring, backups, and security best practices

### Why This Architecture?

**Compared to Current Setup**:
- ✅ One deployment command vs three separate deployments
- ✅ Unified logging/monitoring vs fragmented dashboards
- ✅ Better security (Secrets Manager) vs exposed secrets in git
- ✅ Simpler to learn and operate
- ✅ Better career prospects (AWS skills)

**Trade-offs**:
- ⚠️ Slightly higher cost ($50-100 vs $30-50/month)
- ⚠️ Lambda cold starts (~200ms) vs Cloudflare Workers edge (~50ms)
- ✅ But operational simplicity far outweighs these minor drawbacks

---

## Architecture Overview

### High-Level Diagram

```
                                    ┌─────────────────────┐
                                    │   Users (400+)      │
                                    │   Web Browsers      │
                                    └──────────┬──────────┘
                                               │
                                               │ HTTPS
                                               ▼
┌───────────────────────────────────────────────────────────────────┐
│                          AWS Cloud                                 │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │             AWS Amplify Hosting                           │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Next.js Application (Frontend + API Routes)       │  │   │
│  │  │  - Auto-scaling                                    │  │   │
│  │  │  - Global CDN                                      │  │   │
│  │  │  - SSL certificates (automatic)                   │  │   │
│  │  │  - Git-based deployments                          │  │   │
│  │  └───────────────────┬────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                         │                                          │
│                         │ Private Connection (VPC)                │
│                         ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Amazon RDS PostgreSQL (Database)                  │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  - t3.small instance (2 vCPU, 2 GB RAM)            │  │   │
│  │  │  - 20 GB SSD storage                               │  │   │
│  │  │  - Automated daily backups (35 days retention)    │  │   │
│  │  │  - Automatic minor version upgrades               │  │   │
│  │  │  - Multi-AZ optional (high availability)          │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                         ▲                                          │
│                         │                                          │
│                         │ Database Connection                     │
│                         │                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │      AWS EventBridge Scheduler (Cron Trigger)             │   │
│  │  - Schedule: rate(2 minutes)                              │   │
│  │  - Triggers Lambda every 2 minutes                        │   │
│  │  - Dead Letter Queue for failures                         │   │
│  └───────────────────┬──────────────────────────────────────┘   │
│                      │                                            │
│                      │ Trigger Event                             │
│                      ▼                                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         AWS Lambda (Match Processor)                      │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  - Runtime: Node.js 20                             │  │   │
│  │  │  - Memory: 512 MB                                  │  │   │
│  │  │  - Timeout: 60 seconds                             │  │   │
│  │  │  - Fetches Challonge tournament data               │  │   │
│  │  │  - Updates database with matches                   │  │   │
│  │  │  - Resolves votes and updates tokens               │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          AWS CloudWatch (Monitoring & Logging)            │   │
│  │  - Centralized logs from all services                     │   │
│  │  - Performance metrics (latency, errors, etc.)            │   │
│  │  - Custom dashboards                                      │   │
│  │  - Automated alerts (email, SMS)                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          AWS Secrets Manager (Secure Secrets)             │   │
│  │  - Challonge API key                                      │   │
│  │  - Database credentials                                   │   │
│  │  - JWT signing secret                                     │   │
│  │  - Webhook secrets                                        │   │
│  │  - Automatic rotation (optional)                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘

External Services:
  ┌──────────────────────┐
  │  Challonge API       │ ◄───── Fetch tournament data
  └──────────────────────┘

Optional Add-ons:
  ┌──────────────────────┐
  │  Amazon SES          │ ◄───── Email notifications
  └──────────────────────┘
  ┌──────────────────────┐
  │  Amazon Cognito      │ ◄───── Advanced authentication
  └──────────────────────┘
```

### Component Responsibilities

| Component | Purpose | Replaces (Current) | Monthly Cost |
|-----------|---------|-------------------|--------------|
| **AWS Amplify** | Host Next.js app (frontend + API) | Cloudflare Pages | ~$10 |
| **Amazon RDS** | PostgreSQL database | Supabase | ~$25 |
| **AWS Lambda** | Scheduled match processor | Cloudflare Workers | ~$1 |
| **EventBridge** | Cron trigger (every 2 min) | Cloudflare Cron Triggers | Free |
| **CloudWatch** | Logging and monitoring | console.log (fragmented) | ~$5 |
| **Secrets Manager** | Secure secret storage | wrangler.toml (exposed!) | ~$2 |
| **Data Transfer** | Network egress | Cloudflare (included) | ~$9 |

**Total**: ~$52/month (minimal config) to ~$92/month (optimized)

---

## Prerequisites

### Required Software

Install these tools on your development machine:

1. **Node.js 18+** (verify: `node --version`)
   ```bash
   # macOS/Linux
   curl -o- https://nodejs.org/dist/v20.10.0/node-v20.10.0-darwin-x64.tar.gz | tar -xz

   # Or use nvm
   nvm install 20
   nvm use 20
   ```

2. **Bun** (current package manager)
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

3. **AWS CLI** (command-line interface)
   ```bash
   # macOS
   brew install awscli

   # Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install

   # Verify installation
   aws --version
   ```

4. **PostgreSQL Client** (psql)
   ```bash
   # macOS
   brew install postgresql@15

   # Linux
   sudo apt-get install postgresql-client
   ```

5. **Git**
   ```bash
   git --version  # Should already be installed
   ```

### Required Accounts

1. **AWS Account** (create at https://aws.amazon.com/free/)
   - Credit card required (but free tier covers most usage)
   - Enable MFA (multi-factor authentication) immediately
   - Takes ~10 minutes to set up

2. **Challonge Account** (existing)
   - API key from https://challonge.com/settings/account

3. **GitHub Account** (existing, for CI/CD)

### Skills Needed

- Basic command-line knowledge
- Understanding of Git
- No prior AWS experience required (this guide teaches you)

---

## AWS Account Setup

### Step 1: Create AWS Account

1. Go to https://aws.amazon.com/free/
2. Click "Create a Free Account"
3. Enter email address and account name
4. Verify email
5. Enter billing information (required, but won't be charged within free tier)
6. Verify phone number
7. Choose "Basic Support - Free"

**Important**: This creates a "root user" account. DO NOT use this for daily work.

### Step 2: Secure Root Account

1. **Enable MFA** (Multi-Factor Authentication):
   ```
   1. Sign in as root user
   2. Click your name (top right) → "Security credentials"
   3. Under "Multi-factor authentication (MFA)", click "Activate MFA"
   4. Choose "Virtual MFA device" (use Google Authenticator or Authy)
   5. Scan QR code with your phone
   6. Enter two consecutive MFA codes
   ```

2. **Create Password Policy**:
   ```
   1. Go to IAM console: https://console.aws.amazon.com/iam/
   2. Click "Account settings" (left sidebar)
   3. Click "Edit" under "Password policy"
   4. Enable:
      - Minimum password length: 14 characters
      - Require at least one uppercase letter
      - Require at least one lowercase letter
      - Require at least one number
      - Require at least one non-alphanumeric character
      - Enable password expiration (90 days)
   5. Click "Save changes"
   ```

### Step 3: Create IAM Admin User

DO NOT use root user for daily work. Create an admin user instead:

1. **Go to IAM console**: https://console.aws.amazon.com/iam/

2. **Create user**:
   ```
   1. Click "Users" (left sidebar)
   2. Click "Create user"
   3. Username: "pick-a-bots-admin"
   4. Enable "Provide user access to the AWS Management Console"
   5. Choose "I want to create an IAM user"
   6. Auto-generate password or set custom password
   7. UNCHECK "Users must create a new password at next sign-in"
   8. Click "Next"
   ```

3. **Set permissions**:
   ```
   1. Choose "Attach policies directly"
   2. Search and select "AdministratorAccess"
   3. Click "Next"
   4. Click "Create user"
   ```

4. **Save credentials**:
   ```
   1. Download CSV file with password
   2. Store securely (password manager)
   3. Note the sign-in URL (looks like: https://123456789012.signin.aws.amazon.com/console)
   ```

5. **Enable MFA for admin user**:
   ```
   1. Sign out of root account
   2. Sign in as "pick-a-bots-admin" using the sign-in URL
   3. Go to IAM → Users → pick-a-bots-admin
   4. Click "Security credentials" tab
   5. Under "Multi-factor authentication (MFA)", click "Assign MFA device"
   6. Follow same process as root user
   ```

### Step 4: Configure AWS CLI

1. **Create access keys**:
   ```
   1. In IAM console, click on "pick-a-bots-admin" user
   2. Click "Security credentials" tab
   3. Scroll to "Access keys"
   4. Click "Create access key"
   5. Choose use case: "Command Line Interface (CLI)"
   6. Check "I understand..." and click "Next"
   7. Add description: "Local development"
   8. Click "Create access key"
   9. DOWNLOAD CSV FILE (you can't see secret key again!)
   ```

2. **Configure CLI**:
   ```bash
   aws configure

   # Enter when prompted:
   AWS Access Key ID: [paste from CSV]
   AWS Secret Access Key: [paste from CSV]
   Default region name: us-east-1  # Choose closest region
   Default output format: json
   ```

3. **Verify configuration**:
   ```bash
   aws sts get-caller-identity

   # Should output:
   # {
   #   "UserId": "AIDAI...",
   #   "Account": "123456789012",
   #   "Arn": "arn:aws:iam::123456789012:user/pick-a-bots-admin"
   # }
   ```

### Step 5: Set Up Billing Alerts

Prevent unexpected charges:

1. **Enable billing alerts**:
   ```
   1. Sign in as root user
   2. Click your name (top right) → "Account"
   3. Scroll to "Billing preferences"
   4. Enable:
      - "Receive Free Tier Usage Alerts"
      - "Receive Billing Alerts"
   5. Enter email address
   6. Save preferences
   ```

2. **Create budget alert**:
   ```bash
   # Create budget via CLI
   aws budgets create-budget \
     --account-id $(aws sts get-caller-identity --query Account --output text) \
     --budget file://budget.json \
     --notifications-with-subscribers file://notifications.json
   ```

   Create `budget.json`:
   ```json
   {
     "BudgetName": "Pick-a-Bots-Monthly",
     "BudgetLimit": {
       "Amount": "75",
       "Unit": "USD"
     },
     "TimeUnit": "MONTHLY",
     "BudgetType": "COST"
   }
   ```

   Create `notifications.json`:
   ```json
   [
     {
       "Notification": {
         "NotificationType": "ACTUAL",
         "ComparisonOperator": "GREATER_THAN",
         "Threshold": 80,
         "ThresholdType": "PERCENTAGE"
       },
       "Subscribers": [
         {
           "SubscriptionType": "EMAIL",
           "Address": "your-email@example.com"
         }
       ]
     }
   ]
   ```

**Billing alerts set!** You'll get emails at:
- 80% of $75 budget ($60)
- 100% of $75 budget ($75)

---

## Component Setup Guides

### 1. Amazon RDS PostgreSQL Setup

**Purpose**: Database to store users, matches, votes, transactions

**Time**: 20 minutes

**Steps**:

#### 1.1 Create Security Group

```bash
# Create VPC security group for RDS
aws ec2 create-security-group \
  --group-name pick-a-bots-rds-sg \
  --description "Security group for Pick-a-Bots RDS database" \
  --vpc-id vpc-xxxxx  # Use default VPC ID

# Get default VPC ID
aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text

# Allow PostgreSQL connections (port 5432) from your IP
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 5432 \
  --cidr $(curl -s https://checkip.amazonaws.com)/32  # Your current IP
```

#### 1.2 Create RDS Instance

**Via AWS Console** (recommended for beginners):

1. Go to https://console.aws.amazon.com/rds/
2. Click "Create database"
3. Choose:
   - **Engine type**: PostgreSQL
   - **Engine version**: PostgreSQL 15.x (latest)
   - **Templates**: Free tier (or Production if free tier expired)
4. **Settings**:
   - DB instance identifier: `pick-a-bots-db`
   - Master username: `postgres`
   - Master password: Generate strong password (save to password manager!)
5. **Instance configuration**:
   - DB instance class: `db.t3.micro` (free tier) or `db.t3.small` (for 400 users)
6. **Storage**:
   - Storage type: General Purpose SSD (gp3)
   - Allocated storage: 20 GB
   - Enable storage autoscaling: Yes
   - Maximum storage threshold: 100 GB
7. **Connectivity**:
   - VPC: Default VPC
   - Public access: **Yes** (for development; use private for production)
   - VPC security group: Select "pick-a-bots-rds-sg"
   - Availability Zone: No preference
8. **Database authentication**: Password authentication
9. **Additional configuration**:
   - Initial database name: `pickabots`
   - Backup retention period: 7 days (or 35 days for production)
   - Enable automatic backups: Yes
   - Backup window: Choose off-peak hours
   - Enable encryption: Yes
   - Monitoring: Enable Enhanced Monitoring (1 minute interval)
10. Click "Create database"

**Wait 10-15 minutes** for database to be created.

#### 1.3 Get Connection Details

```bash
# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier pick-a-bots-db \
  --query "DBInstances[0].Endpoint.Address" \
  --output text

# Example output: pick-a-bots-db.c1a2b3c4d5e6.us-east-1.rds.amazonaws.com
```

#### 1.4 Test Connection

```bash
# Test connection
psql -h pick-a-bots-db.xxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d pickabots

# Enter password when prompted
# If successful, you'll see: pickabots=#
```

#### 1.5 Create Database URL

```bash
# Format: postgresql://username:password@host:port/database
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@pick-a-bots-db.xxxxx.us-east-1.rds.amazonaws.com:5432/pickabots"

# Test with psql
psql "$DATABASE_URL"
```

#### 1.6 Apply Database Schema

```bash
# Navigate to database folder
cd database

# Update .env file
echo "DATABASE_URL=$DATABASE_URL" > .env

# Install dependencies
bun install

# Apply schema using Drizzle
bun run db:push

# Apply RLS policies
bun run db:apply-policies

# Verify tables created
psql "$DATABASE_URL" -c "\dt"

# Should see tables: user, match, vote, current_match, token_transaction, cron_log
```

**Cost**: ~$15/month (db.t3.micro) or ~$25/month (db.t3.small)

---

### 2. AWS Secrets Manager Setup

**Purpose**: Securely store API keys, database credentials, JWT secrets

**Time**: 10 minutes

**Steps**:

#### 2.1 Store Database Credentials

```bash
# Create secret for database URL
aws secretsmanager create-secret \
  --name pick-a-bots/database-url \
  --description "PostgreSQL database connection URL" \
  --secret-string "$DATABASE_URL"
```

#### 2.2 Store API Keys

```bash
# Challonge API key
aws secretsmanager create-secret \
  --name pick-a-bots/challonge-api-key \
  --description "Challonge API key for tournament data" \
  --secret-string "YOUR_CHALLONGE_API_KEY"

# JWT signing secret (generate random string)
aws secretsmanager create-secret \
  --name pick-a-bots/jwt-secret \
  --description "JWT signing secret for authentication" \
  --secret-string "$(openssl rand -hex 32)"

# Webhook secret (generate random string)
aws secretsmanager create-secret \
  --name pick-a-bots/webhook-secret \
  --description "Webhook signature secret" \
  --secret-string "$(openssl rand -hex 32)"

# Access code for user registration (generate random string)
aws secretsmanager create-secret \
  --name pick-a-bots/access-code \
  --description "Access code for user registration" \
  --secret-string "PICKABOTS2025_$(openssl rand -hex 8)"
```

#### 2.3 Retrieve Secrets (Test)

```bash
# Retrieve database URL
aws secretsmanager get-secret-value \
  --secret-id pick-a-bots/database-url \
  --query SecretString \
  --output text

# Retrieve JWT secret
aws secretsmanager get-secret-value \
  --secret-id pick-a-bots/jwt-secret \
  --query SecretString \
  --output text
```

#### 2.4 Use Secrets in Code

```typescript
// lib/secrets.ts
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });

export async function getSecret(secretName: string): Promise<string> {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  return response.SecretString || "";
}

// Usage
const dbUrl = await getSecret("pick-a-bots/database-url");
const jwtSecret = await getSecret("pick-a-bots/jwt-secret");
```

**Cost**: ~$0.40 per secret per month = ~$2/month for 5 secrets

---

### 3. AWS Lambda Setup (Match Processor)

**Purpose**: Scheduled function to fetch Challonge data and update database

**Time**: 30 minutes

**Steps**:

#### 3.1 Create IAM Role for Lambda

```bash
# Create trust policy (allows Lambda to assume this role)
cat > lambda-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name pick-a-bots-lambda-role \
  --assume-role-policy-document file://lambda-trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name pick-a-bots-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Allow Lambda to access Secrets Manager
aws iam attach-role-policy \
  --role-name pick-a-bots-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite

# Allow Lambda to access RDS (if using VPC)
aws iam attach-role-policy \
  --role-name pick-a-bots-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
```

#### 3.2 Prepare Lambda Code

```bash
# Navigate to cron folder
cd cron

# Install dependencies
bun install

# Build for Lambda
bun build src/index.ts --target node --outdir dist

# Create deployment package
cd dist
zip -r ../lambda-function.zip .
cd ..
```

#### 3.3 Create Lambda Function

```bash
# Create function
aws lambda create-function \
  --function-name pick-a-bots-match-processor \
  --runtime nodejs20.x \
  --role arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/pick-a-bots-lambda-role \
  --handler index.handler \
  --zip-file fileb://lambda-function.zip \
  --timeout 60 \
  --memory-size 512 \
  --environment Variables="{
    NODE_ENV=production,
    DATABASE_URL_SECRET=pick-a-bots/database-url,
    CHALLONGE_API_KEY_SECRET=pick-a-bots/challonge-api-key
  }"
```

#### 3.4 Test Lambda Function

```bash
# Invoke function manually
aws lambda invoke \
  --function-name pick-a-bots-match-processor \
  --payload '{"test": true}' \
  response.json

# Check response
cat response.json

# View logs
aws logs tail /aws/lambda/pick-a-bots-match-processor --follow
```

#### 3.5 Setup EventBridge Trigger

```bash
# Create rule (triggers every 2 minutes)
aws events put-rule \
  --name pick-a-bots-match-processor-trigger \
  --schedule-expression "rate(2 minutes)" \
  --state ENABLED

# Add Lambda as target
aws events put-targets \
  --rule pick-a-bots-match-processor-trigger \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:$(aws sts get-caller-identity --query Account --output text):function:pick-a-bots-match-processor"

# Grant EventBridge permission to invoke Lambda
aws lambda add-permission \
  --function-name pick-a-bots-match-processor \
  --statement-id EventBridgeInvokePermission \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:us-east-1:$(aws sts get-caller-identity --query Account --output text):rule/pick-a-bots-match-processor-trigger
```

**Cost**: ~$1/month (well within free tier of 1M requests/month)

---

### 4. AWS Amplify Setup (Frontend + API)

**Purpose**: Host Next.js application (frontend + API routes)

**Time**: 20 minutes

**Steps**:

#### 4.1 Install Amplify CLI

```bash
npm install -g @aws-amplify/cli

# Configure Amplify CLI
amplify configure

# Follow prompts:
# - Region: us-east-1 (or your chosen region)
# - User name: amplify-cli-user
# - Complete IAM user setup in browser
# - Enter access key ID and secret
```

#### 4.2 Initialize Amplify Project

```bash
# Navigate to frontend folder
cd frontend

# Initialize Amplify
amplify init

# Answers:
# - Enter a name for the project: pickabots
# - Enter a name for the environment: dev
# - Choose your default editor: Visual Studio Code (or your editor)
# - Choose the type of app: javascript
# - Framework: react
# - Source directory path: src
# - Distribution directory path: .next
# - Build command: bun run build
# - Start command: bun run start
# - Use profile: default
```

#### 4.3 Configure Environment Variables

```bash
# Add environment variables
amplify env add

# Name: production
# Copy settings from dev

# Set environment variables via AWS Console:
# 1. Go to https://console.aws.amazon.com/amplify/
# 2. Click on your app
# 3. Click "Environment variables" (left sidebar)
# 4. Add variables:
```

Add these environment variables in Amplify Console:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-rds-endpoint.us-east-1.rds.amazonaws.com
DATABASE_URL_SECRET=pick-a-bots/database-url
JWT_SECRET_SECRET=pick-a-bots/jwt-secret
ACCESS_CODE_SECRET=pick-a-bots/access-code
WEBHOOK_SECRET_SECRET=pick-a-bots/webhook-secret
CHALLONGE_API_KEY_SECRET=pick-a-bots/challonge-api-key
```

#### 4.4 Connect Git Repository

```bash
# Add Amplify hosting
amplify add hosting

# Choose: "Hosting with Amplify Console"
# Choose: "Continuous deployment"
# Follow prompts to connect GitHub repository
```

**Or via AWS Console**:
1. Go to https://console.aws.amazon.com/amplify/
2. Click "New app" → "Host web app"
3. Choose GitHub
4. Authorize AWS Amplify
5. Select repository: `pick-a-bot-2025`
6. Select branch: `main`
7. Build settings auto-detected (Next.js)
8. Review and save
9. Click "Save and deploy"

#### 4.5 Configure Build Settings

Update `amplify.yml` in repository root:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - bun install
    build:
      commands:
        - bun run build
  artifacts:
    baseDirectory: frontend/.next
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

#### 4.6 Deploy

```bash
# Deploy via CLI
amplify publish

# Or push to main branch (auto-deploys)
git push origin main
```

**Wait 5-10 minutes** for deployment.

#### 4.7 Get App URL

```bash
# Get app URL
amplify status

# Or via AWS Console:
# Go to Amplify app → Click on app name → Copy URL
# Example: https://main.d1a2b3c4d5e6f7.amplifyapp.com
```

**Cost**: ~$10/month (1000 build minutes + hosting + data transfer)

---

## Deployment Automation

### Complete Deployment Script

Create `scripts/deploy-all.sh`:

```bash
#!/bin/bash
set -e  # Exit on error

echo "======================================"
echo "Pick-a-Bots AWS Deployment Script"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
  echo -e "${RED}Error: AWS CLI not configured. Run 'aws configure' first.${NC}"
  exit 1
fi

echo -e "${YELLOW}Step 1: Deploying database migrations...${NC}"
cd database
bun install
bun run db:push
bun run db:apply-policies
cd ..
echo -e "${GREEN}✓ Database migrations complete${NC}"

echo -e "${YELLOW}Step 2: Updating Lambda function...${NC}"
cd cron
bun install
bun build src/index.ts --target node --outdir dist
cd dist && zip -r ../lambda-function.zip . && cd ..
aws lambda update-function-code \
  --function-name pick-a-bots-match-processor \
  --zip-file fileb://lambda-function.zip
cd ..
echo -e "${GREEN}✓ Lambda function updated${NC}"

echo -e "${YELLOW}Step 3: Deploying frontend...${NC}"
cd frontend
git push origin main  # Triggers Amplify deployment
cd ..
echo -e "${GREEN}✓ Frontend deployment triggered${NC}"

echo ""
echo -e "${GREEN}======================================"
echo "Deployment complete!"
echo "=====================================${NC}"
echo ""
echo "Next steps:"
echo "1. Monitor Amplify deployment: https://console.aws.amazon.com/amplify/"
echo "2. Check Lambda logs: aws logs tail /aws/lambda/pick-a-bots-match-processor --follow"
echo "3. Test app: https://main.xxxxx.amplifyapp.com"
```

Make executable:
```bash
chmod +x scripts/deploy-all.sh
```

Run:
```bash
./scripts/deploy-all.sh
```

---

## Monitoring and Operations

### 1. CloudWatch Dashboards

Create custom dashboard:

1. Go to https://console.aws.amazon.com/cloudwatch/
2. Click "Dashboards" (left sidebar)
3. Click "Create dashboard"
4. Name: "Pick-a-Bots-Overview"
5. Add widgets:

**Lambda Metrics Widget**:
```
- Metric: AWS/Lambda → Invocations
- Function: pick-a-bots-match-processor
- Statistic: Sum
- Period: 5 minutes
```

**Lambda Errors Widget**:
```
- Metric: AWS/Lambda → Errors
- Function: pick-a-bots-match-processor
- Statistic: Sum
- Period: 5 minutes
```

**RDS Connections Widget**:
```
- Metric: AWS/RDS → DatabaseConnections
- DBInstanceIdentifier: pick-a-bots-db
- Statistic: Average
- Period: 5 minutes
```

**Amplify Requests Widget**:
```
- Metric: AWS/AmplifyHosting → Requests
- App: pickabots
- Statistic: Sum
- Period: 5 minutes
```

### 2. CloudWatch Alarms

Create alarm for Lambda errors:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name pick-a-bots-lambda-errors \
  --alarm-description "Alert when Lambda function errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=pick-a-bots-match-processor \
  --alarm-actions arn:aws:sns:us-east-1:$(aws sts get-caller-identity --query Account --output text):pick-a-bots-alerts
```

Create SNS topic for alerts:

```bash
# Create SNS topic
aws sns create-topic --name pick-a-bots-alerts

# Subscribe email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:$(aws sts get-caller-identity --query Account --output text):pick-a-bots-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Confirm subscription via email
```

### 3. Logging

View logs:

```bash
# Lambda logs
aws logs tail /aws/lambda/pick-a-bots-match-processor --follow

# Lambda errors only
aws logs tail /aws/lambda/pick-a-bots-match-processor --follow --filter-pattern "ERROR"

# RDS logs
aws rds download-db-log-file-portion \
  --db-instance-identifier pick-a-bots-db \
  --log-file-name error/postgresql.log.2024-12-02-12 \
  --output text
```

### 4. Performance Monitoring

Enable X-Ray tracing for Lambda:

```bash
aws lambda update-function-configuration \
  --function-name pick-a-bots-match-processor \
  --tracing-config Mode=Active
```

View traces:
1. Go to https://console.aws.amazon.com/xray/
2. Click "Traces"
3. Filter by function name

---

## Cost Management

### Monthly Cost Breakdown (400 Concurrent Users)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| **RDS** | db.t3.small, 20GB storage | $25 |
| **Amplify** | 1000 build minutes, 100GB transfer | $10 |
| **Lambda** | 21,600 invocations, 512MB, 5s avg | $1 |
| **CloudWatch** | 5GB logs, 50 metrics, 5 alarms | $5 |
| **Secrets Manager** | 5 secrets | $2 |
| **Data Transfer** | 100GB out | $9 |
| **EventBridge** | 21,600 events | Free |
| **Total** | | **$52/month** |

### Cost Optimization Tips

1. **Use Reserved Instances for RDS** (30-40% savings):
   ```bash
   # 1-year commitment
   aws rds purchase-reserved-db-instances-offering \
     --reserved-db-instances-offering-id xxxxx \
     --db-instance-count 1
   ```

2. **Enable S3 Lifecycle Policies** for logs:
   ```bash
   # Delete logs older than 30 days
   aws logs put-retention-policy \
     --log-group-name /aws/lambda/pick-a-bots-match-processor \
     --retention-in-days 30
   ```

3. **Use Lambda ARM architecture** (20% cheaper):
   ```bash
   aws lambda update-function-configuration \
     --function-name pick-a-bots-match-processor \
     --architectures arm64
   ```

4. **Monitor costs daily**:
   ```bash
   # Get current month costs
   aws ce get-cost-and-usage \
     --time-period Start=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
     --granularity MONTHLY \
     --metrics BlendedCost
   ```

### Cost Alerts

Set up billing alert:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name pick-a-bots-billing-alert \
  --alarm-description "Alert when monthly cost exceeds $75" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 75 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=Currency,Value=USD
```

---

## Scaling Beyond 400 Users

### 1,000 Users (~$90/month)

**Changes**:
- Upgrade RDS: `db.t3.small` → `db.t3.medium` (+$25/month)
- Increase Lambda memory: 512MB → 1024MB (+$5/month)

```bash
# Upgrade RDS
aws rds modify-db-instance \
  --db-instance-identifier pick-a-bots-db \
  --db-instance-class db.t3.medium \
  --apply-immediately

# Update Lambda
aws lambda update-function-configuration \
  --function-name pick-a-bots-match-processor \
  --memory-size 1024
```

### 5,000 Users (~$250/month)

**Changes**:
- Upgrade RDS: `db.m5.large` + Multi-AZ (+$150/month)
- Add ElastiCache Redis for caching (+$50/month)
- Enable Provisioned Concurrency for Lambda (+$15/month)

### 10,000+ Users (~$500/month)

**Changes**:
- Aurora Serverless v2 (auto-scaling)
- Multi-region deployment
- CloudFront CDN
- Application Load Balancer

**Contact AWS Solutions Architect** for architecture review at this scale.

---

## Troubleshooting

### Common Issues

#### Issue: "Access Denied" errors

**Solution**:
```bash
# Check IAM permissions
aws iam get-user
aws iam list-attached-user-policies --user-name pick-a-bots-admin

# Ensure AdministratorAccess is attached
```

#### Issue: RDS connection timeout

**Solution**:
```bash
# Check security group allows your IP
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Add your current IP
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 5432 \
  --cidr $(curl -s https://checkip.amazonaws.com)/32
```

#### Issue: Lambda function timing out

**Solution**:
```bash
# Increase timeout to 5 minutes
aws lambda update-function-configuration \
  --function-name pick-a-bots-match-processor \
  --timeout 300

# Increase memory (improves performance)
aws lambda update-function-configuration \
  --function-name pick-a-bots-match-processor \
  --memory-size 1024
```

#### Issue: Amplify build failing

**Solution**:
1. Check build logs in Amplify Console
2. Verify `amplify.yml` is correct
3. Check environment variables are set
4. Verify Node.js version matches local (20.x)

#### Issue: High costs

**Solution**:
```bash
# Check cost explorer
aws ce get-cost-and-usage \
  --time-period Start=2024-12-01,End=2024-12-31 \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=SERVICE

# Check for unexpected services
```

### Debug Commands

```bash
# Test database connection
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"user\";"

# Test Lambda function locally
cd cron
bun run src/index.ts

# View recent CloudWatch logs
aws logs tail /aws/lambda/pick-a-bots-match-processor --since 1h

# Check EventBridge rule
aws events describe-rule --name pick-a-bots-match-processor-trigger

# Test secret retrieval
aws secretsmanager get-secret-value --secret-id pick-a-bots/database-url

# Check Amplify deployment status
aws amplify get-app --app-id xxxxx
```

### Getting Help

1. **AWS Support** (if you have support plan):
   - https://console.aws.amazon.com/support/

2. **AWS Forums**:
   - https://forums.aws.amazon.com/

3. **Stack Overflow** (tag: amazon-web-services):
   - https://stackoverflow.com/questions/tagged/amazon-web-services

4. **AWS Documentation**:
   - RDS: https://docs.aws.amazon.com/rds/
   - Lambda: https://docs.aws.amazon.com/lambda/
   - Amplify: https://docs.amplify.aws/

---

## Comparison: Current vs AWS Architecture

| Aspect | Current (Multi-Platform) | AWS Architecture |
|--------|-------------------------|------------------|
| **Deployment Platforms** | 3 (Cloudflare Pages, Workers, Supabase) | 1 (AWS) |
| **Deploy Commands** | 3 separate: `bun run deploy` × 3 | 1: `./scripts/deploy-all.sh` |
| **Configuration Management** | 4 files: wrangler.toml, .env, .dev.vars, docker/.env | 1 file: .env (secrets in Secrets Manager) |
| **Secret Management** | Hardcoded in wrangler.toml (exposed!) | AWS Secrets Manager (encrypted) |
| **Monitoring** | 3 separate dashboards | 1 unified CloudWatch dashboard |
| **Logging** | console.log scattered across platforms | Centralized CloudWatch Logs |
| **Database Backups** | Supabase automatic (trust-based) | RDS automatic + manual verification |
| **Scalability** | Unknown (not tested) | Proven (handles millions of requests) |
| **Cold Starts** | ~50ms (Workers at edge) | ~200ms (Lambda in region) |
| **Monthly Cost (400 users)** | $30-50 | $50-100 |
| **Learning Curve** | High (3 platforms to learn) | Medium (1 platform, extensive docs) |
| **Career Value** | Niche (Cloudflare-specific skills) | High (AWS most in-demand cloud skill) |
| **Community Support** | Limited (smaller community) | Extensive (largest cloud community) |
| **Enterprise Adoption** | Growing | Industry standard |

### When to Stick with Current Architecture

Consider staying with Cloudflare + Supabase if:
- ✅ You're already comfortable with all three platforms
- ✅ Edge performance is critical (50ms cold starts vs 200ms)
- ✅ Budget is very tight ($20-30/month difference matters)
- ✅ You don't need unified monitoring/logging
- ✅ Team already has Cloudflare expertise

### When to Switch to AWS

Switch to AWS if:
- ✅ You're new to cloud platforms (better learning investment)
- ✅ Operational simplicity is important (1 platform vs 3)
- ✅ You want unified monitoring and logging
- ✅ Security is critical (Secrets Manager vs hardcoded secrets)
- ✅ You plan to scale beyond 400 users
- ✅ Team wants to learn AWS (better job prospects)
- ✅ You need enterprise-grade features (compliance, support)

---

## Conclusion

This guide provided step-by-step instructions for deploying Pick-a-Bots on AWS infrastructure. The architecture is optimized for:

- **Simplicity**: Single platform, unified deployment
- **Security**: Secrets Manager, VPC, IAM roles
- **Scalability**: Auto-scaling, proven for millions of users
- **Cost**: ~$50-100/month for 400 users
- **Operations**: CloudWatch monitoring, automated backups

### Next Steps

1. **Complete AWS setup** (follow sections 1-4)
2. **Deploy application** (use deployment script)
3. **Configure monitoring** (CloudWatch dashboards and alarms)
4. **Test with 10-20 users** before full launch
5. **Monitor costs** daily for first month
6. **Optimize** based on actual usage patterns

### Additional Resources

- **AWS Free Tier**: https://aws.amazon.com/free/
- **AWS Architecture Center**: https://aws.amazon.com/architecture/
- **AWS Well-Architected Framework**: https://aws.amazon.com/architecture/well-architected/
- **AWS Pricing Calculator**: https://calculator.aws/
- **AWS Training**: https://aws.amazon.com/training/ (free courses)

### Support

For questions or issues:
1. Check troubleshooting section
2. Review AWS documentation links
3. Ask on AWS forums
4. Contact AWS support (if you have a plan)

**Good luck with your deployment!** 🚀
