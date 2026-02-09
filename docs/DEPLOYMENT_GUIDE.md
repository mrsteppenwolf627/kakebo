# KakeBot v2 - Deployment Guide

**Version:** 2.0
**Last Updated:** 2026-02-09

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Staging Deployment](#staging-deployment)
5. [Production Deployment](#production-deployment)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Git:** Latest version

### Required Accounts

- **OpenAI API:** Account with API key
- **Supabase:** Project with database configured
- **Deployment Platform:** Vercel, AWS, or similar

### Environment Variables

Create `.env.local` file with:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...                    # Your OpenAI API key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://...     # Your Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...        # Public anon key
SUPABASE_SERVICE_ROLE_KEY=...            # Service role key (server-side only)

# Feature Flags
USE_FUNCTION_CALLING_AGENT=true          # Enable v2 (optional if using /agent-v2 endpoint)

# Optional: Logging
LOG_LEVEL=info                           # debug | info | warn | error
```

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/kakebo.git
cd kakebo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your credentials
nano .env.local
```

### 4. Verify Database Schema

Ensure Supabase has the correct schema:

```sql
-- Required tables
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL, -- 'survival', 'optional', 'culture', 'extra'
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  month DATE NOT NULL,
  category TEXT NOT NULL,
  limit_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX idx_expenses_user_category ON expenses(user_id, category);
CREATE INDEX idx_budgets_user_month ON budgets(user_id, month);
```

---

## Local Development

### 1. Start Development Server

```bash
npm run dev
```

Server runs on: `http://localhost:3000`

### 2. Test API Endpoint

**Option A: Use dedicated v2 endpoint (recommended)**
```bash
curl -X POST http://localhost:3000/api/ai/agent-v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "message": "¿Cuánto he gastado este mes?",
    "history": []
  }'
```

**Option B: Use main endpoint with feature flag**
```bash
# In .env.local: USE_FUNCTION_CALLING_AGENT=true

curl -X POST http://localhost:3000/api/ai/agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{
    "message": "¿Cuánto he gastado este mes?",
    "history": []
  }'
```

### 3. Run Tests

```bash
# All tests
npm test -- agents-v2 --run

# Specific test suite
npm test -- function-caller.test.ts --run

# Watch mode (development)
npm test -- agents-v2
```

Expected result: **40/40 tests passing**

### 4. Build Check

```bash
npm run build
```

Ensure no TypeScript errors or build failures.

---

## Staging Deployment

### Step 1: Prepare Staging Branch

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Create or update staging branch
git checkout staging || git checkout -b staging
git merge main
```

### Step 2: Run Pre-Deployment Checks

```bash
# 1. All tests pass
npm test -- agents-v2 --run

# 2. Build succeeds
npm run build

# 3. No linting errors
npm run lint
```

### Step 3: Push to Staging

```bash
git push origin staging
```

### Step 4: Deploy to Staging Platform

**For Vercel:**
```bash
vercel --prod --scope staging
```

**For Manual Deployment:**
```bash
# Build production bundle
npm run build

# Deploy to your staging server
# (specific commands depend on your hosting)
```

### Step 5: Verify Staging Deployment

```bash
# Test health endpoint
curl https://staging.kakebo.app/api/health

# Test agent endpoint
curl -X POST https://staging.kakebo.app/api/ai/agent-v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -d '{"message": "Prueba de staging", "history": []}'
```

### Step 6: Manual Testing

**Test Cases:**

1. **New User Flow**
   - Create test user with 0 expenses
   - Ask: "¿Cuánto he gastado?"
   - Expect: Acknowledgment of no data

2. **Semantic Mapping**
   - Ask: "¿Cuánto he gastado en comida este mes?"
   - Verify: Calls `analyzeSpendingPattern` with `category: "survival"`

3. **Multiple Tools**
   - Ask: "¿Cómo va mi presupuesto y hay gastos raros?"
   - Verify: Calls both `getBudgetStatus` AND `detectAnomalies`

4. **Error Handling**
   - Temporarily disable database connection
   - Ask any question
   - Expect: User-friendly error message (no crash)

5. **Transparency**
   - Ask: "¿Cuánto he gastado en ocio?"
   - Verify: Response mentions period and transaction count

### Step 7: Monitor Metrics

Monitor for 1-2 days:

- **Latency:** p95 < 2.5s
- **Error Rate:** < 1%
- **User Corrections:** < 2%
- **Cost per Query:** ~$0.0003

---

## Production Deployment

### Phase 1: Canary (10%)

**Goal:** Route 10% of traffic to v2, monitor for issues.

#### Step 1: Enable Feature Flag for 10%

**Option A: Environment Variable (Simple)**
```bash
# On production servers, set:
USE_FUNCTION_CALLING_AGENT=true
CANARY_PERCENTAGE=10  # Custom implementation needed
```

**Option B: A/B Testing (Advanced)**
```typescript
// In route handler
const useV2 = Math.random() < 0.10; // 10% canary
const endpoint = useV2 ? processFunctionCalling : processLangGraph;
```

#### Step 2: Monitor for 2-3 Days

Watch for:
- Error rate increases
- Latency regressions
- User complaints
- Cost anomalies

**Rollback Criteria:**
- Error rate > 2%
- Latency p95 > 3s
- User correction rate > 5%

---

### Phase 2: Ramp (50%)

If Phase 1 successful:

```bash
# Increase to 50%
CANARY_PERCENTAGE=50
```

Monitor for 3-5 days with same criteria.

---

### Phase 3: Full Rollout (100%)

If Phase 2 successful:

```bash
# Route all traffic to v2
USE_FUNCTION_CALLING_AGENT=true
# OR
CANARY_PERCENTAGE=100
```

---

### Phase 4: Cleanup (After 2 Weeks Stable)

Remove v1 code:

```bash
git checkout main

# Remove v1 files
rm -rf src/lib/agents/nodes/

# Commit cleanup
git add -A
git commit -m "cleanup: remove LangGraph v1 code after successful v2 rollout"
git push origin main
```

---

## Rollback Procedures

### Immediate Rollback (< 5 minutes)

If critical issue detected in production:

```bash
# 1. Disable feature flag
# On production servers:
USE_FUNCTION_CALLING_AGENT=false

# OR set canary to 0%:
CANARY_PERCENTAGE=0
```

**No code deployment needed.** Traffic immediately routes back to v1.

---

### Standard Rollback (< 30 minutes)

If feature flag not available:

```bash
# 1. Checkout previous stable version
git checkout production
git revert HEAD  # If last commit broke it
# OR
git reset --hard <LAST_GOOD_COMMIT>

# 2. Force push (only if necessary)
git push origin production --force

# 3. Redeploy
vercel --prod
```

---

### Post-Rollback Actions

1. **Notify team** via Slack/Discord
2. **Capture logs** from failed period
3. **Create incident report**
4. **Fix in development**
5. **Retest in staging**
6. **Schedule re-deployment**

---

## Monitoring

### Key Metrics to Track

**1. Correctness (Critical)**
```typescript
// Log after each query
{
  numericalConsistency: true,    // Validator passed
  hallucinationDetected: false,  // No invented data
  temporalCoherence: true        // Dates/periods correct
}
```

**2. Transparency (Important)**
```typescript
// Check response contains:
{
  periodMentioned: true,         // "este mes"
  dataCountMentioned: true,      // "basado en 12 transacciones"
  sourceCited: true              // Tool used acknowledged
}
```

**3. Performance (Quality)**
```typescript
// Track per query
{
  latencyMs: 1850,
  toolCallsUsed: 2,
  costUsd: 0.00032
}
```

**4. Errors (Critical)**
```typescript
// Error rates
{
  databaseErrors: 0.1%,          // Target: < 0.5%
  validationErrors: 0.05%,       // Target: < 0.1%
  unknownErrors: 0.2%            // Target: < 0.5%
}
```

### Alerting Thresholds

Set up alerts for:

- **Error rate > 2%** → Page on-call engineer
- **Latency p95 > 3s** → Warning notification
- **Cost per 1K queries > $5** → Budget alert
- **User corrections > 5%** → Quality alert

---

## Troubleshooting

### Issue: High Latency

**Symptoms:** p95 > 3s

**Diagnosis:**
```bash
# Check logs for slow queries
grep "latencyMs" logs.json | jq 'select(.latencyMs > 3000)'

# Check tool execution times
grep "Tool execution completed" logs.json | jq '.totalExecutionTime'
```

**Solutions:**
1. Check database indexes exist
2. Verify cache hit rate (should be ~80%)
3. Check OpenAI API status
4. Reduce max tools limit to 2

---

### Issue: High Error Rate

**Symptoms:** Errors > 2%

**Diagnosis:**
```bash
# Check error types
grep "_errorType" logs.json | jq -r '._errorType' | sort | uniq -c

# Most common errors
grep "error" logs.json | jq -r '.error.message' | sort | uniq -c | head
```

**Solutions:**
- `database` errors → Check Supabase connection pool
- `validation` errors → Check tool output format changes
- `not_found` errors → Normal for new users
- `permission` errors → Check RLS policies

---

### Issue: User Reports Incorrect Data

**Symptoms:** User says "this is wrong"

**Diagnosis:**
```bash
# Find user's query logs
grep "userId: USER_ID" logs.json | jq '.'

# Check tool results
grep "Tool execution completed" logs.json | jq '.logs'
```

**Solutions:**
1. Check if validation failed (should have blocked bad data)
2. Check if LLM misinterpreted tool output
3. Check if user's database has corrupt data
4. Add test case to prevent regression

---

### Issue: High Costs

**Symptoms:** Cost per 1K queries > $5

**Diagnosis:**
```bash
# Check average tokens per query
grep "totalTokens" logs.json | jq '.totalTokens' | awk '{sum+=$1; count++} END {print sum/count}'

# Check tool calling frequency
grep "toolCalls" logs.json | jq '.toolCalls' | awk '{sum+=$1; count++} END {print sum/count}'
```

**Solutions:**
1. Reduce max tools from 3 to 2
2. Lower temperature to 0.2 (more deterministic)
3. Implement response caching for common queries
4. Consider switching to `gpt-3.5-turbo` for simple queries

---

### Issue: Cache Not Working

**Symptoms:** Context cache hit rate < 50%

**Diagnosis:**
```bash
# Check cache hits/misses
grep "User context cache" logs.json | jq -r '.message' | sort | uniq -c
```

**Solutions:**
1. Increase TTL from 5min to 10min
2. Check if cache is being cleared too often
3. Consider using Redis instead of in-memory cache

---

## Emergency Contacts

**On-Call Engineer:** [Phone/Email]
**DevOps Lead:** [Phone/Email]
**Product Owner:** [Phone/Email]

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (40/40)
- [ ] Build successful
- [ ] No linting errors
- [ ] Environment variables configured
- [ ] Database schema up to date
- [ ] Backup created

### Deployment

- [ ] Code pushed to branch
- [ ] CI/CD pipeline passed
- [ ] Health check successful
- [ ] Manual smoke tests completed
- [ ] Monitoring dashboard active

### Post-Deployment

- [ ] Metrics baseline recorded
- [ ] Alerts configured
- [ ] Team notified
- [ ] Documentation updated
- [ ] Rollback plan ready

---

**Last Updated:** 2026-02-09
**Maintained By:** AI Team
**Status:** ✅ Production Ready
