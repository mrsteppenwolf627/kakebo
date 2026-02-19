# Session Updates - Kakebo AI Agent Improvements

Last updated: 2026-02-19 (Extended session: GPT Integration)

---

## Session Summary (2026-02-19)

### Completed Work

#### P0-1: Write Confirmation (✅ Completed)
- **Goal**: Add explicit confirmation for write operations to prevent accidental data changes
- **Implementation**:
  - Added `ConfirmationRequest` type to agent response
  - Modified tool metadata to flag write operations as requiring confirmation
  - Implemented gating logic in `function-caller.ts`
  - Feature flag: `ENABLE_WRITE_CONFIRMATION` (default: false)
- **Tests**: 13 passing (`write-confirmation.test.ts`)
- **Files Modified**:
  - `src/lib/agents-v2/types.ts`
  - `src/lib/agents-v2/tools/definitions.ts`
  - `src/lib/agents-v2/function-caller.ts`
  - `src/__tests__/agents-v2/write-confirmation.test.ts`

#### P0-2: Pre-write Validation (✅ Completed)
- **Goal**: Validate transactions before DB insert to prevent bad data
- **Implementation**:
  - Created `transaction-validator.ts` with validation rules:
    - Amount validation (must be > 0, < €10,000)
    - Date validation (max 7 days future, warn for >1 year past)
    - Concept validation (min 3 chars, warn for ambiguous terms)
    - Duplicate detection (24-hour window, warn for similar transactions)
  - Integrated into `create-transaction.ts`
  - Returns errors (block creation) and warnings (inform but allow)
- **Tests**: 24 passing (`transaction-validator.test.ts`)
- **Files Created**:
  - `src/lib/agents/tools/validators/transaction-validator.ts`
  - `src/__tests__/agents/tools/validators/transaction-validator.test.ts`
- **Files Modified**:
  - `src/lib/agents/tools/create-transaction.ts` (validation integration)

#### P1-1: Merchant Map & Learned Rules (✅ Completed)
- **Goal**: Implement feedback loop to learn from user corrections and improve accuracy
- **Implementation**:
  - **Database**: Created `merchant_rules` table (migration `001_merchant_rules.sql`)
    - User-specific rules (user_id set) and global rules (user_id NULL)
    - Unique constraint: (user_id, merchant)
    - Helper functions: `upsert_merchant_rule`, `get_merchant_rule`, `increment_global_rule_vote`
    - Seed data: 17 common merchants (Mercadona, Netflix, Uber, etc.)
  - **Utilities**:
    - `merchant-extractor.ts`: Extracts merchant names from concepts (30+ known patterns + fallback heuristics)
    - `category-suggester.ts`: Suggests categories from learned rules (user > global priority)
    - `learn-from-correction.ts`: Saves rules when users correct categories
    - `category-preprocessor.ts`: Helper for future GPT prompt enhancement
  - **Integration**:
    - Modified `update-transaction.ts` to call `learnFromCorrection()` when category is updated
    - Returns `learningResult` in response to show what was learned
- **Tests**: 59 passing
  - `merchant-extractor.test.ts`: 34 tests
  - `category-suggester.test.ts`: 14 tests
  - `learn-from-correction.test.ts`: 11 tests
- **Files Created**:
  - `src/migrations/001_merchant_rules.sql` (database schema)
  - `src/lib/agents/tools/utils/merchant-extractor.ts`
  - `src/lib/agents/tools/utils/category-suggester.ts`
  - `src/lib/agents/tools/utils/learn-from-correction.ts`
  - `src/lib/agents/tools/utils/category-preprocessor.ts`
  - `src/__tests__/agents/tools/utils/merchant-extractor.test.ts`
  - `src/__tests__/agents/tools/utils/category-suggester.test.ts`
  - `src/__tests__/agents/tools/utils/learn-from-correction.test.ts`
  - `src/lib/agents/tools/utils/README_MERCHANT_MAP.md` (documentation)
- **Files Modified**:
  - `src/lib/agents/tools/update-transaction.ts` (learning integration, lines 3-6, 20-24, 168-211, 237)

#### P1-2: Correction Examples for Few-Shot Learning (✅ Completed)
- **Goal**: Store full transaction examples for few-shot prompting to improve GPT accuracy
- **Implementation**:
  - **Database**: Created `correction_examples` table (migration `002_correction_examples.sql`)
    - Stores: concept, amount, date, old_category, new_category, merchant
    - Tracks usage: times_used, last_used_at
    - Unique constraint: (user_id, concept, old_category, new_category)
    - Helper functions: `save_correction_example`, `get_relevant_examples`, `increment_example_usage`, `get_example_stats`
    - Seed data: 10 common corrections (supermarkets, streaming, transport, education)
  - **Utilities**:
    - `example-retriever.ts`: Retrieves relevant examples for few-shot prompting
    - Functions: `getRelevantExamples`, `getSimilarExamples`, `formatExamplesForPrompt`, `trackExampleUsage`, `getExampleStats`
  - **Integration**:
    - Modified `update-transaction.ts` to call `save_correction_example` when category is updated
    - Saves full example automatically (non-blocking)
- **Tests**: 21 passing (`example-retriever.test.ts`)
- **Files Created**:
  - `src/migrations/002_correction_examples.sql` (database schema)
  - `src/lib/agents/tools/utils/example-retriever.ts`
  - `src/__tests__/agents/tools/utils/example-retriever.test.ts`
  - `src/lib/agents/tools/utils/README_CORRECTION_EXAMPLES.md` (documentation)
- **Files Modified**:
  - `src/lib/agents/tools/update-transaction.ts` (example saving, lines 215-250)

#### GPT Integration with Correction Examples (✅ Completed - Extension)
- **Goal**: Integrate P1-2 examples into GPT classification for few-shot learning
- **Implementation**:
  - Modified `classifyExpense()` to retrieve correction examples before GPT call
  - Extended `ClassifyOptions` with `supabase`, `userId`, `useCorrectionExamples`
  - Enhanced prompt structure: System → Static examples → Correction examples → User input
  - Automatic integration: Examples retrieved and used when user is authenticated
- **Tests**: 7 passing (`classifier-with-examples.test.ts`)
- **Files Modified**:
  - `src/lib/ai/classifier.ts` (correction example integration)
  - `src/app/api/ai/classify/route.ts` (pass supabase + userId)
- **Files Created**:
  - `src/__tests__/ai/classifier-with-examples.test.ts`
  - `docs/GPT_INTEGRATION_P1-2.md` (integration documentation)

### Test Results
- **Total tests run**: 124 (13 + 24 + 59 + 21 + 7)
- **All passing**: ✅
- **No regressions**: ✅

---

## How to Resume Next Session

### 1. Migration Application (Required for P1-1 and P1-2)

Before using P1-1 and P1-2 features, apply the database migrations:

```bash
# Option 1: Via Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy contents of src/migrations/001_merchant_rules.sql
# 3. Run the script

# Option 2: Via Supabase CLI (if configured)
supabase db push

# Option 3: Via psql
psql -h <supabase-host> -U postgres -d postgres -f src/migrations/001_merchant_rules.sql

# Apply P1-2 migration (correction_examples)
# Copy contents of src/migrations/002_correction_examples.sql and run in SQL Editor
# OR
psql -h <supabase-host> -U postgres -d postgres -f src/migrations/002_correction_examples.sql
```

**Verification**:
```sql
-- Check P1-1 table
SELECT * FROM public.merchant_rules LIMIT 1;
SELECT merchant, category, vote_count FROM public.merchant_rules WHERE user_id IS NULL ORDER BY vote_count DESC;

-- Check P1-2 table
SELECT * FROM public.correction_examples LIMIT 1;
SELECT concept, old_category, new_category, times_used FROM public.correction_examples WHERE user_id IS NULL ORDER BY times_used DESC;
```

### 2. Testing P1-1 and P1-2 Integration

To verify P1-1 and P1-2 work end-to-end:

```bash
# 1. Start dev server
npm run dev

# 2. Test learning from correction (P1-1 + P1-2)
# - Create a transaction via UI/API
# - Update its category (e.g., Mercadona: opcional → supervivencia)
# - Check merchant_rules table to see if rule was saved (P1-1)
# - Check correction_examples table to see if example was saved (P1-2)

# 3. Test category suggestion (P1-1)
# - Create another transaction with same merchant
# - Verify it uses the learned category

# 4. Test example retrieval (P1-2)
# - Query correction_examples to see saved examples
# - Test getRelevantExamples() function to retrieve examples
```

### 3. Next Tasks: P2-1, P2-2, P2-3

#### Option A: Integrate P1-2 Examples into GPT Prompt (Recommended)
Before starting P2 tasks, integrate few-shot examples into the GPT classification flow:

**Goal**: Use correction examples to improve GPT accuracy

**Implementation**:
1. Modify `function-caller.ts` or where GPT classification happens:
   ```typescript
   // Before calling GPT
   const examples = await getRelevantExamples(supabase, userId, {
     categoryFilter: "supervivencia",
     limit: 3,
   });

   // Add to system prompt
   const systemPrompt = basePrompt + "\n\n" + formatExamplesForPrompt(examples);

   // Track usage
   await trackExampleUsage(supabase, examples.map(e => e.id));
   ```

2. A/B test impact on classification accuracy

**Estimated**: 1-2 hours

#### Option B: Continue with P2 Tasks

**P2-1: Filtros estructurados en retrieval** (2-3 hours)
- Add namespace/category filters to vector search
- Improve embedding retrieval precision
- Filter embeddings by category before similarity search

**P2-2: Re-ranking de resultados** (1-2 hours)
- Re-rank search results by confidence score
- Combine merchant rules + embeddings + correction examples

**P2-3: Sistema de métricas** (3-4 hours)
- Learning rate dashboard
- Accuracy trends over time
- Coverage metrics (% transactions with learned rules/examples)

---

## Current Architecture State

### File Structure
```
src/
├── lib/
│   ├── agents/
│   │   └── tools/
│   │       ├── create-transaction.ts (P0-2 validation)
│   │       ├── update-transaction.ts (P1-1 learning)
│   │       ├── validators/
│   │       │   └── transaction-validator.ts (P0-2)
│   │       └── utils/
│   │           ├── merchant-extractor.ts (P1-1)
│   │           ├── category-suggester.ts (P1-1)
│   │           ├── learn-from-correction.ts (P1-1)
│   │           ├── category-preprocessor.ts (P1-1)
│   │           └── README_MERCHANT_MAP.md
│   └── agents-v2/
│       ├── function-caller.ts (P0-1 confirmation)
│       ├── types.ts (P0-1 confirmation types)
│       └── tools/
│           └── definitions.ts (P0-1 tool metadata)
├── migrations/
│   └── 001_merchant_rules.sql (P1-1)
└── __tests__/
    └── agents/
        └── tools/
            ├── validators/
            │   └── transaction-validator.test.ts (24 tests)
            └── utils/
                ├── merchant-extractor.test.ts (34 tests)
                ├── category-suggester.test.ts (14 tests)
                └── learn-from-correction.test.ts (11 tests)
```

### Feature Flags
- `ENABLE_WRITE_CONFIRMATION=false` (P0-1) - Set to `true` to enable write confirmations
- `USE_FUNCTION_CALLING_AGENT=false` (v2) - Set to `true` to use v2 agent

### Database State
- **New table** (pending migration): `merchant_rules` with seed data
- **RLS policies**: Users can view own + global rules, can only modify own rules
- **Helper functions**: `upsert_merchant_rule`, `get_merchant_rule`, `increment_global_rule_vote`

---

## Remaining Tasks (Prioritized)

### P1-2: Corrections as Gold Examples (Next)
- Store full transaction examples for few-shot prompting
- Improve GPT accuracy by showing past corrections
- Estimated: 2-3 hours

### P2-1: Filtros estructurados en retrieval
- Add namespace/category filters to vector search
- Improve embedding retrieval precision
- Estimated: 2-3 hours

### P2-2: Re-ranking de resultados
- Re-rank search results by confidence score
- Combine merchant rules + embeddings
- Estimated: 1-2 hours

### P2-3: Sistema de métricas
- Learning rate dashboard
- Accuracy trends over time
- Coverage metrics (% transactions with learned rules)
- Estimated: 3-4 hours

---

## Git Status

**Current branch**: `main`

**Changes made** (not yet committed):
- P0-1 implementation (Write Confirmation)
- P0-2 implementation (Pre-write Validation)
- P1-1 implementation (Merchant Map & Learned Rules)
- P1-2 implementation (Correction Examples)
- GPT Integration (Correction Examples in Classifier)
- 124 new tests (all passing)
- Documentation updates:
  - ✅ README.md (v3.8.0 changelog)
  - ✅ CHANGELOG.md (detailed v3.8.0 entry)
  - ✅ SESSION_UPDATES.md (this file)
  - ✅ docs/GPT_INTEGRATION_P1-2.md (new)
  - ✅ src/lib/agents/tools/utils/README_MERCHANT_MAP.md (new)
  - ✅ src/lib/agents/tools/utils/README_CORRECTION_EXAMPLES.md (new)

**Recommended commit message**:
```
feat: implement P0-1, P0-2, P1-1, and P1-2 improvements

- P0-1: Add write confirmation gating (13 tests)
- P0-2: Add pre-write validation (24 tests)
- P1-1: Implement merchant map and learned rules (59 tests)
- P1-2: Implement correction examples for few-shot learning (21 tests)

All 117 tests passing.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Key Learnings

### Implementation Insights

1. **Check before upsert**: When determining if a DB operation created or updated a record, check BEFORE the upsert, not after (P1-1 bug fix)

2. **Priority matters for patterns**: When using regex patterns with overlapping matches (e.g., "uber" vs "uber eats"), ensure more specific patterns have higher priority

3. **Mock complexity**: When mocking Supabase chains (`.from().select().eq().eq()`), ensure all call paths are mocked, not just the happy path

### Testing Strategy

- **Unit test each utility separately** before integration
- **Mock at the boundary** (Supabase client), not internal functions
- **Test error paths** explicitly (don't just test happy path)

### Architecture Decisions

- **Feature flags for gradual rollout**: All new features have flags (P0-1, v2 agent)
- **Warnings vs errors**: Pre-write validation uses both (errors block, warnings inform)
- **User-specific > global**: Learned rules prioritize individual preferences over consensus

---

## Quick Reference

### Run tests
```bash
# All tests
npm test

# Specific suite
npm test transaction-validator.test.ts
npm test merchant-extractor.test.ts
npm test category-suggester.test.ts
npm test learn-from-correction.test.ts
npm test example-retriever.test.ts
npm test write-confirmation.test.ts

# Watch mode
npm test -- --watch
```

### Apply migration
```bash
# Via Supabase Dashboard: SQL Editor → Copy & Run src/migrations/001_merchant_rules.sql
```

### Check learning stats (SQL)
```sql
-- User-specific rules
SELECT merchant, category, confidence FROM merchant_rules WHERE user_id = '<user_id>';

-- Global rules (top by votes)
SELECT merchant, category, vote_count FROM merchant_rules WHERE user_id IS NULL ORDER BY vote_count DESC LIMIT 10;

-- Learning rate (% transactions with learned merchants)
-- (requires joining with expenses table)
```

---

## Contact & Documentation

- **P1-1 README**: `src/lib/agents/tools/utils/README_MERCHANT_MAP.md`
- **P1-2 README**: `src/lib/agents/tools/utils/README_CORRECTION_EXAMPLES.md`
- **Project Memory**: `.claude/memory/MEMORY.md`
- **Task List**: See `/tasks` command in Claude Code

**For questions or issues, check**:
- Test files for usage examples
- README for detailed documentation
- MEMORY.md for architectural context
