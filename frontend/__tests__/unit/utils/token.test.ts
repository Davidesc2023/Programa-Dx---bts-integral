import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  decodeJwtPayload,
  isTokenExpired,
} from '@/lib/token';

// ─── localStorage helpers ─────────────────────────────────────────────────────

describe('token storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getAccessToken returns null when not set', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('getRefreshToken returns null when not set', () => {
    expect(getRefreshToken()).toBeNull();
  });

  it('setTokens stores both tokens', () => {
    setTokens('access-123', 'refresh-456');
    expect(getAccessToken()).toBe('access-123');
    expect(getRefreshToken()).toBe('refresh-456');
  });

  it('clearTokens removes both tokens', () => {
    setTokens('access-123', 'refresh-456');
    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('overwrites existing tokens on setTokens', () => {
    setTokens('access-old', 'refresh-old');
    setTokens('access-new', 'refresh-new');
    expect(getAccessToken()).toBe('access-new');
    expect(getRefreshToken()).toBe('refresh-new');
  });
});

// ─── decodeJwtPayload ─────────────────────────────────────────────────────────

// Build a fake JWT (header.payload.signature — signature not verified)
function buildToken(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${header}.${body}.fakesig`;
}

describe('decodeJwtPayload', () => {
  it('decodes a valid JWT payload', () => {
    const token = buildToken({ sub: 'user-123', role: 'ADMIN' });
    const payload = decodeJwtPayload<{ sub: string; role: string }>(token);
    expect(payload?.sub).toBe('user-123');
    expect(payload?.role).toBe('ADMIN');
  });

  it('returns null for malformed token (no dots)', () => {
    expect(decodeJwtPayload('notavalidtoken')).toBeNull();
  });

  it('returns null for token with wrong part count', () => {
    expect(decodeJwtPayload('a.b')).toBeNull();
  });

  it('returns null for token with invalid base64', () => {
    expect(decodeJwtPayload('a.!!!invalid!!!.c')).toBeNull();
  });

  it('returns null for token with non-JSON payload', () => {
    const header = btoa('{}');
    const body   = btoa('not-json');
    expect(decodeJwtPayload(`${header}.${body}.sig`)).toBeNull();
  });
});

// ─── isTokenExpired ───────────────────────────────────────────────────────────

describe('isTokenExpired', () => {
  it('returns true for an expired token', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const token = buildToken({ sub: 'user', exp: pastExp });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns false for a valid (non-expired) token', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const token = buildToken({ sub: 'user', exp: futureExp });
    expect(isTokenExpired(token)).toBe(false);
  });

  it('returns true when exp is missing from payload', () => {
    const token = buildToken({ sub: 'user' });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns true for malformed token', () => {
    expect(isTokenExpired('not-a-token')).toBe(true);
  });
});
