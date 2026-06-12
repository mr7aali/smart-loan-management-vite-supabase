import { errorResponse, handleFunctionError, jsonResponse, optionsResponse } from '../_shared/cors.ts';
import {
  createAdminClient,
  getWorkspaceForUser,
  requireUser,
} from '../_shared/supabase.ts';

type ApprovalAction =
  | 'list'
  | 'approveBorrower'
  | 'rejectBorrower'
  | 'approveLoan'
  | 'rejectLoan'
  | 'recordInitiated';

type ProfileSummary = {
  id: string;
  email: string | null;
  full_name: string | null;
};

function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getProfileSummary(
  profilesById: Map<string, ProfileSummary>,
  userId?: string | null,
) {
  if (!userId) return null;
  const profile = profilesById.get(userId);
  return {
    id: userId,
    name: profile?.full_name || profile?.email?.split('@')[0] || 'Unknown user',
    email: profile?.email || 'No email',
  };
}

async function loadProfiles(userIds: Array<string | null | undefined>) {
  const ids = Array.from(new Set(userIds.filter(Boolean) as string[]));
  if (ids.length === 0) return new Map<string, ProfileSummary>();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id, email, full_name')
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to load profiles: ${error.message}`);
  }

  return new Map((data ?? []).map((profile) => [profile.id as string, profile as ProfileSummary]));
}

async function recordAuditEvent(input: {
  organizationId: string;
  actorUserId: string;
  targetUserId?: string | null;
  entityType: 'borrower' | 'loan' | 'workspace' | 'member' | 'user';
  entityId?: string | null;
  action: string;
  details?: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from('audit_events').insert({
    organization_id: input.organizationId,
    actor_user_id: input.actorUserId,
    target_user_id: input.targetUserId || null,
    entity_type: input.entityType,
    entity_id: input.entityId || null,
    action: input.action,
    details: input.details || {},
  });

  if (error) {
    throw new Error(`Failed to record audit event: ${error.message}`);
  }
}

async function listWorkspaceActivity(organizationId: string) {
  const admin = createAdminClient();
  const [
    { data: borrowers, error: borrowersError },
    { data: loans, error: loansError },
    { data: auditEvents, error: auditError },
  ] = await Promise.all([
    admin
      .from('borrowers')
      .select('id, name, approval_status, initiated_by, initiated_at, authorized_by, authorized_at, rejection_reason')
      .eq('organization_id', organizationId)
      .order('initiated_at', { ascending: false }),
    admin
      .from('loans')
      .select('id, amount, approval_status, initiated_by, initiated_at, authorized_by, authorized_at, rejection_reason, borrowers(name)')
      .eq('organization_id', organizationId)
      .order('initiated_at', { ascending: false }),
    admin
      .from('audit_events')
      .select('id, organization_id, actor_user_id, target_user_id, entity_type, entity_id, action, details, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  if (borrowersError || loansError || auditError) {
    throw new Error(
      borrowersError?.message ||
        loansError?.message ||
        auditError?.message ||
        'Failed to load workspace activity.',
    );
  }

  const profileIds = [
    ...(borrowers ?? []).flatMap((item) => [item.initiated_by, item.authorized_by]),
    ...(loans ?? []).flatMap((item) => [item.initiated_by, item.authorized_by]),
    ...(auditEvents ?? []).flatMap((event) => [event.actor_user_id, event.target_user_id]),
  ];
  const profilesById = await loadProfiles(profileIds);

  const approvals = [
    ...(borrowers ?? []).map((borrower) => ({
      id: borrower.id,
      type: 'borrower',
      name: borrower.name,
      status: borrower.approval_status,
      initiatedAt: borrower.initiated_at,
      initiatedBy: getProfileSummary(profilesById, borrower.initiated_by),
      authorizedAt: borrower.authorized_at,
      authorizedBy: getProfileSummary(profilesById, borrower.authorized_by),
      rejectionReason: borrower.rejection_reason,
    })),
    ...(loans ?? []).map((loan) => {
      const borrower = Array.isArray(loan.borrowers) ? loan.borrowers[0] : loan.borrowers;
      return {
        id: loan.id,
        type: 'loan',
        name: `Loan ${String(loan.id).slice(-6)}`,
        amount: Number(loan.amount),
        borrowerName: borrower?.name ?? 'Unknown borrower',
        status: loan.approval_status,
        initiatedAt: loan.initiated_at,
        initiatedBy: getProfileSummary(profilesById, loan.initiated_by),
        authorizedAt: loan.authorized_at,
        authorizedBy: getProfileSummary(profilesById, loan.authorized_by),
        rejectionReason: loan.rejection_reason,
      };
    }),
  ].sort((first, second) => {
    const firstTime = new Date(first.initiatedAt || '').getTime() || 0;
    const secondTime = new Date(second.initiatedAt || '').getTime() || 0;
    return secondTime - firstTime;
  });

  const events = (auditEvents ?? []).map((event) => ({
    id: event.id,
    organization_id: event.organization_id,
    entityType: event.entity_type,
    entityId: event.entity_id,
    action: event.action,
    details: event.details || {},
    actor: getProfileSummary(profilesById, event.actor_user_id),
    target: getProfileSummary(profilesById, event.target_user_id),
    createdAt: event.created_at,
  }));

  return { approvals, events };
}

async function updateApproval(input: {
  userId: string;
  organizationId: string;
  entityType: 'borrower' | 'loan';
  entityId: string;
  approved: boolean;
  reason?: string;
}) {
  const admin = createAdminClient();
  const table = input.entityType === 'borrower' ? 'borrowers' : 'loans';
  const nowIso = new Date().toISOString();

  const { data: record, error: lookupError } = await admin
    .from(table)
    .select('id, approval_status, initiated_by, name, amount')
    .eq('id', input.entityId)
    .eq('organization_id', input.organizationId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed to find ${input.entityType}: ${lookupError.message}`);
  }

  if (!record) {
    return errorResponse(`${input.entityType} not found.`, 404);
  }

  if (record.approval_status !== 'pending') {
    return errorResponse(`Only pending ${input.entityType}s can be reviewed.`, 400);
  }

  const { data: updated, error: updateError } = await admin
    .from(table)
    .update({
      approval_status: input.approved ? 'approved' : 'rejected',
      authorized_by: input.userId,
      authorized_at: nowIso,
      rejection_reason: input.approved ? null : input.reason || 'Rejected by workspace owner.',
    })
    .eq('id', input.entityId)
    .eq('organization_id', input.organizationId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update ${input.entityType}: ${updateError.message}`);
  }

  await recordAuditEvent({
    organizationId: input.organizationId,
    actorUserId: input.userId,
    targetUserId: record.initiated_by,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.approved ? `${input.entityType}_approved` : `${input.entityType}_rejected`,
    details: {
      reason: input.approved ? undefined : input.reason || 'Rejected by workspace owner.',
      name: record.name,
      amount: record.amount,
    },
  });

  return jsonResponse({ item: updated });
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
    const action = body?.action as ApprovalAction | undefined;

    if (
      !action ||
      ![
        'list',
        'approveBorrower',
        'rejectBorrower',
        'approveLoan',
        'rejectLoan',
        'recordInitiated',
      ].includes(action)
    ) {
      return errorResponse('Unsupported workspace approval action.', 400, req);
    }

    const workspace = await getWorkspaceForUser(user.id);

    if (action === 'list') {
      const activity = await listWorkspaceActivity(workspace.id);
      return jsonResponse({ workspace, ...activity }, undefined, req);
    }

    if (action === 'recordInitiated') {
      const entityType = body?.entityType === 'loan' ? 'loan' : 'borrower';
      const entityId = getString(body?.entityId);
      if (!entityId) {
        return errorResponse('An entity ID is required.', 400, req);
      }

      await recordAuditEvent({
        organizationId: workspace.id,
        actorUserId: user.id,
        entityType,
        entityId,
        action: `${entityType}_initiated`,
        details: typeof body?.details === 'object' && body.details !== null ? body.details : {},
      });
      return jsonResponse({ ok: true }, undefined, req);
    }

    if (workspace.currentUserRole !== 'owner') {
      return errorResponse('Only the workspace owner can approve or reject initiated changes.', 403, req);
    }

    const entityId = getString(body?.entityId);
    if (!entityId) {
      return errorResponse('An entity ID is required.', 400, req);
    }

    if (action === 'approveBorrower' || action === 'rejectBorrower') {
      return await updateApproval({
        userId: user.id,
        organizationId: workspace.id,
        entityType: 'borrower',
        entityId,
        approved: action === 'approveBorrower',
        reason: getString(body?.reason),
      });
    }

    return await updateApproval({
      userId: user.id,
      organizationId: workspace.id,
      entityType: 'loan',
      entityId,
      approved: action === 'approveLoan',
      reason: getString(body?.reason),
    });
  } catch (error) {
    return handleFunctionError(error, req);
  }
});
