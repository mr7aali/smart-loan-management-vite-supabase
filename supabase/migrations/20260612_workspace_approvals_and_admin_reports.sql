-- Add borrower/loan approval workflow and audit reporting for workspaces.

ALTER TABLE public.borrowers
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS initiated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS authorized_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS authorized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS initiated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS authorized_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS authorized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

UPDATE public.borrowers
SET
  approval_status = COALESCE(approval_status, 'approved'),
  initiated_by = COALESCE(initiated_by, user_id),
  initiated_at = COALESCE(initiated_at, created_at, NOW()),
  authorized_by = COALESCE(authorized_by, user_id),
  authorized_at = COALESCE(authorized_at, created_at, NOW())
WHERE approval_status = 'approved';

UPDATE public.loans
SET
  approval_status = COALESCE(approval_status, 'approved'),
  initiated_by = COALESCE(initiated_by, user_id),
  initiated_at = COALESCE(initiated_at, created_at, NOW()),
  authorized_by = COALESCE(authorized_by, user_id),
  authorized_at = COALESCE(authorized_at, created_at, NOW())
WHERE approval_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_borrowers_approval_status
  ON public.borrowers(organization_id, approval_status);

CREATE INDEX IF NOT EXISTS idx_loans_approval_status
  ON public.loans(organization_id, approval_status);

CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL CHECK (
    entity_type IN ('borrower', 'loan', 'workspace', 'member', 'user')
  ),
  entity_id UUID,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_organization_created
  ON public.audit_events(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor_created
  ON public.audit_events(actor_user_id, created_at DESC);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organization members can view audit events" ON public.audit_events;
CREATE POLICY "Organization members can view audit events" ON public.audit_events
  FOR SELECT USING (
    organization_id IS NOT NULL
    AND public.is_organization_member(organization_id)
  );

DROP POLICY IF EXISTS "Organization managers can insert audit events" ON public.audit_events;
CREATE POLICY "Organization managers can insert audit events" ON public.audit_events
  FOR INSERT WITH CHECK (
    organization_id IS NOT NULL
    AND public.can_manage_organization(organization_id)
  );

NOTIFY pgrst, 'reload schema';
