'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { tenantsService, Tenant, UpdateTenantDto } from '@/services/tenants.service';

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<UpdateTenantDto>({});

  useEffect(() => {
    tenantsService.get(id)
      .then(t => {
        setTenant(t);
        setForm({
          nombre: t.nombre,
          colorPrimario: t.colorPrimario || '#316358',
          logoUrl: t.logoUrl || '',
          emailContacto: t.emailContacto || '',
          telefonoContacto: t.telefonoContacto || '',
        });
      })
      .catch(() => setError('No se pudo cargar el tenant'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await tenantsService.update(id, form);
      setSuccess('Cambios guardados correctamente');
      const updated = await tenantsService.get(id);
      setTenant(updated);
    } catch {
      setError('No se pudieron guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: '#316358', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!tenant && !loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Tenant no encontrado</p>
        <Link href="/tenants" className="text-sm mt-2 inline-block underline">Volver a tenants</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/tenants" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tenant?.nombre}</h1>
          <p className="text-sm text-gray-500 mt-0.5">/{tenant?.slug} · {tenant?.activo ? 'Activo' : 'Inactivo'}</p>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            value={form.nombre || ''}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color primario</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.colorPrimario || '#316358'}
                onChange={e => setForm(f => ({ ...f, colorPrimario: e.target.value }))}
                className="w-10 h-10 rounded border border-gray-200 cursor-pointer p-0.5"
              />
              <input
                value={form.colorPrimario || ''}
                onChange={e => setForm(f => ({ ...f, colorPrimario: e.target.value }))}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none"
                placeholder="#316358"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input
              value={form.logoUrl || ''}
              onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email de contacto</label>
            <input
              type="email"
              value={form.emailContacto || ''}
              onChange={e => setForm(f => ({ ...f, emailContacto: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              value={form.telefonoContacto || ''}
              onChange={e => setForm(f => ({ ...f, telefonoContacto: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => tenantsService.toggle(id).then(() => router.refresh())}
            className="text-sm px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300"
          >
            {tenant?.activo ? 'Desactivar tenant' : 'Activar tenant'}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-60"
            style={{ backgroundColor: '#316358' }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
