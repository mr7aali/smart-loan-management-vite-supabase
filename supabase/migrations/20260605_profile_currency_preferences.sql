ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD'
  CHECK (currency IN ('USD', 'EUR', 'ZAR', 'LSL'));
