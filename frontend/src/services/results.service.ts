import { api } from './api';
import type { Result, ResultAttachment } from '@/types/api.types';
import type { PaginatedApiResponse} from '@/types/api.types';

export interface GetResultsParams {
  page?: number;
  limit?: number;
  orderId?: string;
}

export interface CreateResultPayload {
  orderId: string;
  examType: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  notes?: string;
}

export interface UpdateResultPayload {
  examType?: string;
  value?: string;
  unit?: string;
  referenceRange?: string;
  notes?: string;
}

export async function getResults(params: GetResultsParams = {}): Promise<PaginatedApiResponse<Result>> {
  const { data } = await api.get<PaginatedApiResponse<Result>>('/results', { params });
  return data;
}

export async function getResultById(id: string): Promise<Result> {
  const { data } = await api.get<{ data: Result }>(`/results/${id}`);
  return data.data;
}

export async function createResult(payload: CreateResultPayload): Promise<Result> {
  const { data } = await api.post<{ data: Result }>('/results', payload);
  return data.data;
}

export async function updateResult(id: string, payload: UpdateResultPayload): Promise<Result> {
  const { data } = await api.patch<{ data: Result }>(`/results/${id}`, payload);
  return data.data;
}

export async function deleteResult(id: string): Promise<void> {
  await api.delete(`/results/${id}`);
}

// --- Attachments ---

export async function getAttachments(resultId: string): Promise<ResultAttachment[]> {
  const { data } = await api.get<{ data: ResultAttachment[] }>(`/results/${resultId}/attachments`);
  return data.data;
}

export async function uploadAttachment(resultId: string, file: File): Promise<ResultAttachment> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<{ data: ResultAttachment }>(
    `/results/${resultId}/attachments`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data;
}

export async function downloadAttachment(resultId: string, attachId: string): Promise<Blob> {
  const { data } = await api.get<Blob>(
    `/results/${resultId}/attachments/${attachId}/download`,
    { responseType: 'blob' },
  );
  return data;
}

export async function deleteAttachment(resultId: string, attachId: string): Promise<void> {
  await api.delete(`/results/${resultId}/attachments/${attachId}`);
}
