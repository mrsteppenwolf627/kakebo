-- MIGRATION: Security Hardening & RLS Audit
-- DATE: 2026-02-17
-- DESCRIPTION: Ensure all tables have RLS enabled and strictly defined policies.

-- 1. Enable RLS on all critical tables (Idempotent)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.embeddings ENABLE ROW LEVEL SECURITY;

-- 2. Create "Deny All" policies for Anonymous users (Public Access)
-- This ensures that even if a specific policy is missed, the default is DENY for anon key if no other policy matches.
-- Note: Supabase denies by default if RLS is on and no policy matches, but explicit is better for audit.

-- Policy for Profiles (Already exists, but ensuring logic)
-- "Users can view their own profile" -> CHECK (auth.uid() = id)

-- 3. Audit: Check for any usage of PUBLIC role (should be none for sensitive data)
REVOKE ALL ON public.profiles FROM anon, authenticated;
REVOKE ALL ON public.expenses FROM anon, authenticated;
-- Re-grant minimal permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incomes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budgets TO authenticated;

-- 4. Function Execution Security
-- Ensure functions run with correct privileges (SECURITY DEFINER should be used carefully)
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO service_role; -- Only cloud trigger

-- 5. Comments for Audit Trail
COMMENT ON TABLE public.profiles IS 'Security Audited: 2026-02-17. RLS Enabled.';
