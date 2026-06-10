export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

const defaultAllowedHeaders =
  'authorization, x-client-info, apikey, content-type, accept, origin, referer, user-agent, x-supabase-api-version';

export function getCorsHeaders(req?: Request) {
  const origin = req?.headers.get('origin') || '*';
  const requestedHeaders = req?.headers.get('access-control-request-headers');

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': requestedHeaders || defaultAllowedHeaders,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin, Access-Control-Request-Headers',
  };
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': defaultAllowedHeaders,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

export function optionsResponse(req?: Request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export function jsonResponse(data: unknown, init?: ResponseInit, req?: Request) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...getCorsHeaders(req),
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

export function errorResponse(message: string, status = 400, req?: Request) {
  return jsonResponse({ error: message }, { status }, req);
}

export function handleFunctionError(error: unknown, req?: Request) {
  if (error instanceof HttpError) {
    return errorResponse(error.message, error.status, req);
  }

  if (error instanceof Error) {
    console.error(error);
    return errorResponse(error.message, 500, req);
  }

  console.error(error);
  return errorResponse('Unexpected server error.', 500, req);
}
