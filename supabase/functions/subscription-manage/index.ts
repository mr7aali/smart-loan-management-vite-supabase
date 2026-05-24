import { corsHeaders, errorResponse, handleFunctionError, jsonResponse } from '../_shared/cors.ts';
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

    if (body?.plan !== 'free') {
      return errorResponse('Only free plan changes are supported by this endpoint.', 400);
    }

    const subscription = await syncSubscriptionForUser(user.id, 'free');
    return jsonResponse({ subscription });
  } catch (error) {
    return handleFunctionError(error);
  }
});
