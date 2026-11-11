# Kakebo Staging Configuration - 2026-10-06

> **Histórico, ya no se usa.** Retirados el 2026-11-10: las ramas feat/plus-subscriptions-e2e-test, feat/plus-subscriptions-staging y staging y el worktree kk-plus (tags archive/feat-plus-subscriptions-e2e-test, archive/feat-plus-subscriptions-staging, archive/staging). El estado del proyecto Supabase de staging y de la configuración de Stripe TEST no se ha verificado. Este documento se conserva como registro técnico.

## Overview
This document tracks manual schema changes applied to Supabase staging (`gqnsanzsdnbufwicjtiw`) that are **NOT** part of production migrations. These are one-time setup changes specific to the staging environment.

⚠️ **STAGING-ONLY CHANGES** — Do not apply to production. Production migrations must go through proper versioning.

---

## Changes Applied to Staging

### 1. user_settings Table Columns Correction
**Date:** 2026-10-06  
**Status:** ✅ Applied and verified  
**Scope:** Staging only

**SQL Applied:**
```sql
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS savings_goal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget_survival numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget_optional numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget_culture numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget_extra numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_balance numeric NOT NULL DEFAULT 0;
```

**Columns Now in staging.user_settings:**
- user_id (PK)
- monthly_income ✅
- savings_goal ✅
- budget_survival ✅
- budget_optional ✅
- budget_culture ✅
- budget_extra ✅
- current_balance ✅
- ai_confirm_writes ✅
- allow_collective_learning ✅

**Reason:** Application code expects these exact column names. Initial staging setup had misspelled/incorrect names (supervivencia, opcional, cultura, monthly_saving_goal).

---

### 2. fixed_expenses Table Creation
**Date:** 2026-10-06  
**Status:** ✅ Applied and verified  
**Scope:** Staging (to prepare for production)

**SQL Applied:**
```sql
CREATE TABLE IF NOT EXISTS public.fixed_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_id UUID NOT NULL REFERENCES public.months(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own fixed expenses
CREATE POLICY fixed_expenses_read_own 
  ON public.fixed_expenses 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own fixed expenses
CREATE POLICY fixed_expenses_insert_own 
  ON public.fixed_expenses 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own fixed expenses
CREATE POLICY fixed_expenses_update_own 
  ON public.fixed_expenses 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy 4: Users can delete their own fixed expenses
CREATE POLICY fixed_expenses_delete_own 
  ON public.fixed_expenses 
  FOR DELETE 
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fixed_expenses TO authenticated;
```

**Reason:** Application references `fixed_expenses` 24 times. Table was completely missing in initial staging setup.

---

### 3. incomes Table Verification
**Date:** 2026-10-06  
**Status:** ✅ Verified (already existed)  
**Scope:** Staging

**Current State:**
- Table exists with proper structure
- RLS is enabled
- Policies in place for user-scoped access
- GRANT SELECT, INSERT, UPDATE, DELETE to authenticated

---

## Testing Results

### ✅ Passing Tests
- **Signup/Login:** User `testuser20261006@example.com` registered and logged in successfully
- **Expense Creation:** Test expense "PRUEBA STAGING 2026-10-06" (25.50€, 2026-10-06, supervivencia) created and stored
- **Expense Retrieval:** Expense appears in dashboard "Últimos movimientos" section
- **Dashboard Load:** No onboarding errors, dashboard renders

### ⏳ In-Progress Tests (2026-10-06)
- Income creation and display
- Fixed expense creation and totals calculation
- Settings API response correctness

---

## Environment Details

**Preview URL:** https://kakebo-2e2s63dkg-aitors-projects-b90cd59c.vercel.app  
**Staging Supabase Project:** kakebo-staging (gqnsanzsdnbufwicjtiw)  
**Branch:** feat/premium-pack-landing  
**Commit:** c3a7300b70289f5d3d24c4616560ebbd5f589303

---

## Important Notes

- **These are staging-only manual adjustments.** They must be converted to proper migrations for production.
- Do NOT apply these changes directly to production. Instead:
  1. Create a versioned migration (e.g., `20261001_user_settings_columns.sql`)
  2. Include proper documentation and rollback steps
  3. Test on staging first before production deployment
- The `fixed_expenses` table should be added to production via a new migration file.
- All RLS policies are user-scoped (read/write own data only).

---

## Testing Status (2026-10-06)

### ✅ Completed Tests
1. **Signup/Login** — User `testuser20261006@example.com` registered and authenticated
2. **Dashboard Loading** — No errors; schema correctly matches code expectations
3. **Expense Creation** — Original test expense (25.50€) persisted correctly
4. **Income Creation** — 100€ test income created, saved, and visible in dashboard totals
5. **Totals Calculation** — "Disponible Real" correctly updates (100 - 25.50 = 74.50€)

### ❌ Issues Found
1. **Fixed Expenses Endpoint** — Backend validation fails with error: `start_ym debe ser YYYY-MM`
   - Format rejection appears to be a server-side bug (correct format "2026-10" rejected)
   - File to investigate: `src/app/api/fixed-expenses/route.ts`

### ⚠️ Data Cleanup Needed
- Test user: `testuser20261006@example.com` 
- Test income: "PRUEBA INGRESO 20261006" (100.00€, 2026-10-06) — still in database
- Test expense: "PRUEBA STAGING 2026-10-06" (25.50€) — kept for validation

---

## Cleanup

Test data created during validation (2026-10-06):
- User: `testuser20261006@example.com` (for testing signup/login) ✅ Active
- Expense: "PRUEBA STAGING 2026-10-06" 25.50€ (test expense, kept for validation) ✅ Verified
- Income: "PRUEBA INGRESO 20261006" 100€ (test income, created successfully) ⚠️ Needs deletion
- Fixed Expense: (creation failed due to backend validation error) ❌ Not created

---

## Production Readiness Checklist

Before deploying to production, verify:
- [ ] Fixed expenses validation bug is fixed and tested
- [ ] All three flows (expense, income, fixed expense) tested end-to-end
- [ ] Settings API returns correct column names (no incorrect legacy names)
- [ ] RLS policies verified on all tables
- [ ] Proper migrations created (not manual SQL)
- [ ] Test data cleaned up from staging
- [ ] Full test suite passes
- [ ] Staging and production schemas match

**Next:** Apply these corrections to production via proper migrations and full testing cycle before deployment.
