-- Secure subscription writes so paid plan changes happen only after server-side verification.

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_unique
  ON public.subscriptions(user_id);

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

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
