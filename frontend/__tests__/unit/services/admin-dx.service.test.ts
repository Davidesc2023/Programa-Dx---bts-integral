import {
  getDxError,
  getDxDashboard,
  listarCasos,
  getCaso,
  cambiarEstado,
  registrarSerica,
  setIndicacion,
  registrarGenetica,
  registrarSeguimiento,
  generarLinkPaciente,
  invalidarLinkPaciente,
  eliminarCaso,
  importarCasos,
} from '@/services/admin-dx.service';
import { api } from '@/services/api';

jest.mock('@/services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  getApiErrorMessage: jest.fn(),
}));

// getDxError uses axios.isAxiosError
jest.mock('axios', () => ({
  isAxiosError: jest.fn((err) => Boolean(err?.isAxiosError)),
}));

const mockGet    = api.get    as jest.Mock;
const mockPost   = api.post   as jest.Mock;
const mockPatch  = api.patch  as jest.Mock;
const mockDelete = api.delete as jest.Mock;

beforeEach(() => jest.clearAllMocks());

// ─── getDxError ───────────────────────────────────────────────────────────────

describe('getDxError', () => {
  function axiosErr(data?: object, message = 'fail') {
    const e = new Error(message) as Record<string, unknown> & Error;
    e.isAxiosError = true;
    if (data) e.response = { data };
    return e;
  }

  it('returns error field from response', () => {
    expect(getDxError(axiosErr({ error: 'Registro no encontrado' }))).toBe('Registro no encontrado');
  });

  it('falls back to message field when no error field', () => {
    expect(getDxError(axiosErr({ message: 'Bad request' }))).toBe('Bad request');
  });

  it('falls back to err.message when no response body fields', () => {
    expect(getDxError(axiosErr({}, 'Network Error'))).toBe('Network Error');
  });

  it('returns err.message when axios error has no response body', () => {
    const e = new Error('Network Error') as Record<string, unknown> & Error;
    e.isAxiosError = true;
    // e.response is intentionally not set → err.response is undefined
    expect(getDxError(e)).toBe('Network Error');
  });

  it('falls back to default when axios error has no response and no message', () => {
    const e = Object.create(Error.prototype) as Record<string, unknown> & Error;
    e.isAxiosError = true;
    e.message = undefined as unknown as string; // force nullish
    expect(getDxError(e)).toBe('Error inesperado');
  });

  it('returns default for non-axios errors', () => {
    expect(getDxError(new Error('whatever'))).toBe('Error inesperado');
  });
});

// ─── getDxDashboard ───────────────────────────────────────────────────────────

describe('getDxDashboard', () => {
  it('calls GET /admin/dashboard and returns data.data', async () => {
    const dash = { totalCasos: 5, porEstado: {} };
    mockGet.mockResolvedValue({ data: { data: dash } });
    const result = await getDxDashboard();
    expect(mockGet).toHaveBeenCalledWith('/admin/dashboard', { params: {} });
    expect(result).toEqual(dash);
  });
});

// ─── listarCasos ─────────────────────────────────────────────────────────────

describe('listarCasos', () => {
  const PAGED = { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 }, message: 'ok' };

  it('calls GET /admin/casos and returns the full paginated response', async () => {
    mockGet.mockResolvedValue({ data: PAGED });
    const result = await listarCasos();
    expect(mockGet).toHaveBeenCalledWith('/admin/casos', { params: undefined });
    expect(result).toEqual(PAGED);
  });

  it('passes params when provided', async () => {
    mockGet.mockResolvedValue({ data: PAGED });
    await listarCasos({ estado: 'SOLICITADO', page: 2 });
    expect(mockGet).toHaveBeenCalledWith('/admin/casos', { params: { estado: 'SOLICITADO', page: 2 } });
  });
});

// ─── getCaso ─────────────────────────────────────────────────────────────────

describe('getCaso', () => {
  it('calls GET /admin/casos/:id and returns data.data', async () => {
    const caso = { id: 'c1', consecutivo: 'WIL-0001' };
    mockGet.mockResolvedValue({ data: { data: caso } });
    const result = await getCaso('c1');
    expect(mockGet).toHaveBeenCalledWith('/admin/casos/c1');
    expect(result).toEqual(caso);
  });
});

// ─── cambiarEstado ────────────────────────────────────────────────────────────

describe('cambiarEstado', () => {
  it('calls PATCH /admin/casos/:id/estado and returns response data', async () => {
    const res = { data: { id: 'c1', estado: 'EN_PROCESO' }, message: 'ok' };
    mockPatch.mockResolvedValue({ data: res });
    const result = await cambiarEstado('c1', { estado: 'EN_PROCESO' });
    expect(mockPatch).toHaveBeenCalledWith('/admin/casos/c1/estado', { estado: 'EN_PROCESO' });
    expect(result).toEqual(res);
  });
});

// ─── registrarSerica ──────────────────────────────────────────────────────────

describe('registrarSerica', () => {
  it('calls PATCH /admin/casos/:id/serica and returns data.data', async () => {
    const serica = { id: 'c1', estado: 'RESULTADO_SERICO', indicacion: { resultado: true, automatico: true } };
    mockPatch.mockResolvedValue({ data: { data: serica } });
    const payload = { resultado_serico_1: '15', interpretacion_serico: 'BAJO' };
    const result = await registrarSerica('c1', payload);
    expect(mockPatch).toHaveBeenCalledWith('/admin/casos/c1/serica', payload);
    expect(result).toEqual(serica);
  });
});

// ─── setIndicacion ────────────────────────────────────────────────────────────

describe('setIndicacion', () => {
  it('calls PATCH /admin/casos/:id/indicacion', async () => {
    const res = { data: { id: 'c1', estado: 'CON_INDICACION' }, message: 'ok' };
    mockPatch.mockResolvedValue({ data: res });
    const result = await setIndicacion('c1', { tiene_indicacion_genetica: true, motivo: 'Umbral superado' });
    expect(mockPatch).toHaveBeenCalledWith('/admin/casos/c1/indicacion', { tiene_indicacion_genetica: true, motivo: 'Umbral superado' });
    expect(result).toEqual(res);
  });
});

// ─── registrarGenetica ────────────────────────────────────────────────────────

describe('registrarGenetica', () => {
  it('calls PATCH /admin/casos/:id/genetica and returns response data', async () => {
    const res = { data: { id: 'c1', estado: 'RESULTADO_GENETICO' }, message: 'ok' };
    mockPatch.mockResolvedValue({ data: res });
    const payload = { estado_genetico: 'POSITIVO', resultado_genetico: 'Variante patogénica' };
    const result = await registrarGenetica('c1', payload);
    expect(mockPatch).toHaveBeenCalledWith('/admin/casos/c1/genetica', payload);
    expect(result).toEqual(res);
  });
});

// ─── registrarSeguimiento ─────────────────────────────────────────────────────

describe('registrarSeguimiento', () => {
  it('calls PATCH /admin/casos/:id/seguimiento and returns response data', async () => {
    const res = { data: { id: 'c1' }, message: 'ok' };
    mockPatch.mockResolvedValue({ data: res });
    const payload = { seguimiento_clinico: 'BUENO', notas_seguimiento: 'Sin novedad' };
    const result = await registrarSeguimiento('c1', payload);
    expect(mockPatch).toHaveBeenCalledWith('/admin/casos/c1/seguimiento', payload);
    expect(result).toEqual(res);
  });
});

// ─── generarLinkPaciente ──────────────────────────────────────────────────────

describe('generarLinkPaciente', () => {
  it('calls POST /admin/casos/:id/link-paciente and returns data.data', async () => {
    const linkData = { url: 'http://app/auth?token=abc', expira_at: '2026-06-13', expira_horas: 24, caso: { id: 'c1', consecutivo: 'WIL-0001', paciente: 'Juan' } };
    mockPost.mockResolvedValue({ data: { data: linkData } });
    const result = await generarLinkPaciente('c1');
    expect(mockPost).toHaveBeenCalledWith('/admin/casos/c1/link-paciente');
    expect(result).toEqual(linkData);
  });
});

// ─── invalidarLinkPaciente ────────────────────────────────────────────────────

describe('invalidarLinkPaciente', () => {
  it('calls DELETE /admin/casos/:id/link-paciente and returns data.data', async () => {
    const res = { invalidados: 1 };
    mockDelete.mockResolvedValue({ data: { data: res } });
    const result = await invalidarLinkPaciente('c1');
    expect(mockDelete).toHaveBeenCalledWith('/admin/casos/c1/link-paciente');
    expect(result).toEqual(res);
  });
});

// ─── eliminarCaso ─────────────────────────────────────────────────────────────

describe('eliminarCaso', () => {
  it('calls DELETE /admin/casos/:id and returns response data', async () => {
    const res = { data: { id: 'c1' }, message: 'ok' };
    mockDelete.mockResolvedValue({ data: res });
    const result = await eliminarCaso('c1');
    expect(mockDelete).toHaveBeenCalledWith('/admin/casos/c1');
    expect(result).toEqual(res);
  });
});

// ─── importarCasos ────────────────────────────────────────────────────────────

describe('importarCasos', () => {
  it('posts to /admin/import/:tenant/:programa and returns data.data', async () => {
    const importResult = { total: 2, exitosos: 2, errores: [], casos: [] };
    mockPost.mockResolvedValue({ data: { data: importResult } });
    const rows = [{ pais_codigo: 'CO', medico_nombre: 'Dr. Test' }] as never;
    const result = await importarCasos('bts', 'wilson', rows);
    expect(mockPost).toHaveBeenCalledWith('/admin/import/bts/wilson', { rows });
    expect(result).toEqual(importResult);
  });
});
