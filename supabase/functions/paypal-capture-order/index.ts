import { corsHeaders, errorResponse, handleFunctionError, jsonResponse } from '../_shared/cors.ts';
import { capturePayPalOrder } from '../_shared/paypal.ts';
import { isPaidSubscriptionPlanId } from '../_shared/plans.ts';
import { requireUser, syncSubscriptionForUser } from '../_shared/supabase.ts';

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

    const capture = await capturePayPalOrder(orderId, user.id, plan);
    const subscription = await syncSubscriptionForUser(user.id, plan);

    return jsonResponse({
      captureId: capture.captureId,
      subscription,
    });
  } catch (error) {
    return handleFunctionError(error);
  }
});
