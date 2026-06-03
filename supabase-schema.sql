// SQL Schema for LendSmart Database
-- Run this in Supabase SQL Editor to create the required tables

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  max_borrowers INTEGER DEFAULT 10,
  max_loans INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create borrowers table
CREATE TABLE IF NOT EXISTS borrowers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  borrower_id UUID REFERENCES borrowers(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) DEFAULT 0,
  term_months INTEGER DEFAULT 12,
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paid', 'overdue')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create repayments table
CREATE TABLE IF NOT EXISTS repayments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  date DATE NOT NULL,
  method TEXT DEFAULT 'cash' CHECK (method IN ('cash', 'bank_transfer', 'upi', 'other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  price DECIMAL(10, 2) DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment records table for subscription billing history
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT DEFAULT 'paypal' CHECK (provider IN ('paypal')),
  provider_order_id TEXT,
  provider_capture_id TEXT UNIQUE,
  subscription_plan TEXT NOT NULL CHECK (subscription_plan IN ('free', 'starter', 'professional', 'enterprise')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_borrowers_user_id ON borrowers(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_borrower_id ON loans(borrower_id);
CREATE INDEX IF NOT EXISTS idx_repayments_user_id ON repayments(user_id);
CREATE INDEX IF NOT EXISTS idx_repayments_loan_id ON repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_unique ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_capture_unique ON payments(provider_capture_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles: users can only view/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Borrowers: users can only access their own borrowers
CREATE POLICY "Users can view own borrowers" ON borrowers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own borrowers" ON borrowers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own borrowers" ON borrowers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own borrowers" ON borrowers
  FOR DELETE USING (auth.uid() = user_id);

-- Loans: users can only access their own loans
CREATE POLICY "Users can view own loans" ON loans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loans" ON loans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loans" ON loans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loans" ON loans
  FOR DELETE USING (auth.uid() = user_id);

-- Repayments: users can only access their own repayments
CREATE POLICY "Users can view own repayments" ON repayments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own repayments" ON repayments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own repayments" ON repayments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own repayments" ON repayments
  FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions: users can only access their own subscription
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Payments: users can only view their own payment records
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = NOW();

  INSERT INTO public.subscriptions (user_id, plan, status, billing_cycle, price)
  VALUES (NEW.id, 'free', 'active', 'monthly', 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill free subscriptions for existing users that do not already have one
INSERT INTO public.subscriptions (user_id, plan, status, billing_cycle, price)
SELECT
  auth_user.id,
  'free',
  'active',
  'monthly',
  0
FROM auth.users AS auth_user
LEFT JOIN public.subscriptions AS existing_subscription
  ON existing_subscription.user_id = auth_user.id
WHERE existing_subscription.user_id IS NULL;
