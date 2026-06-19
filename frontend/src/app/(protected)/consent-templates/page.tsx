'use client';

import { useEffect, useState } from 'react';
import { Plus, FileText, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { consentTemplatesService, ConsentTemplate } from '@/services/consent-templates.service';

export default function ConsentTemplatesPage() {
  const [templates, setTemplates] = useState<ConsentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    consentTemplatesService.list()
      .then(setTemplates)
      .catch(() => setError('No se pudieron cargar las plantillas'))
      .finally(() => setLoading(false));
  }, []);

  const handleActivate = async (id: string) => {
    await consentTemplatesService.activate(id);
    const updated = await consentTemplatesService.list();
    setTemplates(updated);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas de Consentimiento</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de plantillas de consentimiento informado</p>
        </div>
        <Link
          href="/consent-templates/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: '#316358' }}
        >
          <Plus className="w-4 h-4" />
          Nueva plantilla
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: '#316358', borderTopColor: 'transparent' }} />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>
      )}

      {!loading && !error && templates.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay plantillas creadas aún</p>
        </div>
      )}

      {!loading && templates.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Título</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Programa</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">País</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Versión</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{t.titulo}</td>
                  <td className="px-4 py-3 text-gray-600">{t.programaCodigo}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      t.tipo === 'MEDICO' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {t.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 uppercase">{t.paisCodigo}</td>
                  <td className="px-4 py-3 text-gray-600">v{t.version}</td>
                  <td className="px-4 py-3">
                    {t.activo
                      ? <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-4 h-4" />Activa</span>
                      : <span className="flex items-center gap-1 text-gray-400"><XCircle className="w-4 h-4" />Inactiva</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/consent-templates/${t.id}`}
                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300"
                      >
                        Ver
                      </Link>
                      {!t.activo && (
                        <button
                          onClick={() => handleActivate(t.id)}
                          className="text-xs px-3 py-1.5 rounded-lg text-white"
                          style={{ backgroundColor: '#316358' }}
                        >
                          Activar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
