import {
  getUsers,
  getDoctors,
  createUser,
  updateUser,
  deleteUser,
} from '@/services/users.service';
import { api } from '@/services/api';
import { UserRole } from '@/types/enums';

jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  getApiErrorMessage: jest.fn(),
}));

const mockGet  = api.get  as jest.Mock;
const mockPost = api.post as jest.Mock;
const mockPatch  = api.patch  as jest.Mock;
const mockDelete = api.delete as jest.Mock;

beforeEach(() => jest.clearAllMocks());

const PAGE_RESPONSE = {
  data: [{ id: 'u1', email: 'a@b.com', role: 'MEDICO' }],
  meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
  message: 'ok',
};

describe('getUsers', () => {
  it('calls GET /users and returns the full paginated response', async () => {
    mockGet.mockResolvedValue({ data: PAGE_RESPONSE });
    const result = await getUsers({ role: UserRole.MEDICO });
    expect(mockGet).toHaveBeenCalledWith('/users', { params: { role: UserRole.MEDICO } });
    expect(result).toEqual(PAGE_RESPONSE);
  });
});

describe('getDoctors', () => {
  it('returns the data array from paginated response', async () => {
    mockGet.mockResolvedValue({ data: PAGE_RESPONSE });
    const result = await getDoctors();
    expect(result).toEqual(PAGE_RESPONSE.data);
  });

  it('includes search param when provided', async () => {
    mockGet.mockResolvedValue({ data: PAGE_RESPONSE });
    await getDoctors('García');
    const callParams = mockGet.mock.calls[0][1].params;
    expect(callParams.search).toBe('García');
  });
});

describe('createUser', () => {
  it('posts to /users and returns data.data', async () => {
    const newUser = { id: 'u2', email: 'new@test.com', role: 'OPERADOR' };
    mockPost.mockResolvedValue({ data: { data: newUser } });
    const payload = { email: 'new@test.com', password: 'pass1234', role: UserRole.OPERADOR };
    const result = await createUser(payload);
    expect(mockPost).toHaveBeenCalledWith('/users', payload);
    expect(result).toEqual(newUser);
  });
});

describe('updateUser', () => {
  it('patches /users/:id and returns data.data', async () => {
    const updated = { id: 'u1', email: 'updated@test.com', role: 'ADMIN' };
    mockPatch.mockResolvedValue({ data: { data: updated } });
    const result = await updateUser('u1', { email: 'updated@test.com' });
    expect(mockPatch).toHaveBeenCalledWith('/users/u1', { email: 'updated@test.com' });
    expect(result).toEqual(updated);
  });
});

describe('deleteUser', () => {
  it('calls DELETE /users/:id', async () => {
    mockDelete.mockResolvedValue({});
    await deleteUser('u1');
    expect(mockDelete).toHaveBeenCalledWith('/users/u1');
  });
});
