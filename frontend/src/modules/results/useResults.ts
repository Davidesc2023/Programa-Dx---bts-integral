import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getResults,
  getResultById,
  createResult,
  updateResult,
  deleteResult,
  getAttachments,
  uploadAttachment,
  downloadAttachment,
  deleteAttachment,
} from '@/services/results.service';
import type { GetResultsParams, CreateResultPayload, UpdateResultPayload } from '@/services/results.service';
import { getApiErrorMessage } from '@/services/api';

// --- Read hooks ---

export function useResultList(params: GetResultsParams = {}) {
  return useQuery({
    queryKey: ['results', params],
    queryFn: () => getResults(params),
    staleTime: 30_000,
  });
}

export function useResult(id: string) {
  return useQuery({
    queryKey: ['result', id],
    queryFn: () => getResultById(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useResultAttachments(resultId: string) {
  return useQuery({
    queryKey: ['attachments', resultId],
    queryFn: () => getAttachments(resultId),
    enabled: Boolean(resultId),
    staleTime: 30_000,
  });
}

// --- Mutation hooks ---

export function useCreateResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateResultPayload) => createResult(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results'] });
      toast.success('Resultado creado correctamente.');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useUpdateResult(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateResultPayload) => updateResult(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results'] });
      qc.invalidateQueries({ queryKey: ['result', id] });
      toast.success('Resultado actualizado.');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useDeleteResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteResult(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['results'] });
      toast.success('Resultado eliminado.');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useUploadAttachment(resultId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadAttachment(resultId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', resultId] });
      toast.success('Archivo adjunto subido.');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useDownloadAttachment(resultId: string) {
  return useMutation({
    mutationFn: ({ attachId, filename }: { attachId: string; filename: string }) =>
      downloadAttachment(resultId, attachId).then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useDeleteAttachment(resultId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attachId: string) => deleteAttachment(resultId, attachId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments', resultId] });
      toast.success('Adjunto eliminado.');
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}
