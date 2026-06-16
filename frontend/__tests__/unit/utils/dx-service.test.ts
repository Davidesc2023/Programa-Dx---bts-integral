// Unit tests for admin-dx.service — all HTTP calls mocked via jest

import axios from 'axios';
import { getDxError } from '@/services/admin-dx.service';

// ─── getDxError ───────────────────────────────────────────────────────────────

describe('getDxError', () => {
  it('extracts error field from DX backend response', () => {
    const axiosError = new axios.AxiosError('Request failed', '500', undefined, undefined, {
      data: { error: 'Caso no encontrado', statusCode: 404 },
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config: {} as never,
    });
    expect(getDxError(axiosError)).toBe('Caso no encontrado');
  });

  it('falls back to message field (legacy backend format)', () => {
    const axiosError = new axios.AxiosError('Request failed', '500', undefined, undefined, {
      data: { message: 'Forbidden' },
      status: 403,
      statusText: 'Forbidden',
      headers: {},
      config: {} as never,
    });
    expect(getDxError(axiosError)).toBe('Forbidden');
  });

  it('falls back to axios message when no data.error or data.message', () => {
    const axiosError = new axios.AxiosError('Network Error');
    expect(getDxError(axiosError)).toBe('Network Error');
  });

  it('returns generic message for non-axios errors', () => {
    expect(getDxError(new Error('Something else'))).toBe('Error inesperado');
    expect(getDxError('string error')).toBe('Error inesperado');
    expect(getDxError(null)).toBe('Error inesperado');
  });

  it('prefers error over message when both present', () => {
    const axiosError = new axios.AxiosError('Request failed', '500', undefined, undefined, {
      data: { error: 'DX error', message: 'legacy message' },
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      config: {} as never,
    });
    expect(getDxError(axiosError)).toBe('DX error');
  });
});
