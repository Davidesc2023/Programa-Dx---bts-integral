'use client';

import { useState, useRef } from 'react';
import { Paperclip, Upload, Trash2, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useResultAttachments, useUploadAttachment, useDownloadAttachment, useDeleteAttachment } from './useResults';

interface AttachmentsPanelProps {
  resultId: string;
}

export function AttachmentsPanel({ resultId }: AttachmentsPanelProps) {
  const { data: attachments = [], isLoading } = useResultAttachments(resultId);
  const uploadMutation = useUploadAttachment(resultId);
  const downloadMutation = useDownloadAttachment(resultId);
  const deleteMutation = useDeleteAttachment(resultId);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Paperclip size={15} />
          Archivos adjuntos
        </h4>
        <Button
          variant="outline"
          size="sm"
          loading={uploadMutation.isPending}
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={13} className="mr-1.5" />
          Subir archivo
        </Button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={3} />
      ) : attachments.length === 0 ? (
        <p className="text-sm text-gray-400 flex items-center gap-2">
          <FileText size={14} />
          Sin archivos adjuntos.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 text-sm">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2.5 gap-3">
              <span className="text-gray-800 truncate flex-1">{a.fileName}</span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-primary-600 transition-colors"
                  title="Descargar"
                  onClick={() => downloadMutation.mutate({ attachId: a.id, filename: a.fileName })}
                >
                  <Download size={13} />
                </button>
                <button
                  className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="Eliminar"
                  onClick={() => setDeleteId(a.id)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
        }}
        title="Eliminar adjunto"
        message="¿Deseas eliminar este archivo? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
