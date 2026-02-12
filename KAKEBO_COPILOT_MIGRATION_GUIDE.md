# 🏮 Kakebo Copilot - Migration Guide

**Version:** 3.0 - Copilot Architecture
**Date:** 2026-02-12
**Status:** Ready for deployment

---

## 📋 Overview

This migration transforms Kakebo from a basic expense tracker to a full **Kakebo Copilot** system that supports:

1. ✅ **Custom payment cycles** (nómina-a-nómina, not just calendar months)
2. ✅ **Per-cycle budgets** (not global)
3. ✅ **Configurable alerts** (warning/critical thresholds)
4. ✅ **Kakebo reflections** (core of the method)
5. ✅ **Financial scenarios** ("what-if" planning)

---

## 🗃️ New Database Tables

### 1. `payment_cycles` - Custom Payment Cycles

Supports both calendar months and payroll-to-payroll cycles.

**Key features:**
- Auto-calculates cycle dates based on configuration
- Helper function `get_current_cycle(user_id)` for easy access
- Trigger auto-updates dates when configuration changes

**Usage:**
```sql
-- Get user's current cycle
SELECT * FROM get_current_cycle('user-uuid-here');

-- Returns:
-- cycle_start, cycle_end, days_remaining, days_elapsed, days_total, cycle_type
```

---

### 2. `cycle_budgets` - Budgets Per Cycle

Replaces global budgets in `user_settings` with per-cycle budgets.

**Key features:**
- Historical tracking of budgets
- Auto-creates budget for new cycle based on previous cycle
- Supports savings target per cycle

**Usage:**
```sql
-- Get or create budget for current cycle
SELECT * FROM get_or_create_current_budget('user-uuid-here');

-- Manually create budget for specific cycle
INSERT INTO cycle_budgets (user_id, cycle_start, cycle_end, budget_supervivencia, ...)
VALUES (...);
```

---

### 3. `alert_settings` - Configurable Alert Thresholds

Per-user and per-category alert configuration.

**Key features:**
- Global thresholds with per-category overrides
- Notification preferences (daily/weekly/monthly summaries)
- Helper function `get_alert_thresholds(user_id, category)`

**Usage:**
```sql
-- Get thresholds for a category
SELECT * FROM get_alert_thresholds('user-uuid', 'survival');
-- Returns: warning_threshold, critical_threshold

-- Get budget status level
SELECT get_budget_status_level(85.5, 'user-uuid', 'survival');
-- Returns: 'safe' | 'warning' | 'critical'
```

---

### 4. `kakebo_reflections` - Reflections & Action Items

Core of Kakebo method: conscious reflection and action planning.

**Key features:**
- Structured JSONB format for questions/answers
- Action items tracking with completion status
- Sentiment tracking

**Usage:**
```sql
-- Get default reflection template
SELECT get_default_reflection_template();

-- Get recent reflections
SELECT * FROM get_recent_reflections('user-uuid', 3);

-- Mark action as completed
SELECT complete_action_item('reflection-uuid', 'Reducir salidas');
```

---

### 5. `financial_scenarios` - What-If Planning

Plan future expenses and track savings progress.

**Key features:**
- Auto-calculates monthly savings needed
- Tracks planned vs actual costs
- Links to real expenses when completed

**Usage:**
```sql
-- Get upcoming scenarios (next 3 months)
SELECT * FROM get_upcoming_scenarios('user-uuid');

-- Calculate commitments for a period
SELECT * FROM calculate_scenario_commitments(
  'user-uuid',
  '2026-03-01',
  '2026-06-30'
);

-- Complete a scenario
SELECT complete_scenario('scenario-uuid', 450.00, CURRENT_DATE);
```

---

## 🚀 Migration Steps

### Prerequisites

- Backup your database before running migrations
- Ensure no active transactions on affected tables
- Test on staging environment first

### Step 1: Run migrations in order

```bash
# Run migrations via Supabase SQL Editor in this exact order:

1. supabase_migration_payment_cycles.sql
2. supabase_migration_cycle_budgets.sql
3. supabase_migration_alert_settings.sql
4. supabase_migration_kakebo_reflections.sql
5. supabase_migration_financial_scenarios.sql
6. supabase_migration_deprecate_user_settings.sql
```

### Step 2: Verify data migration

```sql
-- Check that all users have payment cycles
SELECT COUNT(*) FROM auth.users au
WHERE au.id NOT IN (SELECT user_id FROM payment_cycles);
-- Should return: 0

-- Check that budgets were migrated
SELECT COUNT(*) FROM cycle_budgets;
-- Should return: >= (number of users with budgets)

-- Check alert settings created
SELECT COUNT(*) FROM alert_settings;
-- Should return: >= (number of users)
```

### Step 3: Update application code

**Priority 1 (Critical) - Budget queries:**
```typescript
// OLD (deprecated):
const { data } = await supabase
  .from('user_settings')
  .select('budget_supervivencia, budget_opcional, ...')
  .eq('user_id', userId)
  .single();

// NEW (correct):
const { data } = await supabase
  .rpc('get_or_create_current_budget', { p_user_id: userId });
```

**Priority 2 (High) - Cycle dates:**
```typescript
// OLD (hardcoded calendar month):
const startDate = new Date(year, month - 1, 1);
const endDate = new Date(year, month, 0);

// NEW (respects user's cycle):
const { data: cycle } = await supabase
  .rpc('get_current_cycle', { p_user_id: userId });
// Use cycle.cycle_start and cycle.cycle_end
```

**Priority 3 (Medium) - Alert thresholds:**
```typescript
// OLD (hardcoded):
const warningThreshold = 70;
const criticalThreshold = 90;

// NEW (user-configurable):
const { data: thresholds } = await supabase
  .rpc('get_alert_thresholds', {
    p_user_id: userId,
    p_category: 'survival'
  });
```

---

## 🔄 Backwards Compatibility

### Phase 1: Migration (Current)
- ✅ Old columns kept in `user_settings`
- ✅ Data migrated to new tables
- ✅ Both systems work simultaneously

### Phase 2: Transition (2-4 weeks)
- 🔄 Update all code to use new tables
- 🔄 Test thoroughly
- 🔄 Monitor for issues

### Phase 3: Cleanup (After validation)
- ❌ Drop deprecated columns from `user_settings`
- ❌ Remove old code paths

**DO NOT run Phase 3 until all code is migrated!**

---

## 📊 Schema Diagram

```
┌─────────────────┐
│   auth.users    │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬──────────────┬───────────────┐
    │         │            │              │               │
    ▼         ▼            ▼              ▼               ▼
┌────────┐ ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌──────────┐
│expenses│ │  incomes │ │   cycles   │ │reflections│ │scenarios │
└────────┘ └──────────┘ └─────┬──────┘ └──────────┘ └──────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │cycle_budgets│
                        └─────────────┘
```

---

## 🧪 Testing Checklist

### Database Tests

- [ ] All migrations run without errors
- [ ] All users have payment_cycles record
- [ ] Budget data migrated correctly
- [ ] RLS policies work (users can only see their own data)
- [ ] Triggers work (auto-calculation of dates, savings)
- [ ] Foreign keys enforce referential integrity

### Application Tests

- [ ] Budget queries use new tables
- [ ] Cycle dates respect user configuration
- [ ] Alert thresholds are configurable
- [ ] Creating budgets works
- [ ] Creating reflections works
- [ ] Creating scenarios works
- [ ] Agent can access new data

### Integration Tests

- [ ] AI Agent uses new get_current_cycle function
- [ ] Budget status tool uses cycle_budgets
- [ ] Scenarios tool creates scenarios
- [ ] Reflections can be saved and retrieved

---

## 🐛 Troubleshooting

### Migration fails with "relation already exists"
- **Cause:** Migration was run before
- **Fix:** Check if tables exist, skip CREATE TABLE if they do

### Users missing payment_cycles
- **Cause:** User created after migration, trigger not working
- **Fix:** Run backfill query manually:
  ```sql
  INSERT INTO payment_cycles (user_id, cycle_type, current_cycle_start, current_cycle_end)
  SELECT id, 'calendar',
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE
  FROM auth.users
  WHERE id NOT IN (SELECT user_id FROM payment_cycles);
  ```

### Budget queries return null
- **Cause:** No budget created for current cycle
- **Fix:** Use `get_or_create_current_budget()` function (auto-creates)

### RLS policies blocking queries
- **Cause:** Using service role key bypasses RLS, or wrong user context
- **Fix:** Ensure `auth.uid()` matches the user_id in queries

---

## 📚 API Reference

### New Functions Available

| Function | Purpose | Returns |
|----------|---------|---------|
| `get_current_cycle(user_id)` | Get current cycle dates | cycle_start, cycle_end, days_remaining, etc. |
| `get_or_create_current_budget(user_id)` | Get/create budget for current cycle | cycle_budgets row |
| `get_alert_thresholds(user_id, category)` | Get alert thresholds | warning_threshold, critical_threshold |
| `get_budget_status_level(percentage, user_id, category)` | Determine status level | 'safe' \| 'warning' \| 'critical' |
| `get_recent_reflections(user_id, limit)` | Get recent reflections | reflections rows |
| `complete_action_item(reflection_id, action)` | Mark action as done | boolean |
| `get_upcoming_scenarios(user_id)` | Get scenarios in next 3 months | scenarios rows |
| `calculate_scenario_commitments(user_id, start, end)` | Total commitments | category, total_cost, count |

---

## 🎯 Next Steps

After running these migrations:

1. ✅ **Update AI Agent tools** (5 new tools needed)
2. ✅ **Update prompt** to be "Copilot" not "Analyst"
3. ✅ **Update frontend** to use new tables
4. ✅ **Test thoroughly** in staging
5. ✅ **Deploy to production**
6. ✅ **Monitor for issues**

See [KAKEBO_COPILOT_IMPLEMENTATION.md](./KAKEBO_COPILOT_IMPLEMENTATION.md) for agent implementation guide.

---

## 📞 Support

If you encounter issues during migration:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review migration logs for error messages
3. Test queries manually in Supabase SQL Editor
4. Open an issue with full error details

---

**Migration prepared by:** Claude Sonnet 4.5
**Last updated:** 2026-02-12
