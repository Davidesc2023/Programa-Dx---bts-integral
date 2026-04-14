/**
 * Catch-all API proxy route.
 *
 * All requests to /api/* from the browser are handled here at RUNTIME.
 * The BACKEND_URL env var is read on every request, so it never gets
 * baked incorrectly at build time (unlike next.config.mjs rewrites).
 *
 * Browser → Vercel /api/auth/login
 *         → this handler
 *         → Railway /auth/login
 */
import { type NextRequest, NextResponse } from 'next/server';

const BACKEND =
  process.env.BACKEND_URL ??
  'https://programa-dx-bts-integral-production.up.railway.app';

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
