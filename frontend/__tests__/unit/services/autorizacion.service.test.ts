// eslint-disable-next-line no-var
var mockPost: jest.Mock;

jest.mock('axios', () => {
  mockPost = jest.fn();
  return {
    create: jest.fn(() => ({ post: mockPost })),
    isAxiosError: jest.fn(),
  };
});

import { responderAutorizacion } from '@/services/autorizacion.service';

beforeEach(() => jest.clearAllMocks());

describe('responderAutorizacion', () => {
  it('posts to /autorizar/:token and returns full envelope', async () => {
    const envelope = { data: { estado: 'AUTORIZADO' }, message: 'Respuesta registrada' };
    mockPost.mockResolvedValue({ data: envelope });
    const payload = { respuesta: 'AUTORIZADO' as const, nombre_firmado: 'Juan Pérez' };
    const result = await responderAutorizacion('magic-token-abc', payload);
    expect(mockPost).toHaveBeenCalledWith('/autorizar/magic-token-abc', payload);
    expect(result).toEqual(envelope);
  });

  it('posts NO_AUTORIZADO with correccion_datos', async () => {
    const envelope = { data: { estado: 'NO_AUTORIZADO' }, message: 'Respuesta registrada' };
    mockPost.mockResolvedValue({ data: envelope });
    const payload = {
      respuesta: 'NO_AUTORIZADO' as const,
      nombre_firmado: 'Juan Pérez',
      correccion_datos: 'El nombre está mal escrito',
    };
    const result = await responderAutorizacion('magic-token-xyz', payload);
    expect(mockPost).toHaveBeenCalledWith('/autorizar/magic-token-xyz', payload);
    expect(result).toEqual(envelope);
  });

  it('propagates rejection from the API', async () => {
    mockPost.mockRejectedValue(new Error('Token expired'));
    await expect(
      responderAutorizacion('bad-token', { respuesta: 'AUTORIZADO', nombre_firmado: 'X' }),
    ).rejects.toThrow('Token expired');
  });
});
