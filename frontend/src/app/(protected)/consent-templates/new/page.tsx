'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { consentTemplatesService, CreateConsentTemplateDto } from '@/services/consent-templates.service';

export default function NewConsentTemplatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CreateConsentTemplateDto>({
    programaCodigo: '',
    paisCodigo: 'CO',
    tipo: 'MEDICO',
    titulo: '',
    cuerpoHtml: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await consentTemplatesService.create(form);
      router.push('/consent-templates');
    } catch {
      setError('No se pudo crear la plantilla. Verifica los datos e intenta nuevamente.');
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/consent-templates" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva plantilla</h1>
          <p className="text-sm text-gray-500 mt-0.5">Crear plantilla de consentimiento informado</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
            <input
              required
              value={form.programaCodigo}
              onChange={e => setForm(f => ({ ...f, programaCodigo: e.target.value }))}
              placeholder="ej. DAAT, WILSON"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#316358' } as React.CSSProperties}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
            <select
              value={form.paisCodigo}
              onChange={e => setForm(f => ({ ...f, paisCodigo: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="CO">Colombia (CO)</option>
              <option value="MX">México (MX)</option>
              <option value="AR">Argentina (AR)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <div className="flex gap-4">
            {(['MEDICO', 'PACIENTE'] as const).map(t => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  value={t}
                  checked={form.tipo === t}
                  onChange={() => setForm(f => ({ ...f, tipo: t }))}
                  className="accent-teal-700"
                />
                <span className="text-sm text-gray-700">{t}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            required
            value={form.titulo}
            onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            placeholder="Título de la plantilla"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cuerpo HTML</label>
          <textarea
            required
            rows={12}
            value={form.cuerpoHtml}
            onChange={e => setForm(f => ({ ...f, cuerpoHtml: e.target.value }))}
            placeholder="<p>Contenido del consentimiento...</p>"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none resize-y"
          />
          <p className="text-xs text-gray-400 mt-1">Puedes usar variables: {'{{medico_nombre}}'}, {'{{paciente_nombre}}'}, {'{{fecha}}'}</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/consent-templates"
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-60"
            style={{ backgroundColor: '#316358' }}
          >
            {saving ? 'Guardando…' : 'Crear plantilla'}
          </button>
        </div>
      </form>
    </div>
  );
}
