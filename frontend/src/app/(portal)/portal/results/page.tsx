'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Paperclip } from 'lucide-react';
import { getPortalResults } from '@/services/portal.service';
import type { Result } from '@/types/api.types';
import { getApiErrorMessage } from '@/services/api';

export default function PortalResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPortalResults()
      .then(setResults)
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-1">Mis resultados</h1>
      <p className="text-sm text-gray-500 mb-6">Resultados de exámenes disponibles</p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading && <p className="text-sm text-gray-500">Cargando resultados...</p>}

      {!loading && results.length === 0 && !error && (
        <p className="text-sm text-gray-500">No tienes resultados disponibles aún.</p>
      )}

      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">{result.examType}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(result.createdAt).toLocaleDateString('es-CO', { dateStyle: 'medium' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {result.value}
                  {result.unit && <span className="text-sm font-normal text-gray-500 ml-1">{result.unit}</span>}
                </p>
                {result.referenceRange && (
                  <p className="text-xs text-gray-400">Ref: {result.referenceRange}</p>
                )}
              </div>
            </div>

            {result.notes && (
              <p className="text-sm text-gray-600 mt-2 border-t border-gray-50 pt-2">{result.notes}</p>
            )}

            {result.attachments && result.attachments.length > 0 && (
              <div className="mt-3 border-t border-gray-50 pt-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Archivos adjuntos</p>
                <ul className="space-y-1">
                  {result.attachments.map((att) => (
                    <li key={att.id} className="flex items-center gap-2 text-xs text-primary-600">
                      <Paperclip size={12} />
                      {att.fileName}
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
