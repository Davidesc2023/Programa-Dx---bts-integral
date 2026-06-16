// eslint-disable-next-line no-var
var mockGet: jest.Mock;
// eslint-disable-next-line no-var
var mockPost: jest.Mock;

jest.mock('axios', () => {
  mockGet  = jest.fn();
  mockPost = jest.fn();
  return {
    create: jest.fn(() => ({ get: mockGet, post: mockPost })),
    isAxiosError: jest.fn(),
  };
});

import {
  getPublicFormData,
  publicCrearCaso,
  publicSubirResultadoPrevio,
} from '@/services/public.service';

beforeEach(() => jest.clearAllMocks());

describe('getPublicFormData', () => {
  it('calls GET /public/:tenant/:programa and returns data.data', async () => {
    const form = { tenant: { nombre: 'BTS' }, programa: { nombre: 'Wilson' }, consentimientos: [] };
    mockGet.mockResolvedValue({ data: { data: form, message: 'ok' } });
    const result = await getPublicFormData('bts', 'wilson');
    expect(mockGet).toHaveBeenCalledWith('/public/bts/wilson');
    expect(result).toEqual(form);
  });

  it('propagates rejection', async () => {
    mockGet.mockRejectedValue(new Error('Not Found'));
    await expect(getPublicFormData('bad', 'route')).rejects.toThrow('Not Found');
  });
});

describe('publicCrearCaso', () => {
  it('posts to /public/:tenant/:programa and returns full envelope', async () => {
    const envelope = { data: { casoId: 'c1', consecutivo: 'WIL-0001' }, message: 'Caso creado' };
    mockPost.mockResolvedValue({ data: envelope });
    const payload = { medico: {}, paciente: {} } as never;
    const result = await publicCrearCaso('bts', 'wilson', payload);
    expect(mockPost).toHaveBeenCalledWith('/public/bts/wilson', payload);
    expect(result).toEqual(envelope);
  });
});

describe('publicSubirResultadoPrevio', () => {
  it('posts FormData to the upload endpoint', async () => {
    mockPost.mockResolvedValue({});
    const file = new File(['content'], 'result.pdf', { type: 'application/pdf' });
    await publicSubirResultadoPrevio('bts', 'wilson', 'c1', file);
    expect(mockPost).toHaveBeenCalledWith(
      '/public/bts/wilson/upload?casoId=c1',
      expect.any(FormData),
    );
  });
});
