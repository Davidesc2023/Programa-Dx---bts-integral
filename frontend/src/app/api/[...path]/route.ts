import { type NextRequest, NextResponse } from 'next/server';

const BACKEND =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  'http://localhost:3000';

const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';
const IS_PROD = process.env.NODE_ENV === 'production';

type Ctx = { params: { path: string[] } };

// Headers hop-by-hop o que no deben propagarse al backend
const SKIP_REQUEST_HEADERS = new Set([
  'host', 'connection', 'keep-alive', 'transfer-encoding',
  'content-length', 'content-encoding',
  'x-user-token', // always stripped — proxy sets this from cookie, never trust client
]);

const SKIP_RESPONSE_HEADERS = new Set([
  'transfer-encoding', 'connection', 'content-encoding',
  'content-length', // recalculado por Next.js; puede ser incorrecto si modificamos el body
  'set-cookie',     // el proxy gestiona las cookies de auth; el backend no debe establecerlas
]);

const ACCESS_COOKIE  = 'app_dx_access';
const REFRESH_COOKIE = 'app_dx_refresh';

const COOKIE_OPTS = { httpOnly: true, secure: IS_PROD, sameSite: 'strict' as const } as const;

function setAuthCookies(res: NextResponse, access: string, refresh: string): void {
  res.cookies.set(ACCESS_COOKIE,  access,  { ...COOKIE_OPTS, path: '/',         maxAge: 900 });         // 15 min
  res.cookies.set(REFRESH_COOKIE, refresh, { ...COOKIE_OPTS, path: '/api/auth', maxAge: 7 * 24 * 3600 }); // 7 días
}

function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE,  '', { ...COOKIE_OPTS, path: '/',         maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, '', { ...COOKIE_OPTS, path: '/api/auth', maxAge: 0 });
}

function buildResHeaders(upstream: Headers): Headers {
  const out = new Headers();
  upstream.forEach((v, k) => {
    if (!SKIP_RESPONSE_HEADERS.has(k.toLowerCase())) out.set(k, v);
  });
  return out;
}

async function upstreamFetch(
  req: NextRequest,
  target: string,
  bodyOverride?: string,
): Promise<{ status: number; headers: Headers; buf: ArrayBuffer }> {
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    if (!SKIP_REQUEST_HEADERS.has(k.toLowerCase())) headers[k] = v;
  });

  // Adjuntar JWT desde cookie httpOnly como x-user-token
  // Authorization queda para la anon key del gateway de Supabase
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  if (SUPABASE_ANON_KEY) {
    headers['authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    if (accessToken) headers['x-user-token'] = `Bearer ${accessToken}`;
  } else if (accessToken) {
    // Desarrollo sin anon key — JWT directo en Authorization
    headers['authorization'] = `Bearer ${accessToken}`;
  }

  let body: BodyInit | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (bodyOverride !== undefined) {
      body = bodyOverride;
      headers['content-type'] = 'application/json';
    } else {
      body = await req.arrayBuffer();
    }
  }

  const up = await fetch(target, { method: req.method, headers, body });
  return { status: up.status, headers: up.headers, buf: await up.arrayBuffer() };
}

async function proxy(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const segments = (ctx.params.path ?? []).join('/');
  const target   = `${BACKEND}/${segments}${req.nextUrl.search}`;

  // ── POST /auth/login: establecer cookies, eliminar tokens del body ──────────
  if (req.method === 'POST' && segments === 'auth/login') {
    const up = await upstreamFetch(req, target);
    const resHeaders = buildResHeaders(up.headers);

    if (up.status === 200) {
      try {
        const json = JSON.parse(new TextDecoder().decode(up.buf)) as {
          data?: { accessToken?: string; refreshToken?: string; [k: string]: unknown };
          [k: string]: unknown;
        };
        const { accessToken, refreshToken, ...safeData } = json.data ?? {};
        if (accessToken && refreshToken) {
          const stripped = JSON.stringify({ ...json, data: safeData });
          const res = new NextResponse(stripped, { status: up.status, headers: resHeaders });
          setAuthCookies(res, accessToken, refreshToken);
          return res;
        }
      } catch { /* body inesperado — devolver tal cual */ }
    }
    return new NextResponse(up.buf, { status: up.status, headers: resHeaders });
  }

  // ── POST /auth/refresh: inyectar cookie como body, actualizar cookies ───────
  if (req.method === 'POST' && segments === 'auth/refresh') {
    const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token cookie' }, { status: 401 });
    }
    const up = await upstreamFetch(req, target, JSON.stringify({ refreshToken }));
    const res = new NextResponse(up.buf, { status: up.status, headers: buildResHeaders(up.headers) });
    if (up.status === 200) {
      try {
        const json = JSON.parse(new TextDecoder().decode(up.buf)) as {
          data?: { accessToken?: string; refreshToken?: string };
        };
        const { accessToken, refreshToken: newRefresh } = json.data ?? {};
        if (accessToken && newRefresh) setAuthCookies(res, accessToken, newRefresh);
      } catch { /* ignore */ }
    }
    return res;
  }

  // ── POST /auth/logout: inyectar cookie como body, borrar cookies ─────────────
  if (req.method === 'POST' && segments === 'auth/logout') {
    const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value ?? '';
    const up = await upstreamFetch(req, target, JSON.stringify({ refreshToken }));
    const res = new NextResponse(up.buf, { status: up.status, headers: buildResHeaders(up.headers) });
    clearAuthCookies(res);
    return res;
  }

  // ── Todos los demás requests: pasar directamente ─────────────────────────────
  const up = await upstreamFetch(req, target);
  return new NextResponse(up.buf, { status: up.status, headers: buildResHeaders(up.headers) });
}

export const GET    = proxy;
export const POST   = proxy;
export const PUT    = proxy;
export const PATCH  = proxy;
export const DELETE = proxy;
