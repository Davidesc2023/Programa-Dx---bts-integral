'use client';

import { useEffect, useState } from 'react';
import { Plus, Building2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { tenantsService, Tenant } from '@/services/tenants.service';

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    tenantsService.list()
      .then(setTenants)
      .catch(() => setError('No se pudieron cargar los tenants'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (id: string) => {
    await tenantsService.toggle(id);
    const updated = await tenantsService.list();
    setTenants(updated);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de organizaciones multi-tenant</p>
        </div>
        <Link
          href="/tenants/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: '#316358' }}
        >
          <Plus className="w-4 h-4" />
          Nuevo tenant
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

      {!loading && !error && tenants.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay tenants registrados aún</p>
        </div>
      )}

      {!loading && tenants.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: t.colorPrimario || '#316358' }}
                  >
                    {t.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{t.nombre}</p>
                    <p className="text-xs text-gray-400">/{t.slug}</p>
                  </div>
                </div>
                {t.activo
                  ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                }
              </div>

              {t.emailContacto && (
                <p className="text-xs text-gray-500">{t.emailContacto}</p>
              )}

              <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                <Link
                  href={`/tenants/${t.id}`}
                  className="flex-1 text-center text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300"
                >
                  Ver detalle
                </Link>
                <button
                  onClick={() => handleToggle(t.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border text-gray-600 hover:border-gray-300"
                >
                  {t.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
