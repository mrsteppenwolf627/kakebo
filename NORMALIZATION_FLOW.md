# Fixed Expense Normalization Flow

## Input → Validation → Normalization → API → Database

```
┌─────────────────────────────────────────────────────────────────────┐
│ USER INPUT (Browser Form)                                           │
│ User types: "2026-1" (single-digit month)                           │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│ React State (page.tsx line 183-186)                                 │
│ startYm = "2026-1"  (captured from onChange event)                  │
│                                                                     │
│ Input sent to validateFixedPayload()                                │
│ {                                                                   │
│   name: "PRUEBA FIJO 20261006",                                     │
│   amount: "30",                                                     │
│   start_ym: "2026-1",     ◄── User's raw input                      │
│   end_ym: ""                                                        │
│ }                                                                   │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│ VALIDATION (page.tsx line 152)                                      │
│                                                                     │
│ isYm(sYm) where sYm = "2026-1".trim() = "2026-1"                   │
│                                                                     │
│ ✅ Regex: /^(\d{4})-(\d{1,2})$/ matches "2026-1"                   │
│ ✅ Month: parseInt("1", 10) = 1 (valid: 1-12)                      │
│ ✅ Returns: true                                                    │
│                                                                     │
│ Passes validation! ✅                                               │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│ NORMALIZATION (page.tsx line 158)                                   │
│                                                                     │
│ const normalizedStartYm = normalizeYm(sYm)                          │
│                                                                     │
│ normalizeYm("2026-1"):                                              │
│   1. trimmed = "2026-1"                                             │
│   2. match = ["2026-1", "2026", "1"]                                │
│   3. year = "2026"                                                  │
│   4. month = "1".padStart(2, "0") = "01"                            │
│   5. return "2026-01"  ◄── NORMALIZED!                              │
│                                                                     │
│ Result: normalizedStartYm = "2026-01"  ✅                           │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│ RETURN VALIDATED DATA (page.tsx line 161-169)                       │
│                                                                     │
│ return {                                                            │
│   ok: true,                                                         │
│   data: {                                                           │
│     name: "PRUEBA FIJO 20261006",                                   │
│     amount: 30,                                                     │
│     start_ym: "2026-01",  ◄── NORMALIZED to YYYY-MM format          │
│     end_ym: null,                                                   │
│     due_day: 1                                                      │
│   }                                                                 │
│ }                                                                   │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│ SUPABASE INSERT (page.tsx line 190-194)                             │
│                                                                     │
│ const { error } = await supabase                                    │
│   .from("fixed_expenses")                                           │
│   .insert({                                                         │
│     user_id: userId,                                                │
│     ...v.data,  ◄── Spreads normalized data                         │
│     active: true                                                    │
│   });                                                               │
│                                                                     │
│ Actual payload sent to Supabase:                                    │
│ {                                                                   │
│   user_id: "uuid-...",                                              │
│   name: "PRUEBA FIJO 20261006",                                     │
│   amount: 30,                                                       │
│   start_ym: "2026-01",  ◄── YYYY-MM format guaranteed               │
│   end_ym: null,                                                     │
│   due_day: 1,                                                       │
│   active: true                                                      │
│ }                                                                   │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│ DATABASE STORAGE (Supabase fixed_expenses table)                    │
│                                                                     │
│ INSERT INTO fixed_expenses VALUES (                                 │
│   id: uuid,                                                         │
│   user_id: uuid,                                                    │
│   name: 'PRUEBA FIJO 20261006',                                     │
│   amount: 30,                                                       │
│   start_ym: '2026-01',  ◄── STORED as YYYY-MM                       │
│   end_ym: null,                                                     │
│   ...                                                               │
│ )                                                                   │
│                                                                     │
│ ✅ Database always receives YYYY-MM format                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Points

### 1. **Validation Accepts Flexible Input** (Line 152)
- User can enter "2026-1" or "2026-10"
- Both pass `isYm()` validation
- Flexible regex: `/^(\d{4})-(\d{1,2})$/`

### 2. **Normalization Happens BEFORE API Call** (Lines 157-159)
```typescript
// Step 1: Validate user input
if (!isYm(sYm)) return { ok: false, ... };

// Step 2: Normalize for storage
const normalizedStartYm = normalizeYm(sYm);

// Step 3: Return normalized value
start_ym: normalizedStartYm,
```

### 3. **Database Contract Maintained**
- Supabase schema expects `start_ym` as TEXT in YYYY-MM format
- API receives YYYY-MM guaranteed (normalized on client)
- No changes needed to backend validation
- `src/lib/schemas/fixed-expense.ts` expects YYYY-MM via `ymSchema`

### 4. **No Backend Changes Required**
The backend API (`src/app/api/fixed-expenses/route.ts`) uses:
```typescript
const input = createFixedExpenseSchema.parse(body);
// createFixedExpenseSchema validates start_ym with ymSchema
// ymSchema regex: /^\d{4}-(0[1-9]|1[0-2])$/
```

Since we normalize on the client to YYYY-MM, the backend receives valid input.

---

## Test Coverage

✅ **Unit Test (test-fixed-expense-fix.ts)**
- Tests `isYm()` validation: accepts "2026-1" ✓
- Tests `normalizeYm()`: "2026-1" → "2026-01" ✓
- All 8 test cases pass ✓

✅ **Integration Test (src/__tests__/api/fixed-expenses.test.ts)**
- Existing 8 tests pass (no regression) ✓

✅ **Build Verification**
- No TypeScript errors ✓
- All types check ✓

---

## Example Scenarios

| User Input | After Trim | After Validation | After Normalization | Sent to DB |
|-----------|-----------|------------------|-------------------|-----------|
| `"2026-1"` | ✓ | ✓ | `"2026-01"` | ✅ `"2026-01"` |
| `"2026-10"` | ✓ | ✓ | `"2026-10"` | ✅ `"2026-10"` |
| `" 2026-1 "` | `"2026-1"` | ✓ | `"2026-01"` | ✅ `"2026-01"` |
| `"2026-13"` | ✓ | ❌ | — | ❌ Rejected |
| `"2026"` | ✓ | ❌ | — | ❌ Rejected |
