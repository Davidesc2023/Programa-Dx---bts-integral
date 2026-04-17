'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Download, Paperclip } from 'lucide-react';
import { getPortalResults, downloadPortalAttachment } from '@/services/portal.service';
import type { Result, ResultAttachment } from '@/types/api.types';
import { getApiErrorMessage } from '@/services/api';

export default function PortalResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    getPortalResults()
      .then(setResults)
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  async function handleDownload(result: Result, att: ResultAttachment) {
    setDownloadingId(att.id);
    try {
      const blob = await downloadPortalAttachment(result.id, att.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = att.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('No se pudo descargar el archivo.');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-on-surface mb-1">Mis resultados</h1>
      <p className="text-sm text-outline mb-6">Resultados de exámenes disponibles</p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-outline">Cargando resultados...</p>}

      {!loading && results.length === 0 && !error && (
        <p className="text-sm text-outline">No tienes resultados disponibles aún.</p>
      )}

      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.id} className="bg-white border border-surface-container-high rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-on-surface">{result.examType}</h2>
                <p className="text-xs text-outline mt-0.5">
                  {new Date(result.createdAt).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-on-surface">
                  {result.value}
                  {result.unit && <span className="text-sm font-normal text-outline ml-1">{result.unit}</span>}
                </p>
                {result.referenceRange && (
                  <p className="text-xs text-outline">Ref: {result.referenceRange}</p>
                )}
              </div>
            </div>

            {result.notes && (
              <p className="text-sm text-on-surface-variant mt-2 border-t border-surface-container-lowest pt-2">{result.notes}</p>
            )}

            {result.attachments && result.attachments.length > 0 && (
              <div className="mt-3 border-t border-surface-container-lowest pt-3">
                <p className="text-xs font-medium text-outline mb-1">Archivos adjuntos</p>
                <ul className="space-y-1">
                  {result.attachments.map((att) => (
                    <li key={att.id} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-xs text-on-surface-variant truncate">
                        <Paperclip size={12} className="shrink-0" />
                        {att.originalName}
                      </span>
                      <button
                        className="shrink-0 p-1 rounded hover:bg-surface-container text-outline hover:text-primary-600 transition-colors disabled:opacity-50"
                        title="Descargar"
                        disabled={downloadingId === att.id}
                        onClick={() => handleDownload(result, att)}
                      >
                        <Download size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
