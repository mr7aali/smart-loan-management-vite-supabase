-- Keep subscriptions attached to their workspace and workspace owner.
-- Safe to run more than once after the organization workspace migration.

UPDATE public.subscriptions AS subscription
SET organization_id = profile.current_organization_id,
    updated_at = NOW()
FROM public.profiles AS profile
WHERE subscription.user_id = profile.id
  AND subscription.organization_id IS NULL
  AND profile.current_organization_id IS NOT NULL;

UPDATE public.subscriptions AS subscription
SET user_id = organization.owner_id,
    updated_at = NOW()
FROM public.organizations AS organization
WHERE subscription.organization_id = organization.id
  AND subscription.user_id IS DISTINCT FROM organization.owner_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_organization_unique
  ON public.subscriptions(organization_id);

ALTER TABLE public.subscriptions
  ALTER COLUMN organization_id SET NOT NULL;

NOTIFY pgrst, 'reload schema';
