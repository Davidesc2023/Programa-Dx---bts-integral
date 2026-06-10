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

const SKIP_HEADERS = new Set(['host', 'connection', 'keep-alive', 'transfer-encoding']);

async function proxy(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const segments = (ctx.params.path ?? []).join('/');
  const search = req.nextUrl.search;
  const target = `${BACKEND}/${segments}${search}`;

  // Forward headers (drop hop-by-hop headers that don't cross proxies)
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (!SKIP_HEADERS.has(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  // Buffer body for non-GET/HEAD requests
  let body: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.text();
  }

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
  });

  // Forward response headers (drop hop-by-hop)
  const resHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (key !== 'transfer-encoding' && key !== 'connection') {
      resHeaders.set(key, value);
    }
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
