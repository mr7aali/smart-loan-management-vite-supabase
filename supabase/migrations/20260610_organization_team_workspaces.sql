-- Add organization workspaces so multiple auth users can share one loan dataset.

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

INSERT INTO public.organizations (name, owner_id, created_at, updated_at)
SELECT
  COALESCE(NULLIF(TRIM(profile.full_name), ''), profile.email, 'Workspace') || ' Workspace',
  profile.id,
  COALESCE(profile.created_at, NOW()),
  NOW()
FROM public.profiles AS profile
WHERE NOT EXISTS (
  SELECT 1
  FROM public.organizations AS organization
  WHERE organization.owner_id = profile.id
);

UPDATE public.profiles AS profile
SET current_organization_id = organization.id,
    updated_at = NOW()
FROM public.organizations AS organization
WHERE organization.owner_id = profile.id
  AND profile.current_organization_id IS NULL;

INSERT INTO public.organization_members (
  organization_id,
  user_id,
  role,
  status,
  joined_at,
  created_at,
  updated_at
)
SELECT
  profile.current_organization_id,
  profile.id,
  'owner',
  'active',
  COALESCE(profile.created_at, NOW()),
  COALESCE(profile.created_at, NOW()),
  NOW()
FROM public.profiles AS profile
WHERE profile.current_organization_id IS NOT NULL
ON CONFLICT (organization_id, user_id) DO UPDATE
SET role = 'owner',
    status = 'active',
    updated_at = NOW();

ALTER TABLE public.borrowers
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.repayments
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

UPDATE public.borrowers AS borrower
SET organization_id = profile.current_organization_id
FROM public.profiles AS profile
WHERE borrower.user_id = profile.id
  AND borrower.organization_id IS NULL;

UPDATE public.loans AS loan
SET organization_id = profile.current_organization_id
FROM public.profiles AS profile
WHERE loan.user_id = profile.id
  AND loan.organization_id IS NULL;

UPDATE public.repayments AS repayment
SET organization_id = profile.current_organization_id
FROM public.profiles AS profile
WHERE repayment.user_id = profile.id
  AND repayment.organization_id IS NULL;

UPDATE public.subscriptions AS subscription
SET organization_id = profile.current_organization_id
FROM public.profiles AS profile
WHERE subscription.user_id = profile.id
  AND subscription.organization_id IS NULL;

UPDATE public.payments AS payment
SET organization_id = profile.current_organization_id
FROM public.profiles AS profile
WHERE payment.user_id = profile.id
  AND payment.organization_id IS NULL;

ALTER TABLE public.borrowers
  ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.loans
  ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.repayments
  ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.subscriptions
  ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_owner_id
  ON public.organizations(owner_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_user_id
  ON public.organization_members(user_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id
  ON public.organization_members(organization_id);

CREATE INDEX IF NOT EXISTS idx_profiles_current_organization_id
  ON public.profiles(current_organization_id);

CREATE INDEX IF NOT EXISTS idx_borrowers_organization_id
  ON public.borrowers(organization_id);

CREATE INDEX IF NOT EXISTS idx_loans_organization_id
  ON public.loans(organization_id);

CREATE INDEX IF NOT EXISTS idx_repayments_organization_id
  ON public.repayments(organization_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id
  ON public.subscriptions(organization_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_organization_unique
  ON public.subscriptions(organization_id);

CREATE INDEX IF NOT EXISTS idx_payments_organization_id
  ON public.payments(organization_id);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_organization_member(target_organization_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members AS member
    WHERE member.organization_id = target_organization_id
      AND member.user_id = auth.uid()
      AND member.status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_manage_organization(target_organization_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members AS member
    WHERE member.organization_id = target_organization_id
      AND member.user_id = auth.uid()
      AND member.role IN ('owner', 'admin')
      AND member.status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS "Organization members can view organizations" ON public.organizations;
CREATE POLICY "Organization members can view organizations" ON public.organizations
  FOR SELECT USING (public.is_organization_member(id));

DROP POLICY IF EXISTS "Organization managers can update organizations" ON public.organizations;
CREATE POLICY "Organization managers can update organizations" ON public.organizations
  FOR UPDATE USING (public.can_manage_organization(id));

DROP POLICY IF EXISTS "Organization members can view memberships" ON public.organization_members;
CREATE POLICY "Organization members can view memberships" ON public.organization_members
  FOR SELECT USING (public.is_organization_member(organization_id));

DROP POLICY IF EXISTS "Organization managers can insert memberships" ON public.organization_members;
CREATE POLICY "Organization managers can insert memberships" ON public.organization_members
  FOR INSERT WITH CHECK (public.can_manage_organization(organization_id));

DROP POLICY IF EXISTS "Organization managers can update memberships" ON public.organization_members;
CREATE POLICY "Organization managers can update memberships" ON public.organization_members
  FOR UPDATE USING (public.can_manage_organization(organization_id));

DROP POLICY IF EXISTS "Organization managers can delete memberships" ON public.organization_members;
CREATE POLICY "Organization managers can delete memberships" ON public.organization_members
  FOR DELETE USING (public.can_manage_organization(organization_id));

DROP POLICY IF EXISTS "Organization members can view teammate profiles" ON public.profiles;
CREATE POLICY "Organization members can view teammate profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1
      FROM public.organization_members AS current_member
      JOIN public.organization_members AS teammate
        ON teammate.organization_id = current_member.organization_id
      WHERE current_member.user_id = auth.uid()
        AND current_member.status = 'active'
        AND teammate.user_id = profiles.id
        AND teammate.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can view own borrowers" ON public.borrowers;
DROP POLICY IF EXISTS "Users can insert own borrowers" ON public.borrowers;
DROP POLICY IF EXISTS "Users can update own borrowers" ON public.borrowers;
DROP POLICY IF EXISTS "Users can delete own borrowers" ON public.borrowers;

CREATE POLICY "Organization members can view borrowers" ON public.borrowers
  FOR SELECT USING (public.is_organization_member(organization_id));

CREATE POLICY "Organization members can insert borrowers" ON public.borrowers
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.is_organization_member(organization_id)
  );

CREATE POLICY "Organization members can update borrowers" ON public.borrowers
  FOR UPDATE USING (public.is_organization_member(organization_id));

CREATE POLICY "Organization members can delete borrowers" ON public.borrowers
  FOR DELETE USING (public.is_organization_member(organization_id));

DROP POLICY IF EXISTS "Users can view own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can insert own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can update own loans" ON public.loans;
DROP POLICY IF EXISTS "Users can delete own loans" ON public.loans;

CREATE POLICY "Organization members can view loans" ON public.loans
  FOR SELECT USING (public.is_organization_member(organization_id));

CREATE POLICY "Organization members can insert loans" ON public.loans
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.is_organization_member(organization_id)
  );

CREATE POLICY "Organization members can update loans" ON public.loans
  FOR UPDATE USING (public.is_organization_member(organization_id));

CREATE POLICY "Organization members can delete loans" ON public.loans
  FOR DELETE USING (public.is_organization_member(organization_id));

DROP POLICY IF EXISTS "Users can view own repayments" ON public.repayments;
DROP POLICY IF EXISTS "Users can insert own repayments" ON public.repayments;
DROP POLICY IF EXISTS "Users can update own repayments" ON public.repayments;
DROP POLICY IF EXISTS "Users can delete own repayments" ON public.repayments;

CREATE POLICY "Organization members can view repayments" ON public.repayments
  FOR SELECT USING (public.is_organization_member(organization_id));

CREATE POLICY "Organization members can insert repayments" ON public.repayments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.is_organization_member(organization_id)
  );

CREATE POLICY "Organization members can update repayments" ON public.repayments
  FOR UPDATE USING (public.is_organization_member(organization_id));

CREATE POLICY "Organization members can delete repayments" ON public.repayments
  FOR DELETE USING (public.is_organization_member(organization_id));

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Organization members can view subscription" ON public.subscriptions
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_organization_member(organization_id)
  );

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_organization_member(organization_id)
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_organization_id UUID;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = NOW();

  SELECT current_organization_id
  INTO new_organization_id
  FROM public.profiles
  WHERE id = NEW.id;

  IF new_organization_id IS NULL THEN
    INSERT INTO public.organizations (name, owner_id)
    VALUES (
      COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), NEW.email, 'Workspace') || ' Workspace',
      NEW.id
    )
    RETURNING id INTO new_organization_id;

    UPDATE public.profiles
    SET current_organization_id = new_organization_id,
        updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  INSERT INTO public.organization_members (organization_id, user_id, role, status)
  VALUES (new_organization_id, NEW.id, 'owner', 'active')
  ON CONFLICT (organization_id, user_id) DO UPDATE
    SET role = 'owner',
        status = 'active',
        updated_at = NOW();

  INSERT INTO public.subscriptions (user_id, organization_id, plan, status, billing_cycle, price)
  VALUES (NEW.id, new_organization_id, 'free', 'active', 'monthly', 0)
  ON CONFLICT (user_id) DO UPDATE
    SET organization_id = COALESCE(public.subscriptions.organization_id, EXCLUDED.organization_id),
        updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
