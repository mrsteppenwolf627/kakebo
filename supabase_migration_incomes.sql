-- MIGRATION: Add Incomes Table
-- DATE: 2026-02-12
-- AUTHOR: Antigravity

-- 1. Create Incomes Table
CREATE TABLE IF NOT EXISTS public.incomes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month_id uuid REFERENCES public.months(id) ON DELETE SET NULL, -- Optional link to month
  date date NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  category text NOT NULL, -- 'salary', 'freelance', 'sale', 'other', etc.
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Users can view their own incomes" 
ON public.incomes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own incomes" 
ON public.incomes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own incomes" 
ON public.incomes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own incomes" 
ON public.incomes FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON public.incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON public.incomes(date);
CREATE INDEX IF NOT EXISTS idx_incomes_month_id ON public.incomes(month_id);
