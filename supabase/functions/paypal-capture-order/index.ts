import { corsHeaders, errorResponse, handleFunctionError, jsonResponse } from '../_shared/cors.ts';
import { capturePayPalOrder } from '../_shared/paypal.ts';
import { isPaidSubscriptionPlanId } from '../_shared/plans.ts';
import {
  requireUser,
  requireWorkspaceManager,
  savePaymentRecord,
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
    const orderId = body?.orderId;
    const plan = body?.plan;

    if (typeof orderId !== 'string' || !orderId.trim()) {
      return errorResponse('A valid PayPal order ID is required.', 400);
    }

    if (!isPaidSubscriptionPlanId(plan)) {
      return errorResponse('A paid plan is required to capture a PayPal order.', 400);
    }

    const workspace = await requireWorkspaceManager(user.id);
    const capture = await capturePayPalOrder(orderId, user.id, plan);
    await savePaymentRecord({
      userId: user.id,
      organizationId: workspace.id,
      orderId: capture.orderId,
      captureId: capture.captureId,
      planId: plan,
      amount: capture.amount,
      currency: capture.currency,
      paidAt: capture.paidAt,
    });
    const subscription = await syncSubscriptionForUser(user.id, plan);

    return jsonResponse({
      captureId: capture.captureId,
      subscription,
    });
  } catch (error) {
    return handleFunctionError(error);
  }
});
