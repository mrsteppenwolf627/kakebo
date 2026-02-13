-- MIGRATION: Setup Profiles Table & SaaS Fields
-- DATE: 2026-02-06
-- AUTHOR: Antigravity

-- 1. Create Enum for SaaS Tiers (if not exists)
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('free', 'pro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Profiles Table (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  tier subscription_tier DEFAULT 'free',
  trial_ends_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  manual_override boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 3. Trigger to handle new user signups
-- This ensures a row is created in public.profiles whenever a user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, tier, trial_ends_at)
  VALUES (
    new.id, 
    'free', -- Keep tier as free, so access control checks trial_ends_at
    (now() + interval '14 days') -- 14 days trial
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Backfill existing users (Optimistic)
-- If there are users in auth.users without a profile, create one.
-- Note: accessing auth.users directly might require permissions.
INSERT INTO public.profiles (id, tier, trial_ends_at)
SELECT id, 'pro', (now() + interval '15 days')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON public.profiles(stripe_subscription_id);
