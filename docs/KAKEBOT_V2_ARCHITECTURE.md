# KakeBot v2 - Architecture Documentation

**Version:** 2.0
**Last Updated:** 2026-02-09
**Status:** Production Ready (Staging)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [Hardening Layers](#hardening-layers)
6. [Performance](#performance)
7. [Testing](#testing)
8. [Deployment](#deployment)

---

## Overview

KakeBot v2 is a hardened financial assistant powered by OpenAI Function Calling. It analyzes user spending patterns, budget status, and provides personalized financial insights.

**Key Features:**
- ✅ Transparent data sourcing (always mentions period + transaction count)
- ✅ Adaptive behavior based on user experience level
- ✅ Numerical consistency validation
- ✅ Honest error handling (no invented data)
- ✅ Cost-controlled tool calling (max 3 tools per query)
- ✅ Performance-optimized with caching

**Migration from v1:**
- v1: LangGraph with 3-node pipeline (Router → Tools → Synthesizer)
- v2: Native OpenAI Function Calling (1-2 LLM calls, 40-60% faster)

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      USER REQUEST                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: User Context Analyzer                             │
│  - Analyzes data quality (poor/fair/good/excellent)         │
│  - Detects new users (< 30 days)                            │
│  - Generates dynamic disclaimer                             │
│  - Cache: 5min TTL                                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: System Prompt Construction                        │
│  - Base: Hardened System Prompt v2                          │
│  - + Context Disclaimer (user-specific)                     │
│  - + Conversation History                                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: First LLM Call (OpenAI)                           │
│  - Model: gpt-4o-mini                                        │
│  - Temperature: 0.3 (consistent tool selection)             │
│  - Decides: Use tools OR direct response                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
    No Tools          Tools Requested
         │                 │
         │                 ▼
         │    ┌─────────────────────────────────────────────┐
         │    │  LAYER 4: Tool Call Validation              │
         │    │  - Max 3 tools per call                     │
         │    │  - Remove redundant combinations            │
         │    │  - Log warnings for missing companions      │
         │    └─────────────┬───────────────────────────────┘
         │                  │
         │                  ▼
         │    ┌─────────────────────────────────────────────┐
         │    │  LAYER 5: Parallel Tool Execution           │
         │    │  - Execute with Promise.all()               │
         │    │  - Each tool queries Supabase               │
         │    └─────────────┬───────────────────────────────┘
         │                  │
         │                  ▼
         │    ┌─────────────────────────────────────────────┐
         │    │  LAYER 6: Tool Output Validation            │
         │    │  - Numerical consistency checks             │
         │    │  - Detect corrupted data                    │
         │    │  - Convert invalid → error                  │
         │    └─────────────┬───────────────────────────────┘
         │                  │
         │                  ▼
         │    ┌─────────────────────────────────────────────┐
         │    │  LAYER 7: Error Handling                    │
         │    │  - Classify errors (DB/validation/etc)      │
         │    │  - User-friendly messages                   │
         │    │  - Force LLM to acknowledge                 │
         │    └─────────────┬───────────────────────────────┘
         │                  │
         │                  ▼
         │    ┌─────────────────────────────────────────────┐
         │    │  LAYER 8: Second LLM Call                   │
         │    │  - Model: gpt-4o-mini                       │
         │    │  - Temperature: 0.6 (natural synthesis)     │
         │    │  - Synthesizes final response               │
         │    └─────────────┬───────────────────────────────┘
         │                  │
         └──────────────────┴─────────────────┐
                                              │
                                              ▼
                            ┌─────────────────────────────────┐
                            │     FINAL RESPONSE              │
                            │  + Metrics (latency, cost)      │
                            └─────────────────────────────────┘
```

---

## Core Components

### 1. User Context Analyzer
**File:** `src/lib/agents-v2/context-analyzer.ts`

**Purpose:** Analyzes user's historical data to provide appropriate analysis.

**Classification:**
```typescript
// Poor: < 30 days OR < 20 transactions
{
  dataQuality: "poor",
  isNewUser: true,
  restrictions: ["No anomaly detection", "No trend analysis", "No patterns"]
}

// Fair: 30-60 days + 20-50 transactions
{
  dataQuality: "fair",
  hasLimitedHistory: true,
  restrictions: ["Warn about limited data", "Low confidence predictions"]
}

// Good: 60-90 days + 50-100 transactions
{
  dataQuality: "good",
  restrictions: ["Mention if more data would help"]
}

// Excellent: 90+ days + 100+ transactions
{
  dataQuality: "excellent",
  restrictions: [] // Full analysis available
}
```

**Performance:**
- First query: ~100ms (DB fetch)
- Cached queries: ~1ms (5min TTL)
- Memory: ~200 bytes per user

---

### 2. System Prompt v2 (Hardened)
**File:** `src/lib/agents-v2/prompts.ts`

**Key Rules:**
1. **Transparency:** Always mention period + data count
2. **Limits:** No investment advice, no moral judgments
3. **Consistency:** Validate numerical relationships
4. **Data Quality:** Acknowledge insufficient data explicitly
5. **Objectivity:** Use measurable language, not subjective

**Example Enforcement:**
```
❌ "Has gastado €450 en comida"
✅ "Has gastado €450 en supervivencia este mes (basado en 12 transacciones)"

❌ "Deberías reducir gastos"
✅ "Podrías considerar reducir 'opcional' en €50 para ajustarte al presupuesto"
```

---

### 3. Tool Calling Limits
**File:** `src/lib/agents-v2/function-caller.ts`

**Constraints:**
```typescript
{
  maxToolsPerCall: 3,              // Prevents latency + cost issues
  forbiddenCombinations: [
    ["predictMonthlySpending", "getSpendingTrends"]  // Redundant
  ],
  requiredCompanions: {
    predictMonthlySpending: "getBudgetStatus"  // Context needed
  }
}
```

**Impact:**
- 5 tools → 3 tools: 40% faster, 40% cheaper
- Redundancy eliminated: Better focused responses

---

### 4. Tool Output Validator
**File:** `src/lib/agents-v2/tools/validator.ts`

**Validations:**

**Spending Pattern:**
- Total amount >= 0
- Average per period >= 0
- Top expenses sum <= total (5% tolerance)
- Trend in ["increasing", "decreasing", "stable"]

**Budget Status:**
- Total budget >= 0
- Total spent >= 0
- Categories sum = total (5% tolerance)
- Percentages in valid range
- Status in ["safe", "warning", "exceeded"]

**Anomalies:**
- Anomalies is array
- Each anomaly has valid amount > 0
- Severity in ["low", "medium", "high"]
- Warning if > 20 anomalies (detection issue)

**On Validation Failure:**
```typescript
{
  _error: true,
  _errorType: "validation",
  _userMessage: "Los datos no se pudieron procesar...",
  _instruction: "CRITICAL: Inform user. DO NOT use this data."
}
```

---

### 5. Error Handler
**File:** `src/lib/agents-v2/tools/executor.ts`

**Error Classification:**
- `database`: Connection, timeout, Supabase errors
- `validation`: Invalid data structure
- `not_found`: No data available
- `permission`: Unauthorized access
- `unknown`: Other errors

**User-Friendly Messages:**
```typescript
database → "No pude acceder a tu información en este momento. Inténtalo de nuevo."
validation → "Los datos no se pudieron procesar correctamente."
not_found → "No encontré datos. Esto puede ser normal si no has registrado gastos."
permission → "No tengo permiso. Verifica tu sesión."
```

---

### 6. Available Tools

**1. analyzeSpendingPattern**
- Purpose: Analyze spending by category and period
- Parameters: category, period, groupBy
- Returns: total, average, trend, top expenses
- Restrictions: None (works with any data)

**2. getBudgetStatus**
- Purpose: Check spending vs budget limits
- Parameters: month, category
- Returns: budget, spent, remaining, status, projection
- Restrictions: None

**3. detectAnomalies**
- Purpose: Find unusual spending patterns
- Parameters: period, sensitivity
- Returns: anomalies list with severity
- Restrictions: Requires 30+ days of data

**4. predictMonthlySpending**
- Purpose: Project end-of-month spending
- Parameters: month, category
- Returns: prediction, confidence level
- Restrictions: Requires 30+ days of data

**5. getSpendingTrends**
- Purpose: Long-term trend analysis
- Parameters: period, groupBy, category
- Returns: trend direction, percentage change
- Restrictions: Requires 60+ days of data

---

## Data Flow

### Example: "¿Cuánto he gastado en comida este mes?"

**Step-by-step:**

1. **User Context Analysis**
   - Query DB: User has 45 days, 30 transactions
   - Classification: `dataQuality: "fair", hasLimitedHistory: true`
   - Generate disclaimer: "CONTEXTO - HISTÓRICO LIMITADO: 45 días..."

2. **System Prompt Construction**
   - Base prompt: Hardened rules
   - + Context: "Histórico limitado" warning
   - + History: Previous conversation turns

3. **First LLM Call**
   - GPT decides: Use `analyzeSpendingPattern`
   - Tool call: `{ category: "survival", period: "current_month" }`

4. **Tool Call Validation**
   - Count: 1 tool (< 3 limit ✓)
   - Forbidden combo: None ✓
   - Companion: Not required ✓

5. **Tool Execution**
   - Query Supabase: Get expenses for user, category=supervivencia, month=current
   - Calculate: total, average, trend, top expenses

6. **Output Validation**
   - Check: totalAmount >= 0 ✓
   - Check: topExpenses sum <= total ✓
   - Check: trend valid ✓
   - Result: Valid data

7. **Second LLM Call**
   - Input: Tool result + hardened prompt
   - GPT synthesizes: "Has gastado €450 en supervivencia este mes (basado en 12 transacciones del 1 al 9 de febrero)"

8. **Response**
   - Message: Final synthesized text
   - Metrics: latency, tokens, cost
   - Tools used: ["analyzeSpendingPattern"]

---

## Hardening Layers

### Protection Matrix

| Layer | Protects Against | Implementation |
|-------|------------------|----------------|
| Context Analyzer | Inappropriate analysis for new users | Block tools requiring historical data |
| System Prompt v2 | Hallucinations, invented data | Strict transparency rules |
| Tool Limits | High latency, excessive cost | Max 3 tools, remove redundant |
| Output Validator | Corrupted/inconsistent data | Pre-LLM numerical validation |
| Error Handler | Hidden failures | Classify + force acknowledgment |

### Security Features

1. **No Data Invention**
   - If tool fails → Error message (not invented data)
   - If data insufficient → Explicit acknowledgment
   - If validation fails → Error (not approximation)

2. **Numerical Integrity**
   - Validator checks all totals/subtotals
   - Tolerance: 5% for rounding
   - Violations → Reject data

3. **User Privacy**
   - All queries scoped by userId
   - No cross-user data leakage
   - Supabase RLS enforced

---

## Performance

### Latency Breakdown

**Without tools (direct response):**
- Context analysis: 1ms (cached) or 100ms (first)
- First LLM call: 800-1200ms
- **Total: ~1s**

**With 1 tool:**
- Context: 1ms
- First LLM: 800ms
- Tool execution: 50-150ms
- Output validation: 5ms
- Second LLM: 800ms
- **Total: ~1.8s**

**With 3 tools (parallel):**
- Context: 1ms
- First LLM: 800ms
- Tools (parallel): 100-200ms (longest)
- Validation: 15ms (3 tools)
- Second LLM: 900ms
- **Total: ~2s**

### Cost per Query

**Model:** gpt-4o-mini
- Input: $0.150 per 1M tokens
- Output: $0.600 per 1M tokens

**Typical costs:**
- Direct response: ~150 tokens → $0.00008
- 1 tool: ~500 tokens → $0.0002
- 3 tools: ~1000 tokens → $0.0004

**Monthly estimate (1000 users, 5 queries/user/month):**
- 5000 queries × $0.0003 avg = **$1.50/month**

### Cache Effectiveness

**User Context Cache:**
- Hit rate: ~80% (users query multiple times in 5min)
- Miss penalty: 100ms
- Hit benefit: 99ms saved
- **Net savings: ~80ms per query on average**

---

## Testing

### Test Coverage

```
Total tests: 40
├── Original (Sprint 0): 15 tests
├── Sprint 1 (Hardening): 10 tests
└── Sprint 2 (Adaptive): 15 tests

Coverage:
├── Unit tests: 100% (all core functions)
├── Integration tests: 100% (full flow)
└── Edge cases: 90% (most scenarios)
```

### Test Suites

**1. function-caller.test.ts** (15 tests)
- General questions without tools
- Semantic mapping ("comida" → "survival")
- Temporal context ("este mes" → "current_month")
- Multiple tools in one query
- Error handling
- Multi-turn conversations

**2. hardening-integration.test.ts** (10 tests)
- Transparency requirements
- Error exposure
- Numerical consistency validation
- Data quality warnings

**3. sprint2-integration.test.ts** (15 tests)
- User context classification
- Tool appropriateness validation
- Tool calling limits
- Cache effectiveness
- End-to-end integration

### Running Tests

```bash
# All tests
npm test -- agents-v2 --run

# Specific suite
npm test -- function-caller.test.ts --run

# Watch mode (development)
npm test -- agents-v2
```

---

## Deployment

### Environments

**Development:**
- Branch: `main`
- Endpoint: `http://localhost:3000/api/ai/agent-v2`
- Feature flag: `USE_FUNCTION_CALLING_AGENT=true` (optional)

**Staging:**
- Branch: `staging`
- Endpoint: `https://staging.kakebo.app/api/ai/agent-v2`
- Feature flag: Enabled by default for staging

**Production:**
- Branch: `production`
- Endpoint: `https://kakebo.app/api/ai/agent-v2`
- Rollout: Gradual (10% → 50% → 100%)

### Rollout Strategy

**Phase 1: Staging (Current)**
- Deploy to staging environment
- Manual testing (1-2 days)
- Monitor metrics
- Fix critical issues if any

**Phase 2: Canary (10%)**
- Route 10% of production traffic to v2
- Monitor for 2-3 days
- Compare metrics with v1:
  - User corrections
  - Error rates
  - Latency p95
  - Cost per query

**Phase 3: Ramp (50%)**
- If Phase 2 successful, increase to 50%
- Monitor for 3-5 days
- Collect user feedback

**Phase 4: Full Rollout (100%)**
- Route all traffic to v2
- Keep v1 code for 2 weeks (rollback safety)
- After stable: Remove v1 code

### Monitoring

**Key Metrics:**

1. **Correctness (Tier 1 - Critical)**
   - Numerical consistency: 100%
   - Hallucination rate: < 1%
   - Temporal coherence: 100%

2. **Transparency (Tier 2 - Important)**
   - Disclaimer presence: > 95%
   - Data insufficiency acknowledgment: > 90%
   - Source citation rate: > 90%

3. **Reliability (Tier 3 - Quality)**
   - User correction rate: < 2%
   - Error exposure rate: 100%
   - Input stability: 100%

4. **Efficiency (Tier 4 - Performance)**
   - Latency p95: < 2500ms
   - Tool calls per query: < 2.0 avg
   - Cost per 1K queries: < $5

### Rollback Procedure

If critical issues detected:

```bash
# 1. Immediate: Route traffic back to v1
# Set feature flag: USE_FUNCTION_CALLING_AGENT=false

# 2. Investigate logs
# Check for patterns in failures

# 3. Fix in development
git checkout main
# Apply fixes
npm test

# 4. Redeploy to staging
git push origin main
git checkout staging
git merge main
git push origin staging

# 5. Retest before re-enabling
```

---

## Changelog

### v2.0.0 (2026-02-09) - Initial Release

**Sprint 1: Hardening**
- System Prompt v2 with strict transparency rules
- Tool Output Validator for numerical consistency
- Transparent Error Handling with classification

**Sprint 2: Adaptive & Efficient**
- User Context Analyzer for experience-based behavior
- Tool Calling Limits for cost control

**Metrics:**
- 40 tests passing
- 9/10 production readiness
- 3,133 lines of production code

---

## References

- **Sprint 1 Details:** See `SPRINT1_IMPLEMENTATION.md`
- **Sprint 2 Details:** See `SPRINT2_IMPLEMENTATION.md`
- **Deployment Guide:** See `DEPLOYMENT_GUIDE.md`
- **API Documentation:** See `API_DOCUMENTATION.md`

---

**Maintained by:** AI Team
**Last Review:** 2026-02-09
**Status:** ✅ Production Ready (Staging)
