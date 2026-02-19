# Merchant Map & Learned Rules (P1-1)

**Status**: ✅ Completed (2026-02-19)
**Tests**: 59 passing
**Priority**: P1 (High ROI improvement)

## Overview

This feature implements a **feedback loop** where the agent learns from user corrections to improve transaction categorization accuracy over time. When users correct a category, the system extracts the merchant name and saves it as a rule for future use.

### Key Benefits

- **Improved Accuracy**: Learns from user corrections to classify similar transactions correctly
- **Reduced Latency**: Uses learned rules instead of GPT for known merchants (when integrated)
- **User-Specific Learning**: Prioritizes individual user preferences over global patterns
- **Global Consensus**: Builds shared knowledge from multiple users (opt-in)

---

## Architecture

### Components

```
src/lib/agents/tools/utils/
├── merchant-extractor.ts       # Extracts merchant names from concepts
├── category-suggester.ts       # Suggests categories from learned rules
├── learn-from-correction.ts    # Saves rules when users correct categories
└── category-preprocessor.ts    # Helper for GPT prompt enhancement (future)

src/migrations/
└── 001_merchant_rules.sql      # Database schema for merchant_rules table
```

### Database Schema

**Table**: `public.merchant_rules`

| Column        | Type   | Description                                         |
| ------------- | ------ | --------------------------------------------------- |
| id            | UUID   | Primary key                                         |
| user_id       | UUID   | User ID (nullable for global rules)                 |
| merchant      | TEXT   | Normalized merchant name (e.g., "mercadona")        |
| category      | TEXT   | Spanish category: supervivencia, opcional, cultura  |
| confidence    | FLOAT  | Confidence score (1.0 = user rule, <1.0 = inferred) |
| vote_count    | INT    | Consensus votes for global rules                    |
| created_at    | TIMESTAMP | Creation timestamp                               |
| updated_at    | TIMESTAMP | Last update timestamp                            |

**Unique Constraint**: `(user_id, merchant)` - one rule per merchant per user

### Helper Functions (SQL)

1. **`upsert_merchant_rule(user_id, merchant, category, confidence)`**
   - Creates or updates a merchant rule
   - Increments vote_count on update

2. **`get_merchant_rule(user_id, merchant)`**
   - Gets merchant rule with priority: user-specific > global (min 3 votes)
   - Returns: category, confidence, source

3. **`increment_global_rule_vote(merchant, category)`**
   - Increments vote count for global rule
   - Creates rule if it doesn't exist

---

## How It Works

### 1. Merchant Extraction

When a transaction concept is provided (e.g., "Mercadona compra semanal"), the system extracts the merchant name:

```typescript
import { extractMerchant } from "@/lib/agents/tools/utils/merchant-extractor";

const merchant = extractMerchant("Mercadona compra semanal");
// → "mercadona"
```

**Extraction Strategy**:
1. Check against 30+ known merchant patterns (Mercadona, Netflix, Uber, etc.)
2. If no match, extract first significant word (≥4 chars)
3. Normalize to lowercase and trim

**Confidence Scoring**:
- Known pattern match: 1.0
- Long merchant name (≥6 chars): 0.8
- Medium merchant name (4-5 chars): 0.7
- Short merchant name (<4 chars): 0.6

### 2. Category Suggestion

Before GPT classification, check if a learned rule exists:

```typescript
import { suggestCategory } from "@/lib/agents/tools/utils/category-suggester";

const suggestion = await suggestCategory(
  supabase,
  userId,
  "Mercadona compra semanal"
);

if (suggestion) {
  console.log(suggestion.category);       // "supervivencia"
  console.log(suggestion.confidence);     // 1.0
  console.log(suggestion.source);         // "user_rule" or "global_rule"
  console.log(suggestion.merchant);       // "mercadona"
}
```

**Priority System**:
- User-specific rules (confidence = 1.0) → Always used
- Global rules (confidence = 0.8) → Used if ≥3 votes and confidence ≥0.7
- No rule found → Fall back to GPT classification

### 3. Learning from Corrections

When a user corrects a transaction category, the system learns:

```typescript
import { learnFromCorrection } from "@/lib/agents/tools/utils/learn-from-correction";

// User changed category from "opcional" to "supervivencia"
const result = await learnFromCorrection(
  supabase,
  userId,
  "Mercadona compra semanal",
  "opcional",      // Old category
  "supervivencia"  // New category (user correction)
);

console.log(result.merchant);           // "mercadona"
console.log(result.ruleCreated);        // true (first time)
console.log(result.ruleUpdated);        // false
console.log(result.message);            // "✅ Regla aprendida: mercadona → supervivencia"
```

**What Happens**:
1. Merchant is extracted from concept
2. User-specific rule is created/updated (confidence = 1.0)
3. If correction matches global consensus, global vote is incremented
4. Future transactions with this merchant will use the learned category

---

## Integration Status

### ✅ Completed

- [x] Database migration created (`001_merchant_rules.sql`)
- [x] Merchant extraction implemented (30+ known merchants)
- [x] Category suggestion implemented (user > global priority)
- [x] Learning from corrections implemented
- [x] Integrated into `update-transaction.ts` (learns when category is corrected)
- [x] 59 unit tests passing

### 🔄 Pending Integration

These utilities are **ready to use** but not yet integrated into the main agent flow:

1. **Pre-GPT Category Suggestion** (Future Task)
   - Modify `function-caller.ts` to check learned rules before calling GPT
   - Use `category-suggester.ts` to get suggestions
   - If high-confidence rule exists, skip GPT classification

2. **GPT Prompt Enhancement** (Optional)
   - Use `category-preprocessor.ts` to add learned rules to GPT system prompt
   - GPT can use suggestions as hints while still being able to override

3. **Batch Learning** (Optional)
   - Use `learnFromCorrectionsBatch()` for historical data analysis
   - Analyze past corrections to seed initial rules

---

## How to Apply Migration

### Option 1: Using Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `src/migrations/001_merchant_rules.sql`
3. Paste and run the SQL script
4. Verify: Check if `merchant_rules` table exists in Database > Tables

### Option 2: Using Supabase CLI

```bash
# If using Supabase CLI migrations
supabase migration new merchant_rules
# Copy contents of 001_merchant_rules.sql to the new migration file
supabase db push
```

### Option 3: Using psql

```bash
psql -h <supabase-host> -U postgres -d postgres -f src/migrations/001_merchant_rules.sql
```

---

## Testing

All utilities have comprehensive test coverage:

```bash
# Run all P1-1 tests (59 tests)
npm test -- merchant-extractor.test.ts category-suggester.test.ts learn-from-correction.test.ts

# Run specific test suite
npm test -- merchant-extractor.test.ts
npm test -- category-suggester.test.ts
npm test -- learn-from-correction.test.ts
```

### Test Coverage

- **merchant-extractor.test.ts**: 34 tests
  - Known pattern matching (supermarkets, streaming, transport, etc.)
  - Fallback heuristics (first significant word)
  - Edge cases (short concepts, whitespace, currency symbols)

- **category-suggester.test.ts**: 14 tests
  - User-specific rule priority
  - Global rule fallback
  - Batch suggestion
  - Confidence thresholds

- **learn-from-correction.test.ts**: 11 tests
  - Rule creation and updates
  - Global vote increments
  - Error handling
  - Batch learning

---

## Usage Examples

### Example 1: Check for Learned Rule Before GPT

```typescript
import { suggestCategory, shouldUseSuggestion } from "@/lib/agents/tools/utils/category-suggester";

async function classifyTransaction(concept: string) {
  // Try learned rules first
  const suggestion = await suggestCategory(supabase, userId, concept);

  if (shouldUseSuggestion(suggestion, 0.7)) {
    // Use learned rule (high confidence)
    return suggestion.category;
  }

  // Fall back to GPT classification
  const gptCategory = await classifyWithGPT(concept);
  return gptCategory;
}
```

### Example 2: Learn from User Correction

```typescript
// This is ALREADY integrated in update-transaction.ts
// When user updates category, it automatically learns

import { learnFromCorrection } from "@/lib/agents/tools/utils/learn-from-correction";

// In update-transaction.ts (already implemented)
if (params.category !== undefined && existing.category) {
  const result = await learnFromCorrection(
    supabase,
    userId,
    existing.note,      // Transaction concept
    existing.category,  // Old category
    newCategory        // User's correction
  );

  if (result.success && result.merchant) {
    console.log(`Learned: ${result.merchant} → ${newCategory}`);
  }
}
```

### Example 3: Get Learning Statistics

```typescript
import { getLearningStats } from "@/lib/agents/tools/utils/learn-from-correction";

const stats = await getLearningStats(supabase, userId);

console.log(`You've taught me ${stats.totalRules} rules!`);
console.log(`Survival: ${stats.rulesByCategory.supervivencia} rules`);
console.log(`Optional: ${stats.rulesByCategory.opcional} rules`);
console.log(`Top merchants:`, stats.topMerchants.map(m => m.merchant));
```

---

## Seed Data

The migration includes seed data for 17 common merchants:

**Supermarkets** → `supervivencia`:
- Mercadona, Carrefour, Lidl, Aldi, Día

**Streaming** → `opcional`:
- Netflix, Spotify, Amazon Prime, YouTube Premium, Disney

**Transport** → `supervivencia`:
- Uber, Cabify, Renfe

**Education** → `cultura`:
- Casa del Libro, Fnac, Udemy, Coursera

These provide good initial accuracy for common merchants without requiring user training.

---

## Performance Considerations

### Latency Impact

- **Merchant extraction**: <1ms (regex matching)
- **Category suggestion**: ~10-50ms (single DB query via RPC)
- **Learning from correction**: ~20-100ms (DB upsert + vote increment)

### Optimization Opportunities

1. **Caching**: Cache frequent merchant rules in Redis
2. **Batch Operations**: Use `suggestCategoriesBatch()` for bulk classification
3. **Async Learning**: Learn from corrections asynchronously (don't block update response)

---

## Future Enhancements

### P1-2: Corrections as Gold Examples
- Store full transaction examples (concept + category) as training data
- Use for few-shot prompting to improve GPT accuracy

### P2 Tasks
- **P2-1**: Namespaced embeddings (filter by category/merchant in vector search)
- **P2-2**: Re-ranking search results by confidence
- **P2-3**: Metrics dashboard (learning rate, accuracy trends)

---

## Troubleshooting

### Issue: Merchant not being extracted

**Symptoms**: `extractMerchant()` returns `null` for valid concepts

**Solutions**:
1. Check if concept is too short (<3 chars)
2. Add merchant pattern to `KNOWN_MERCHANT_PATTERNS` in `merchant-extractor.ts`
3. Verify concept format (should be plain text, not empty)

### Issue: Learned rule not being used

**Symptoms**: Category suggestion returns `null` despite rule existing

**Solutions**:
1. Check if global rule has ≥3 votes (minimum threshold)
2. Verify user_id matches (RLS policies filter by user)
3. Check if merchant extraction is working (`extractMerchant(concept)`)

### Issue: Learning not saving

**Symptoms**: `learnFromCorrection()` succeeds but rule not in DB

**Solutions**:
1. Verify migration was applied (`SELECT * FROM merchant_rules LIMIT 1`)
2. Check RLS policies (user must own the rule being created)
3. Look for errors in `apiLogger` output

---

## Related Files

- **Implementation**: `src/lib/agents/tools/utils/`
- **Migration**: `src/migrations/001_merchant_rules.sql`
- **Tests**: `src/__tests__/agents/tools/utils/`
- **Integration**: `src/lib/agents/tools/update-transaction.ts` (line 168+)

---

## Metrics & Success Criteria

After deployment, monitor:

- **Learning rate**: % of transactions with learned merchant rules
- **Accuracy improvement**: Reduction in category corrections over time
- **Coverage**: Number of unique merchants with rules
- **Consensus**: Number of global rules with ≥5 votes

**Expected Impact**:
- 30-40% reduction in category corrections within 1 month
- 50%+ of common merchants (Mercadona, Netflix, etc.) correctly classified without GPT
- <50ms average latency improvement for transactions with learned rules

---

## Summary

P1-1 implements a **merchant-based learning system** that improves transaction categorization accuracy through user feedback. The system is production-ready with 59 passing tests and full integration into the `update-transaction` flow. Future work includes integrating category suggestions into the main agent flow to reduce reliance on GPT for known merchants.
