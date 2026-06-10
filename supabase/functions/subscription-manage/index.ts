import { corsHeaders, errorResponse, handleFunctionError, jsonResponse } from '../_shared/cors.ts';
import { PLAN_DETAILS, isSubscriptionPlanId } from '../_shared/plans.ts';
import {
  createAdminClient,
  requireUser,
  requireWorkspaceManager,
  syncSubscriptionForUser,
} from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed.', 405);
  }

  try {
    const user = await requireUser(req);
    const body = await req.json();
    const plan = body?.plan;

    if (!isSubscriptionPlanId(plan)) {
      return errorResponse('Unsupported subscription plan.', 400);
    }

    const admin = createAdminClient();
    const workspace = await requireWorkspaceManager(user.id);
    const [{ data: currentSubscription }, borrowersResult, loansResult] =
      await Promise.all([
        admin
          .from('subscriptions')
          .select('plan, status')
          .eq('organization_id', workspace.id)
          .maybeSingle(),
        admin
          .from('borrowers')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', workspace.id),
        admin
          .from('loans')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', workspace.id),
      ]);

    const { count: memberCount, error: membersError } = await admin
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', workspace.id)
      .eq('status', 'active');

    if (borrowersResult.error) {
      return errorResponse(
        `Failed to check borrower limits: ${borrowersResult.error.message}`,
        500,
      );
    }

    if (loansResult.error) {
      return errorResponse(
        `Failed to check loan limits: ${loansResult.error.message}`,
        500,
      );
    }

    if (membersError) {
      return errorResponse(
        `Failed to check team limits: ${membersError.message}`,
        500,
      );
    }

    const nextPlan = PLAN_DETAILS[plan];
    const borrowerCount = borrowersResult.count ?? 0;
    const loanCount = loansResult.count ?? 0;
    const teamCount = memberCount ?? 0;

    if (nextPlan.maxUsers !== null && teamCount > nextPlan.maxUsers) {
      return errorResponse(
        `The ${nextPlan.name} plan allows up to ${nextPlan.maxUsers} users. Remove members or choose a higher plan first.`,
        400,
      );
    }

    if (
      nextPlan.maxBorrowers !== null &&
      borrowerCount > nextPlan.maxBorrowers
    ) {
      return errorResponse(
        `The ${nextPlan.name} plan allows up to ${nextPlan.maxBorrowers} borrowers. Remove borrowers or choose a higher plan first.`,
        400,
      );
    }

    if (nextPlan.maxLoans !== null && loanCount > nextPlan.maxLoans) {
      return errorResponse(
        `The ${nextPlan.name} plan allows up to ${nextPlan.maxLoans} loans. Remove loans or choose a higher plan first.`,
        400,
      );
    }

    const currentPlanId = currentSubscription?.plan;
    const isFreeChange = plan === 'free';

    if (!isFreeChange) {
      if (
        !currentSubscription ||
        currentSubscription.status !== 'active' ||
        !isSubscriptionPlanId(currentPlanId)
      ) {
        return errorResponse('Paid upgrades require checkout.', 400);
      }

      const currentPlan = PLAN_DETAILS[currentPlanId];

      if (nextPlan.price > currentPlan.price) {
        return errorResponse('Paid upgrades require checkout.', 400);
      }
    }

    const subscription = await syncSubscriptionForUser(user.id, plan);
    return jsonResponse({ subscription });
  } catch (error) {
    return handleFunctionError(error);
  }
});
