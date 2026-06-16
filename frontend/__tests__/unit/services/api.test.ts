// Mock token before api.ts is imported (interceptors call getAccessToken at request time)
jest.mock('@/lib/token', () => ({
  getAccessToken: jest.fn(() => null),
  clearTokens: jest.fn(),
}));

import { api, getApiErrorMessage } from '@/services/api';
import { getAccessToken, clearTokens } from '@/lib/token';

// ─── Request interceptor ──────────────────────────────────────────────────────

function getRequestInterceptor(): (config: Record<string, unknown>) => Record<string, unknown> {
  // axios stores handlers in an internal array; grab the last registered one
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlers = (api.interceptors.request as any).handlers as Array<{ fulfilled: Function }>;
  return handlers[handlers.length - 1].fulfilled as (c: Record<string, unknown>) => Record<string, unknown>;
}

describe('request interceptor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('attaches Authorization header when token is present', () => {
    (getAccessToken as jest.Mock).mockReturnValue('my-token');
    const fulfilled = getRequestInterceptor();
    const config = { headers: {} };
    const result = fulfilled(config) as { headers: Record<string, string> };
    expect(result.headers.Authorization).toBe('Bearer my-token');
  });

  it('leaves headers untouched when no token', () => {
    (getAccessToken as jest.Mock).mockReturnValue(null);
    const fulfilled = getRequestInterceptor();
    const config = { headers: {} };
    const result = fulfilled(config) as { headers: Record<string, string> };
    expect(result.headers.Authorization).toBeUndefined();
  });
});

// ─── Response interceptor ─────────────────────────────────────────────────────

function getResponseErrorHandler(): (error: unknown) => Promise<never> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlers = (api.interceptors.response as any).handlers as Array<{ rejected: Function }>;
  return handlers[handlers.length - 1].rejected as (e: unknown) => Promise<never>;
}

describe('response interceptor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('clears tokens and rejects on 401', async () => {
    const handler = getResponseErrorHandler();
    const err = { response: { status: 401 }, isAxiosError: true };
    await expect(handler(err)).rejects.toEqual(err);
    expect(clearTokens).toHaveBeenCalled();
  });

  it('does not clear tokens for non-401 errors', async () => {
    const handler = getResponseErrorHandler();
    const err = { response: { status: 500 }, isAxiosError: true };
    await expect(handler(err)).rejects.toEqual(err);
    expect(clearTokens).not.toHaveBeenCalled();
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
