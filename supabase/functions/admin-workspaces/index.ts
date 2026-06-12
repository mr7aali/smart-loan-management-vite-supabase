import {
  errorResponse,
  handleFunctionError,
  jsonResponse,
  optionsResponse,
} from '../_shared/cors.ts';
import {
  createAdminClient,
  requireAdminUser,
} from '../_shared/supabase.ts';

type AdminWorkspaceAction = 'list' | 'addMember' | 'removeMember' | 'changeRole';
type WorkspaceRole = 'owner' | 'admin' | 'member';

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

async function recordAuditEvent(input: {
  organizationId: string;
  actorUserId: string;
  targetUserId?: string | null;
  action: string;
  details?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from('audit_events').insert({
    organization_id: input.organizationId,
    actor_user_id: input.actorUserId,
    target_user_id: input.targetUserId || null,
    entity_type: 'workspace',
    entity_id: input.organizationId,
    action: input.action,
    details: input.details || {},
  });

  if (error) {
    throw new Error(`Failed to record workspace audit event: ${error.message}`);
  }
}

async function getMemberRows(organizationIds: string[]) {
  if (organizationIds.length === 0) return [];

  const admin = createAdminClient();
  const { data: memberships, error: membershipsError } = await admin
    .from('organization_members')
    .select('id, organization_id, user_id, role, status, joined_at, created_at')
    .in('organization_id', organizationIds)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (membershipsError) {
    throw new Error(`Failed to load workspace members: ${membershipsError.message}`);
  }

  const userIds = Array.from(new Set((memberships ?? []).map((member) => member.user_id as string)));
  const { data: profiles, error: profilesError } = userIds.length > 0
    ? await admin.from('profiles').select('id, email, full_name').in('id', userIds)
    : { data: [], error: null };

  if (profilesError) {
    throw new Error(`Failed to load member profiles: ${profilesError.message}`);
  }

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id as string, profile]));

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

async function listWorkspaces() {
  const admin = createAdminClient();
  const [
    { data: organizations, error: organizationsError },
    { data: borrowers, error: borrowersError },
    { data: loans, error: loansError },
  ] = await Promise.all([
    admin
      .from('organizations')
      .select('id, name, owner_id, created_at')
      .order('created_at', { ascending: false }),
    admin
      .from('borrowers')
      .select('organization_id, approval_status'),
    admin
      .from('loans')
      .select('organization_id, approval_status'),
  ]);

  if (organizationsError || borrowersError || loansError) {
    throw new Error(
      organizationsError?.message ||
        borrowersError?.message ||
        loansError?.message ||
        'Failed to load workspaces.',
    );
  }

  const workspaceIds = (organizations ?? []).map((workspace) => workspace.id as string);
  const ownerIds = Array.from(new Set((organizations ?? []).map((workspace) => workspace.owner_id as string)));
  const [{ data: owners, error: ownersError }, members] = await Promise.all([
    ownerIds.length > 0
      ? admin.from('profiles').select('id, email, full_name').in('id', ownerIds)
      : { data: [], error: null },
    getMemberRows(workspaceIds),
  ]);

  if (ownersError) {
    throw new Error(`Failed to load workspace owners: ${ownersError.message}`);
  }

  const ownerById = new Map((owners ?? []).map((owner) => [owner.id as string, owner]));
  const membersByWorkspace = new Map<string, typeof members>();
  for (const member of members) {
    const bucket = membersByWorkspace.get(member.organization_id) ?? [];
    bucket.push(member);
    membersByWorkspace.set(member.organization_id, bucket);
  }

  const statsByWorkspace = new Map<
    string,
    { borrowerCount: number; loanCount: number; pendingApprovals: number }
  >();

  for (const borrower of borrowers ?? []) {
    const workspaceId = borrower.organization_id as string;
    const stats = statsByWorkspace.get(workspaceId) ?? {
      borrowerCount: 0,
      loanCount: 0,
      pendingApprovals: 0,
    };
    stats.borrowerCount += 1;
    if (borrower.approval_status === 'pending') stats.pendingApprovals += 1;
    statsByWorkspace.set(workspaceId, stats);
  }

  for (const loan of loans ?? []) {
    const workspaceId = loan.organization_id as string;
    const stats = statsByWorkspace.get(workspaceId) ?? {
      borrowerCount: 0,
      loanCount: 0,
      pendingApprovals: 0,
    };
    stats.loanCount += 1;
    if (loan.approval_status === 'pending') stats.pendingApprovals += 1;
    statsByWorkspace.set(workspaceId, stats);
  }

  const workspaces = (organizations ?? []).map((workspace) => {
    const owner = ownerById.get(workspace.owner_id as string);
    const stats = statsByWorkspace.get(workspace.id as string) ?? {
      borrowerCount: 0,
      loanCount: 0,
      pendingApprovals: 0,
    };
    const workspaceMembers = membersByWorkspace.get(workspace.id as string) ?? [];

    return {
      id: workspace.id,
      name: workspace.name,
      ownerId: workspace.owner_id,
      ownerName: owner?.full_name || owner?.email?.split('@')[0] || 'Unknown owner',
      ownerEmail: owner?.email || 'No email',
      memberCount: workspaceMembers.length,
      borrowerCount: stats.borrowerCount,
      loanCount: stats.loanCount,
      pendingApprovals: stats.pendingApprovals,
      createdAt: workspace.created_at,
      members: workspaceMembers,
    };
  });

  return { workspaces };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req);
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed.', 405, req);
  }

  try {
    const adminUser = await requireAdminUser(req);
    const body = await req.json();
    const action = body?.action as AdminWorkspaceAction | undefined;

    if (!action || !['list', 'addMember', 'removeMember', 'changeRole'].includes(action)) {
      return errorResponse('Unsupported admin workspace action.', 400, req);
    }

    if (action === 'list') {
      return jsonResponse(await listWorkspaces(), undefined, req);
    }

    const admin = createAdminClient();
    const organizationId = getString(body?.organizationId);
    if (!organizationId) {
      return errorResponse('A workspace ID is required.', 400, req);
    }

    const { data: workspace, error: workspaceError } = await admin
      .from('organizations')
      .select('id, owner_id')
      .eq('id', organizationId)
      .maybeSingle();

    if (workspaceError) {
      return errorResponse(`Failed to load workspace: ${workspaceError.message}`, 500, req);
    }

    if (!workspace) {
      return errorResponse('Workspace not found.', 404, req);
    }

    if (action === 'addMember') {
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
        return errorResponse('No account exists for that email yet.', 404, req);
      }

      const { error: memberError } = await admin
        .from('organization_members')
        .upsert(
          {
            organization_id: organizationId,
            user_id: profile.id,
            role: 'member',
            status: 'active',
            invited_by: adminUser.id,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id,user_id' },
        );

      if (memberError) {
        return errorResponse(`Failed to add workspace member: ${memberError.message}`, 500, req);
      }

      await admin
        .from('profiles')
        .update({
          current_organization_id: organizationId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      await recordAuditEvent({
        organizationId,
        actorUserId: adminUser.id,
        targetUserId: profile.id,
        action: 'admin_member_added',
        details: { email },
      });

      return jsonResponse(await listWorkspaces(), undefined, req);
    }

    const memberId = getString(body?.memberId);
    if (!memberId) {
      return errorResponse('A member ID is required.', 400, req);
    }

    const { data: membership, error: membershipError } = await admin
      .from('organization_members')
      .select('id, user_id, role')
      .eq('id', memberId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (membershipError) {
      return errorResponse(`Failed to load membership: ${membershipError.message}`, 500, req);
    }

    if (!membership) {
      return errorResponse('Workspace member not found.', 404, req);
    }

    if (action === 'removeMember') {
      if (membership.role === 'owner') {
        return errorResponse('Change the owner before removing this member.', 400, req);
      }

      const { error: deleteError } = await admin
        .from('organization_members')
        .delete()
        .eq('id', memberId)
        .eq('organization_id', organizationId);

      if (deleteError) {
        return errorResponse(`Failed to remove workspace member: ${deleteError.message}`, 500, req);
      }

      const { data: fallbackWorkspace } = await admin
        .from('organizations')
        .select('id')
        .eq('owner_id', membership.user_id)
        .limit(1)
        .maybeSingle();

      await admin
        .from('profiles')
        .update({
          current_organization_id: fallbackWorkspace?.id ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', membership.user_id);

      await recordAuditEvent({
        organizationId,
        actorUserId: adminUser.id,
        targetUserId: membership.user_id,
        action: 'admin_member_removed',
        details: { previousRole: membership.role },
      });

      return jsonResponse(await listWorkspaces(), undefined, req);
    }

    const nextRole = body?.role as WorkspaceRole | undefined;
    if (!nextRole || !['owner', 'admin', 'member'].includes(nextRole)) {
      return errorResponse('A valid workspace role is required.', 400, req);
    }

    const nowIso = new Date().toISOString();
    if (nextRole === 'owner') {
      await admin
        .from('organization_members')
        .update({ role: 'member', updated_at: nowIso })
        .eq('organization_id', organizationId)
        .eq('role', 'owner');

      const { error: ownerUpdateError } = await admin
        .from('organizations')
        .update({ owner_id: membership.user_id, updated_at: nowIso })
        .eq('id', organizationId);

      if (ownerUpdateError) {
        return errorResponse(`Failed to transfer owner: ${ownerUpdateError.message}`, 500, req);
      }
    }

    const { error: roleUpdateError } = await admin
      .from('organization_members')
      .update({ role: nextRole, updated_at: nowIso })
      .eq('id', memberId)
      .eq('organization_id', organizationId);

    if (roleUpdateError) {
      return errorResponse(`Failed to update member role: ${roleUpdateError.message}`, 500, req);
    }

    await recordAuditEvent({
      organizationId,
      actorUserId: adminUser.id,
      targetUserId: membership.user_id,
      action: nextRole === 'owner' ? 'admin_owner_transferred' : 'admin_member_role_changed',
      details: { previousRole: membership.role, nextRole },
    });

    return jsonResponse(await listWorkspaces(), undefined, req);
  } catch (error) {
    return handleFunctionError(error, req);
  }
});
