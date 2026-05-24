import { corsHeaders, errorResponse, handleFunctionError, jsonResponse } from '../_shared/cors.ts';
import { createPayPalOrder } from '../_shared/paypal.ts';
import { isPaidSubscriptionPlanId } from '../_shared/plans.ts';
import { requireUser } from '../_shared/supabase.ts';

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

    if (!isPaidSubscriptionPlanId(plan)) {
      return errorResponse('A paid plan is required to create a PayPal order.', 400);
    }

    const orderId = await createPayPalOrder(user.id, plan);
    return jsonResponse({ orderId });
  } catch (error) {
    return handleFunctionError(error);
  }
});
