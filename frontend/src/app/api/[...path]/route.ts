/**
 * Catch-all API proxy route.
 *
 * All browser requests to /api/* are handled here at RUNTIME and proxied to BACKEND_URL.
 * BACKEND_URL is set in Vercel environment variables (Settings → Environment Variables).
 *
 * Browser → Vercel /api/auth/login → this handler → NestJS /auth/login
 */
import { type NextRequest, NextResponse } from 'next/server';

const BACKEND =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  'http://localhost:3000';

const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';

type Ctx = { params: { path: string[] } };

// Drop hop-by-hop, auto-calculated, and spoofable internal headers
const SKIP_REQUEST_HEADERS = new Set([
  'host', 'connection', 'keep-alive', 'transfer-encoding',
  'content-length', 'content-encoding',
  'x-user-token', // always stripped — proxy sets this itself after auth, never trust client-supplied value
]);

const SKIP_RESPONSE_HEADERS = new Set([
  'transfer-encoding', 'connection', 'content-encoding',
]);

async function proxy(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const segments = (ctx.params.path ?? []).join('/');
  const search = req.nextUrl.search;
  const target = `${BACKEND}/${segments}${search}`;

  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (!SKIP_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  // Supabase gateway rejects custom app JWTs (UNAUTHORIZED_LEGACY_JWT).
  // Fix: always send anon key in Authorization (satisfies gateway), and move
  // the user's JWT to x-user-token so requireAuth() in the Edge Function can read it.
  if (SUPABASE_ANON_KEY) {
    const userJwt = headers['authorization'];
    headers['authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    if (userJwt) headers['x-user-token'] = userJwt;
  }

  let body: BodyInit | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    // arrayBuffer preserves binary data (multipart uploads), works equally for JSON
    body = await req.arrayBuffer();
  }

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
  });

  // Buffer response to avoid streaming issues in serverless
  const responseBody = await upstream.arrayBuffer();

  const resHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) {
      resHeaders.set(key, value);
    }
  });

  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
