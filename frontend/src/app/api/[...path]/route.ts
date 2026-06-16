/**
 * Catch-all API proxy route.
 *
 * All browser requests to /api/* are handled here at RUNTIME and proxied to BACKEND_URL.
 * BACKEND_URL is set in Vercel environment variables (Settings → Environment Variables).
 *
 * Browser → Vercel /api/auth/login → this handler → NestJS /auth/login
 */
import { type NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3000';

type Ctx = { params: { path: string[] } };

// Drop hop-by-hop and auto-calculated headers that must not be forwarded
const SKIP_REQUEST_HEADERS = new Set([
  'host', 'connection', 'keep-alive', 'transfer-encoding',
  'content-length', 'content-encoding',
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
