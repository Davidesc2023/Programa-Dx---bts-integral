import { loginRequest, logoutRequest, registerPatientRequest } from '@/services/auth.service';
import { api } from '@/services/api';
import { DocumentType } from '@/types/enums';

jest.mock('@/services/api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  getApiErrorMessage: jest.fn(),
}));

const mockPost = api.post as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('loginRequest', () => {
  it('posts to /auth/login and returns data.data', async () => {
    const payload = { email: 'admin@test.com', password: 'secret' };
    const loginData = { accessToken: 'tok', refreshToken: 'ref', user: { id: '1' } };
    mockPost.mockResolvedValue({ data: { data: loginData } });

    const result = await loginRequest(payload);
    expect(mockPost).toHaveBeenCalledWith('/auth/login', payload);
    expect(result).toEqual(loginData);
  });

  it('propagates rejection on API error', async () => {
    mockPost.mockRejectedValue(new Error('Unauthorized'));
    await expect(loginRequest({ email: 'a@b.com', password: 'x' })).rejects.toThrow('Unauthorized');
  });
});

describe('logoutRequest', () => {
  it('posts to /auth/logout with no body (proxy uses cookie)', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await logoutRequest();
    expect(mockPost).toHaveBeenCalledWith('/auth/logout');
  });
});

describe('registerPatientRequest', () => {
  it('posts to /auth/register-patient and returns data.data', async () => {
    const payload = {
      email: 'patient@test.com',
      password: 'pass1234',
      documentType: 'CC' as DocumentType,
      documentNumber: '123456789',
      firstName: 'Juan',
      lastName: 'Pérez',
    };
    const response = { id: 'user-1', email: payload.email };
    mockPost.mockResolvedValue({ data: { data: response } });

    const result = await registerPatientRequest(payload);
    expect(mockPost).toHaveBeenCalledWith('/auth/register-patient', payload);
    expect(result).toEqual(response);
  });
});
