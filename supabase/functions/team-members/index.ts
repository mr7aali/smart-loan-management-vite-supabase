import { errorResponse, handleFunctionError, jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { PLAN_DETAILS } from '../_shared/plans.ts';
import {
  createAdminClient,
  getWorkspaceForUser,
  requireUser,
} from '../_shared/supabase.ts';

type TeamAction = 'list' | 'add' | 'remove';

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

async function getMembers(organizationId: string) {
  const admin = createAdminClient();
  const { data: memberships, error: membershipsError } = await admin
    .from('organization_members')
    .select('id, organization_id, user_id, role, status, joined_at, created_at')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (membershipsError) {
    throw new Error(`Failed to load team members: ${membershipsError.message}`);
  }

  const userIds = (memberships ?? []).map((member) => member.user_id as string);
  const { data: profiles, error: profilesError } =
    userIds.length > 0
      ? await admin
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds)
      : { data: [], error: null };

  if (profilesError) {
    throw new Error(`Failed to load member profiles: ${profilesError.message}`);
  }

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id as string, profile]),
  );

  return (memberships ?? []).map((member) => {
    const profile = profileById.get(member.user_id as string);
    return {
      id: member.id,
      organization_id: member.organization_id,
      user_id: member.user_id,
      role: member.role,
      status: member.status,
      email: profile?.email ?? null,
      fullName: profile?.full_name ?? null,
      joined_at: member.joined_at,
      created_at: member.created_at,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req);
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed.', 405, req);
  }

  try {
    const user = await requireUser(req);
    const body = await req.json();
    const action = body?.action as TeamAction | undefined;

    if (!action || !['list', 'add', 'remove'].includes(action)) {
      return errorResponse('Unsupported team action.', 400, req);
    }

    const admin = createAdminClient();
    const workspace = await getWorkspaceForUser(user.id);
    const canManage =
      workspace.currentUserRole === 'owner' ||
      workspace.currentUserRole === 'admin';

    if (action === 'list') {
      const members = await getMembers(workspace.id);
      return jsonResponse({ workspace, members }, undefined, req);
    }

    if (!canManage) {
      return errorResponse('Only a workspace owner or admin can manage members.', 403, req);
    }

    if (action === 'add') {
      const email = normalizeEmail(body?.email);
      if (!email) {
        return errorResponse('A member email is required.', 400, req);
      }

      const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select('id, email')
        .ilike('email', email)
        .maybeSingle();

      if (profileError) {
        return errorResponse(`Failed to find user: ${profileError.message}`, 500, req);
      }

      if (!profile) {
        return errorResponse(
          'No account exists for that email yet. Ask the member to sign up first, then add them here.',
          404,
          req,
        );
      }

      const { data: existingMembership, error: existingMembershipError } =
        await admin
          .from('organization_members')
          .select('id')
          .eq('organization_id', workspace.id)
          .eq('user_id', profile.id)
          .eq('status', 'active')
          .maybeSingle();

      if (existingMembershipError) {
        return errorResponse(
          `Failed to check existing membership: ${existingMembershipError.message}`,
          500,
          req,
        );
      }

      if (existingMembership) {
        const members = await getMembers(workspace.id);
        return jsonResponse({ workspace, members }, undefined, req);
      }

      const { data: subscription, error: subscriptionError } = await admin
        .from('subscriptions')
        .select('plan')
        .eq('organization_id', workspace.id)
        .maybeSingle();

      if (subscriptionError) {
        return errorResponse(
          `Failed to check subscription seats: ${subscriptionError.message}`,
          500,
          req,
        );
      }

      const planId = subscription?.plan ?? 'free';
      const plan = PLAN_DETAILS[planId as keyof typeof PLAN_DETAILS] ?? PLAN_DETAILS.free;
      const { count, error: countError } = await admin
        .from('organization_members')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', workspace.id)
        .eq('status', 'active');

      if (countError) {
        return errorResponse(`Failed to count team members: ${countError.message}`, 500, req);
      }

      if (plan.maxUsers !== null && (count ?? 0) >= plan.maxUsers) {
        return errorResponse(
          `The ${plan.name} plan allows up to ${plan.maxUsers} users. Upgrade before adding another member.`,
          400,
          req,
        );
      }

      const { error: memberError } = await admin
        .from('organization_members')
        .upsert(
          {
            organization_id: workspace.id,
            user_id: profile.id,
            role: 'member',
            status: 'active',
            invited_by: user.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id,user_id' },
        );

      if (memberError) {
        return errorResponse(`Failed to add team member: ${memberError.message}`, 500, req);
      }

      await admin
        .from('profiles')
        .update({
          current_organization_id: workspace.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      const members = await getMembers(workspace.id);
      return jsonResponse({ workspace, members }, undefined, req);
    }

    const memberId = typeof body?.memberId === 'string' ? body.memberId : '';
    if (!memberId) {
      return errorResponse('A member ID is required.', 400, req);
    }

    const { data: membership, error: lookupError } = await admin
      .from('organization_members')
      .select('id, user_id, role')
      .eq('id', memberId)
      .eq('organization_id', workspace.id)
      .maybeSingle();

    if (lookupError) {
      return errorResponse(`Failed to find team member: ${lookupError.message}`, 500, req);
    }

    if (!membership) {
      return errorResponse('Team member not found.', 404, req);
    }

    if (membership.role === 'owner') {
      return errorResponse('The workspace owner cannot be removed.', 400, req);
    }

    const { error: deleteError } = await admin
      .from('organization_members')
      .delete()
      .eq('id', memberId)
      .eq('organization_id', workspace.id);

    if (deleteError) {
      return errorResponse(`Failed to remove team member: ${deleteError.message}`, 500, req);
    }

    const { data: ownedWorkspace } = await admin
      .from('organizations')
      .select('id')
      .eq('owner_id', membership.user_id)
      .limit(1)
      .maybeSingle();

    if (ownedWorkspace?.id) {
      await admin
        .from('profiles')
        .update({
          current_organization_id: ownedWorkspace.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', membership.user_id);
    }

    const members = await getMembers(workspace.id);
    return jsonResponse({ workspace, members }, undefined, req);
  } catch (error) {
    return handleFunctionError(error, req);
  }
});
