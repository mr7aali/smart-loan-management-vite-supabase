import { corsHeaders, errorResponse, handleFunctionError, jsonResponse } from '../_shared/cors.ts';
import { createPayPalOrder } from '../_shared/paypal.ts';
import { isPaidSubscriptionPlanId } from '../_shared/plans.ts';
import { requireUser, requireWorkspaceManager } from '../_shared/supabase.ts';

function validateCheckoutUrl(value: unknown, originHeader: string | null, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    return { error: `${label} is required.` };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { error: `${label} must be a valid URL.` };
  }

  const isLocalhost =
    url.protocol === 'http:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1');

  if (url.protocol !== 'https:' && !isLocalhost) {
    return { error: `${label} must use https in production.` };
  }

  if (originHeader) {
    try {
      const requestOrigin = new URL(originHeader).origin;
      if (url.origin !== requestOrigin) {
        return { error: `${label} must match the app origin.` };
      }
    } catch {
      return { error: 'Could not validate the app origin for this PayPal checkout.' };
    }
  }

  return { value: url.toString() };
}

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
    const originHeader = req.headers.get('origin');

    if (!isPaidSubscriptionPlanId(plan)) {
      return errorResponse('A paid plan is required to create a PayPal order.', 400);
    }

    await requireWorkspaceManager(user.id);

    const validatedReturnUrl = validateCheckoutUrl(
      body?.returnUrl,
      originHeader,
      'A PayPal return URL',
    );
    if (!validatedReturnUrl.value) {
      return errorResponse(validatedReturnUrl.error ?? 'Invalid PayPal return URL.', 400);
    }

    const validatedCancelUrl = validateCheckoutUrl(
      body?.cancelUrl,
      originHeader,
      'A PayPal cancel URL',
    );
    if (!validatedCancelUrl.value) {
      return errorResponse(validatedCancelUrl.error ?? 'Invalid PayPal cancel URL.', 400);
    }

    const order = await createPayPalOrder(
      user.id,
      plan,
      validatedReturnUrl.value,
      validatedCancelUrl.value,
    );
    return jsonResponse(order);
  } catch (error) {
    return handleFunctionError(error);
  }
});
