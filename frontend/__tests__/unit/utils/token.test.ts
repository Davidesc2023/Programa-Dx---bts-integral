import {
  getUserSession,
  setUserSession,
  clearUserSession,
  decodeJwtPayload,
} from '@/lib/token';

// ─── sessionStorage helpers ───────────────────────────────────────────────────

describe('user session (sessionStorage)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('getUserSession returns null when not set', () => {
    expect(getUserSession()).toBeNull();
  });

  it('setUserSession stores user and getUserSession retrieves it', () => {
    setUserSession({ id: 'u1', email: 'a@b.com', role: 'ADMIN' });
    expect(getUserSession()).toEqual({ id: 'u1', email: 'a@b.com', role: 'ADMIN' });
  });

  it('clearUserSession removes the stored user', () => {
    setUserSession({ id: 'u1', email: 'a@b.com', role: 'ADMIN' });
    clearUserSession();
    expect(getUserSession()).toBeNull();
  });

  it('setUserSession overwrites existing session', () => {
    setUserSession({ id: 'u1', email: 'old@b.com', role: 'OPERADOR' });
    setUserSession({ id: 'u2', email: 'new@b.com', role: 'MEDICO' });
    expect(getUserSession()).toEqual({ id: 'u2', email: 'new@b.com', role: 'MEDICO' });
  });
});

// ─── decodeJwtPayload ─────────────────────────────────────────────────────────

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
