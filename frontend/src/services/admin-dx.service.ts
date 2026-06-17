import axios from 'axios';
import { api } from './api';
import type {
  DxDashboardData,
  DxCasoItem,
  DxCasoDetalle,
  ImportRow,
  ImportResult,
  ReporteRow,
} from '@/types/dx.types';

// ─── Error helper ─────────────────────────────────────────────────────────────
// DX backend uses { error: string } (not { message: string })
export function getDxError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { error?: string; message?: string } | undefined;
    return d?.error ?? d?.message ?? err.message ?? 'Error inesperado';
  }
  return 'Error inesperado';
}

// ─── Envelope types ───────────────────────────────────────────────────────────
interface Envelope<T> { data: T; message: string }
interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  message: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardFilters {
  programa?: string;
  pais?:     string;
  ano?:      string;
  medico?:   string;
  estado?:   string;
}

export async function getDxDashboard(filters?: DashboardFilters): Promise<DxDashboardData> {
  const params: Record<string, string> = {};
  if (filters?.programa) params.programa = filters.programa;
  if (filters?.pais)     params.pais     = filters.pais;
  if (filters?.ano)      params.ano      = filters.ano;
  if (filters?.medico)   params.medico   = filters.medico;
  if (filters?.estado)   params.estado   = filters.estado;
  const r = await api.get<Envelope<DxDashboardData>>('/admin/dashboard', { params });
  return r.data.data;
}

// ─── Cases list ───────────────────────────────────────────────────────────────
export interface CasosListParams {
  estado?: string;
  programa?: string;
  pais?: string;
  q?: string;
  mes?: string;
  autorizacion?: string;
  page?: number;
  limit?: number;
}

export async function listarCasos(
  params?: CasosListParams,
): Promise<Paginated<DxCasoItem>> {
  const r = await api.get<Paginated<DxCasoItem>>('/admin/casos', { params });
  return r.data;
}

// ─── Case detail ─────────────────────────────────────────────────────────────
export async function getCaso(id: string): Promise<DxCasoDetalle> {
  const r = await api.get<Envelope<DxCasoDetalle>>(`/admin/casos/${id}`);
  return r.data.data;
}

// ─── State transition ─────────────────────────────────────────────────────────
export async function cambiarEstado(
  id: string,
  payload: { estado: string; motivo?: string },
) {
  const r = await api.patch<Envelope<{ id: string; estado: string }>>(
    `/admin/casos/${id}/estado`,
    payload,
  );
  return r.data;
}

// ─── Serology result ──────────────────────────────────────────────────────────
export interface SericaPayload {
  resultado_serico_1: string;
  resultado_serico_2?: string;
  interpretacion_serico?: string;
  notas_serico?: string;
}
export interface SericaResponse {
  id: string;
  estado: string;
  indicacion: { resultado: boolean | null; automatico: boolean };
}
export async function registrarSerica(id: string, payload: SericaPayload) {
  const r = await api.patch<Envelope<SericaResponse>>(
    `/admin/casos/${id}/serica`,
    payload,
  );
  return r.data.data;
}

// ─── Genetic indication ───────────────────────────────────────────────────────
export async function setIndicacion(
  id: string,
  payload: { tiene_indicacion_genetica: boolean; motivo?: string },
) {
  const r = await api.patch<Envelope<{ id: string; estado: string }>>(
    `/admin/casos/${id}/indicacion`,
    payload,
  );
  return r.data;
}

// ─── Genetic result ───────────────────────────────────────────────────────────
export interface GeneticaPayload {
  estado_genetico: string;
  resultado_genetico?: string;
  laboratorio_genetico?: string;
  fecha_genetica?: string;
}
export async function registrarGenetica(id: string, payload: GeneticaPayload) {
  const r = await api.patch<Envelope<{ id: string; estado: string }>>(
    `/admin/casos/${id}/genetica`,
    payload,
  );
  return r.data;
}

// ─── Clinical follow-up ───────────────────────────────────────────────────────
export async function registrarSeguimiento(
  id: string,
  payload: { seguimiento_clinico: string; notas_seguimiento?: string | undefined },
) {
  const r = await api.patch<Envelope<{ id: string }>>(
    `/admin/casos/${id}/seguimiento`,
    payload,
  );
  return r.data;
}

// ─── Patient magic link ───────────────────────────────────────────────────────
export interface LinkPacienteResult {
  url: string;
  expira_at: string;
  expira_horas: number;
  caso: { id: string; consecutivo: string; paciente: string };
}
export async function generarLinkPaciente(
  id: string,
): Promise<LinkPacienteResult> {
  const r = await api.post<Envelope<LinkPacienteResult>>(
    `/admin/casos/${id}/link-paciente`,
  );
  return r.data.data;
}
export async function invalidarLinkPaciente(
  id: string,
): Promise<{ invalidados: number }> {
  const r = await api.delete<Envelope<{ invalidados: number }>>(
    `/admin/casos/${id}/link-paciente`,
  );
  return r.data.data;
}

// ─── Soft delete ─────────────────────────────────────────────────────────────
export async function eliminarCaso(id: string) {
  const r = await api.delete<Envelope<{ id: string }>>(`/admin/casos/${id}`);
  return r.data;
}

// ─── Report export ────────────────────────────────────────────────────────────
export async function generarReporte(params?: CasosListParams): Promise<ReporteRow[]> {
  const r = await api.get<Envelope<ReporteRow[]>>('/admin/reporte', { params });
  return r.data.data;
}

// ─── Bulk import ──────────────────────────────────────────────────────────────
export async function importarCasos(
  tenantSlug: string,
  programa: string,
  rows: ImportRow[],
): Promise<ImportResult> {
  const r = await api.post<Envelope<ImportResult>>(
    `/admin/import/${tenantSlug}/${programa}`,
    { rows },
  );
  return r.data.data;
}
