// Auth tokens are now httpOnly cookies managed by the proxy.
// The request interceptor was removed — cookies are sent automatically.
// The response interceptor still handles 401 → refresh → retry.

jest.mock('@/lib/token', () => ({
  clearUserSession: jest.fn(),
}));

import { api, getApiErrorMessage } from '@/services/api';
import { clearUserSession } from '@/lib/token';

// ─── Response interceptor ─────────────────────────────────────────────────────

function getResponseErrorHandler(): (error: unknown) => Promise<never> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlers = (api.interceptors.response as any).handlers as Array<{ rejected: Function }>;
  return handlers[handlers.length - 1].rejected as (e: unknown) => Promise<never>;
}

describe('response interceptor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects non-401 errors without clearing session', async () => {
    const handler = getResponseErrorHandler();
    const err = { response: { status: 500 }, isAxiosError: true, config: { url: '/other', _retry: false } };
    await expect(handler(err)).rejects.toEqual(err);
    expect(clearUserSession).not.toHaveBeenCalled();
  });

  it('rejects without refresh attempt on auth routes', async () => {
    const handler = getResponseErrorHandler();
    const err = {
      response: { status: 401 },
      isAxiosError: true,
      config: { url: '/auth/login', _retry: false },
    };
    await expect(handler(err)).rejects.toEqual(err);
    expect(clearUserSession).not.toHaveBeenCalled();
  });
});

// ─── getApiErrorMessage ───────────────────────────────────────────────────────

function makeAxiosError(data?: unknown, message = 'Request failed') {
  const err = new Error(message) as Record<string, unknown> & Error;
  err.isAxiosError = true;
  if (data !== undefined) err.response = { data };
  return err;
}

describe('getApiErrorMessage', () => {
  it('extracts string message from axios error response', () => {
    expect(getApiErrorMessage(makeAxiosError({ message: 'Not found' }))).toBe('Not found');
  });

  it('joins array message from axios error response', () => {
    expect(getApiErrorMessage(makeAxiosError({ message: ['A required', 'B required'] }))).toBe('A required, B required');
  });

  it('falls back to error.message when response has no message', () => {
    expect(getApiErrorMessage(makeAxiosError({ other: 'field' }, 'Network Error'))).toBe('Network Error');
  });

  it('returns default message for non-axios errors', () => {
    expect(getApiErrorMessage(new Error('whatever'))).toBe('Ha ocurrido un error inesperado');
  });

  it('returns default message for null', () => {
    expect(getApiErrorMessage(null)).toBe('Ha ocurrido un error inesperado');
  });

  it('handles axios error with no response', () => {
    expect(getApiErrorMessage(makeAxiosError(undefined, 'Network Error'))).toBe('Network Error');
  });
});
