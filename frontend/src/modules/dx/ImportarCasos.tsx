'use client';

import { useState, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { importarCasos } from '@/services/admin-dx.service';
import type { ImportRow, ImportResult } from '@/types/dx.types';
import { Button } from '@/components/ui/Button';

// ─── Column definitions ───────────────────────────────────────────────────────

const HEADERS: Array<{ key: keyof ImportRow; required: boolean }> = [
  { key: 'pais_codigo',                    required: true  },
  { key: 'medico_nombre',                  required: true  },
  { key: 'medico_especialidad',            required: true  },
  { key: 'medico_numero_registro',         required: true  },
  { key: 'medico_email',                   required: true  },
  { key: 'medico_tipo_registro',           required: false },
  { key: 'medico_whatsapp',                required: false },
  { key: 'medico_institucion',             required: false },
  { key: 'medico_ciudad',                  required: false },
  { key: 'paciente_nombre',                required: true  },
  { key: 'paciente_tipo_doc',              required: true  },
  { key: 'paciente_num_doc',               required: true  },
  { key: 'paciente_genero',                required: false },
  { key: 'paciente_eps',                   required: false },
  { key: 'paciente_telefono',              required: false },
  { key: 'paciente_email',                 required: false },
  { key: 'paciente_ciudad',                required: false },
  { key: 'paciente_departamento',          required: false },
  { key: 'paciente_direccion',             required: false },
  { key: 'rep_nombre',                     required: false },
  { key: 'rep_documento',                  required: false },
  { key: 'rep_parentesco',                 required: false },
  { key: 'rep_telefono',                   required: false },
  { key: 'resultado_previo_valor',         required: false },
  { key: 'resultado_previo_interpretacion',required: false },
];

const REQUIRED_KEYS = HEADERS.filter((h) => h.required).map((h) => h.key);
const HEADER_KEYS   = HEADERS.map((h) => h.key as string);

const PAISES_VALIDOS = ['CO', 'EC', 'PA', 'CL', 'CR', 'SV', 'DO', 'GT'];

const EXAMPLE_ROW: Record<string, string> = {
  pais_codigo: 'CO',
  medico_nombre: 'Dr. Juan García',
  medico_especialidad: 'Neurología',
  medico_numero_registro: 'RM-12345',
  medico_email: 'juan.garcia@hospital.com',
  medico_tipo_registro: '',
  medico_whatsapp: '+573001234567',
  medico_institucion: 'Hospital General',
  medico_ciudad: 'Bogotá',
  paciente_nombre: 'María Torres López',
  paciente_tipo_doc: 'CC',
  paciente_num_doc: '1234567890',
  paciente_genero: 'F',
  paciente_eps: 'Sura',
  paciente_telefono: '+573109876543',
  paciente_email: '',
  paciente_ciudad: 'Bogotá',
  paciente_departamento: 'Cundinamarca',
  paciente_direccion: '',
  rep_nombre: '',
  rep_documento: '',
  rep_parentesco: '',
  rep_telefono: '',
  resultado_previo_valor: '',
  resultado_previo_interpretacion: '',
};

// ─── CSV utilities ────────────────────────────────────────────────────────────

function csvEscape(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function downloadTemplate() {
  const header = HEADER_KEYS.join(',');
  const example = HEADER_KEYS.map((k) => csvEscape(EXAMPLE_ROW[k] ?? '')).join(',');
  const blob = new Blob(['﻿' + header + '\n' + example + '\n'], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = 'plantilla_importacion_dx.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function parseLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i <= line.length) {
    if (i === line.length) { fields.push(''); break; }
    if (line[i] === '"') {
      i++;
      let val = '';
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') { val += '"'; i += 2; }
        else if (line[i] === '"') { i++; break; }
        else val += line[i++];
      }
      fields.push(val);
      if (line[i] === ',') i++;
    } else {
      const end = line.indexOf(',', i);
      if (end === -1) { fields.push(line.slice(i).trim()); i = line.length + 1; }
      else { fields.push(line.slice(i, end).trim()); i = end + 1; }
    }
  }
  return fields;
}

function parseCSV(text: string): Record<string, string>[] {
  const clean = text.startsWith('﻿') ? text.slice(1) : text;
  const lines = clean.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return [];
  const headers = parseLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = parseLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = vals[idx] ?? ''; });
    return obj;
  });
}

function validateRow(row: Record<string, string>): string | null {
  for (const key of REQUIRED_KEYS) {
    if (!row[key as string]?.trim()) return `Campo requerido vacío: ${key as string}`;
  }
  if (!PAISES_VALIDOS.includes(row.pais_codigo?.trim().toUpperCase())) {
    return `País no válido: "${row.pais_codigo}" — válidos: ${PAISES_VALIDOS.join(', ')}`;
  }
  return null;
}

// ─── Preview columns ──────────────────────────────────────────────────────────

const PREVIEW_COLS = [
  'pais_codigo', 'medico_nombre', 'medico_email',
  'paciente_nombre', 'paciente_tipo_doc', 'paciente_num_doc',
];

// ─── Input style helpers ──────────────────────────────────────────────────────

const inputCls  = 'w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(27,122,107,0.2)]';
const inputStyle = { background: '#f2f4f4', border: '1px solid #bec9c5', color: '#191c1d' };

// ─── Main component ───────────────────────────────────────────────────────────

export function ImportarCasos() {
  const [step, setStep]         = useState<1 | 2 | 3>(1);
  const [rows, setRows]         = useState<Record<string, string>[]>([]);
  const [rowErrors, setRowErrors] = useState<Map<number, string>>(new Map());
  const [dragging, setDragging] = useState(false);
  const [tenant, setTenant]     = useState('bts');
  const [programa, setPrograma] = useState('wilson');
  const fileRef                 = useRef<HTMLInputElement>(null);

  const validRows = rows.filter((_, i) => !rowErrors.has(i));
  const capped    = rows.slice(0, 200);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text  = e.target?.result as string;
      const parsed = parseCSV(text);
      const errors = new Map<number, string>();
      parsed.forEach((row, i) => {
        const msg = validateRow(row);
        if (msg) errors.set(i, msg);
      });
      setRows(parsed);
      setRowErrors(errors);
      if (parsed.length > 0) setStep(2);
    };
    reader.readAsText(file, 'utf-8');
  }, []);

  const reset = () => { setStep(1); setRows([]); setRowErrors(new Map()); };

  const { mutate, isPending, data: result } = useMutation<ImportResult, Error>({
    mutationFn: () =>
      importarCasos(tenant, programa, validRows.slice(0, 200) as unknown as ImportRow[]),
    onSuccess: () => setStep(3),
  });

  // ── Step 1: Setup + Upload ──────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#191c1d' }}>Importar casos DX</h1>
          <p className="text-sm mt-1" style={{ color: '#6e7976' }}>
            Carga masiva desde CSV — máximo 200 filas por importación
          </p>
        </div>

        {/* Config */}
        <div className="bg-white rounded-2xl border border-[#e0e8e5] p-5 space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: '#191c1d' }}>Configuración</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#3e4946' }}>
                Tenant (slug)
              </label>
              <input
                className={inputCls}
                style={inputStyle}
                value={tenant}
                onChange={(e) => setTenant(e.target.value.trim())}
                placeholder="ej: bts"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#3e4946' }}>
                Programa
              </label>
              <select
                className={inputCls}
                style={inputStyle}
                value={programa}
                onChange={(e) => setPrograma(e.target.value)}
              >
                <option value="wilson">Wilson</option>
                <option value="alfa1">DAAT (Alfa-1)</option>
                <option value="duchenne">Duchenne</option>
              </select>
            </div>
          </div>
        </div>

        {/* Template download */}
        <div className="bg-white rounded-2xl border border-[#e0e8e5] p-5">
          <h2 className="text-sm font-semibold mb-1" style={{ color: '#191c1d' }}>
            Paso 1 — Descargar plantilla
          </h2>
          <p className="text-xs mb-3" style={{ color: '#6e7976' }}>
            La plantilla incluye todas las columnas con una fila de ejemplo. Los campos obligatorios son:
            pais_codigo, medico_nombre, medico_especialidad, medico_numero_registro, medico_email,
            paciente_nombre, paciente_tipo_doc, paciente_num_doc.
          </p>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download size={15} className="mr-2" />
            Descargar plantilla CSV
          </Button>
        </div>

        {/* File upload */}
        <div className="bg-white rounded-2xl border border-[#e0e8e5] p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#191c1d' }}>
            Paso 2 — Subir archivo CSV
          </h2>
          <div
            role="button"
            tabIndex={0}
            className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors"
            style={{
              borderColor: dragging ? '#1B7A6B' : '#bec9c5',
              background:  dragging ? 'rgba(27,122,107,0.04)' : '#f2f4f4',
            }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          >
            <Upload size={28} style={{ color: '#9eaaa7', margin: '0 auto 8px' }} />
            <p className="text-sm font-medium" style={{ color: '#3e4946' }}>
              Arrastra tu CSV aquí o haz clic para seleccionar
            </p>
            <p className="text-xs mt-1" style={{ color: '#9eaaa7' }}>Solo archivos .csv</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    );
  }

  // ── Step 2: Preview + confirm ───────────────────────────────────────────────
  if (step === 2) {
    const validCount = capped.filter((_, i) => !rowErrors.has(i)).length;
    const errorCount = capped.filter((_, i) =>  rowErrors.has(i)).length;

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black" style={{ color: '#191c1d' }}>Vista previa</h1>
            <p className="text-sm mt-0.5" style={{ color: '#6e7976' }}>
              {rows.length} filas leídas · {validCount} válidas · {errorCount} con error
              {rows.length > 200 ? ' · solo se importarán las primeras 200' : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={reset}>
              Cambiar archivo
            </Button>
            <Button
              size="sm"
              disabled={validCount === 0 || isPending}
              onClick={() => mutate()}
            >
              {isPending
                ? 'Importando…'
                : `Importar ${validCount} caso${validCount !== 1 ? 's' : ''} válido${validCount !== 1 ? 's' : ''}`}
              <ChevronRight size={15} className="ml-1" />
            </Button>
          </div>
        </div>

        {/* Summary chips */}
        <div className="flex gap-3 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: 'rgba(22,163,74,0.10)', color: '#16a34a' }}
          >
            <CheckCircle size={13} /> {validCount} válidas
          </span>
          {errorCount > 0 && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'rgba(186,26,26,0.10)', color: '#ba1a1a' }}
            >
              <XCircle size={13} /> {errorCount} con error (se omitirán)
            </span>
          )}
        </div>

        {rows.length > 200 && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={{ background: 'rgba(217,119,6,0.08)', color: '#d97706', border: '1px solid rgba(217,119,6,0.2)' }}
          >
            <AlertCircle size={15} />
            El archivo tiene {rows.length} filas. Solo se importarán las primeras 200.
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#e0e8e5] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead style={{ borderBottom: '1px solid #e0e8e5' }}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold w-12" style={{ color: '#9eaaa7' }}>#</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: '#9eaaa7' }}>Estado</th>
                  {PREVIEW_COLS.map((c) => (
                    <th key={c} className="px-4 py-3 text-left font-semibold" style={{ color: '#9eaaa7' }}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {capped.map((row, i) => {
                  const error = rowErrors.get(i);
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid #f2f4f4',
                        background: error ? 'rgba(186,26,26,0.03)' : undefined,
                      }}
                    >
                      <td className="px-4 py-2.5 font-mono" style={{ color: '#9eaaa7' }}>{i + 2}</td>
                      <td className="px-4 py-2.5">
                        {error ? (
                          <span
                            className="inline-flex items-center gap-1 font-medium"
                            style={{ color: '#ba1a1a' }}
                            title={error}
                          >
                            <XCircle size={12} />
                            <span className="max-w-[200px] truncate">{error}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium" style={{ color: '#16a34a' }}>
                            <CheckCircle size={12} /> OK
                          </span>
                        )}
                      </td>
                      {PREVIEW_COLS.map((c) => (
                        <td
                          key={c}
                          className="px-4 py-2.5 max-w-[160px] truncate"
                          style={{ color: error ? '#ba1a1a' : '#191c1d' }}
                        >
                          {row[c] || <span style={{ color: '#bec9c5' }}>—</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Results ─────────────────────────────────────────────────────────
  if (!result) return null;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black" style={{ color: '#191c1d' }}>Importación completada</h1>
        <p className="text-sm mt-1" style={{ color: '#6e7976' }}>
          Resumen del proceso de importación masiva
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#e0e8e5] p-4 text-center">
          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#9eaaa7' }}>Total</p>
          <p className="text-3xl font-black" style={{ color: '#191c1d' }}>{result.total}</p>
        </div>
        <div
          className="rounded-2xl border p-4 text-center"
          style={{ background: 'rgba(22,163,74,0.06)', borderColor: 'rgba(22,163,74,0.2)' }}
        >
          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#16a34a' }}>Creados</p>
          <p className="text-3xl font-black" style={{ color: '#16a34a' }}>{result.exitosos}</p>
        </div>
        <div
          className="rounded-2xl border p-4 text-center"
          style={{
            background:   result.errores.length > 0 ? 'rgba(186,26,26,0.06)' : '#f2f4f4',
            borderColor:  result.errores.length > 0 ? 'rgba(186,26,26,0.2)' : '#e0e8e5',
          }}
        >
          <p
            className="text-xs uppercase tracking-wide mb-1"
            style={{ color: result.errores.length > 0 ? '#ba1a1a' : '#9eaaa7' }}
          >
            Errores
          </p>
          <p
            className="text-3xl font-black"
            style={{ color: result.errores.length > 0 ? '#ba1a1a' : '#9eaaa7' }}
          >
            {result.errores.length}
          </p>
        </div>
      </div>

      {/* Row errors */}
      {result.errores.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e0e8e5] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#e0e8e5]">
            <h2 className="text-sm font-semibold" style={{ color: '#ba1a1a' }}>
              Filas con error ({result.errores.length})
            </h2>
          </div>
          <div className="divide-y divide-[#f2f4f4]">
            {result.errores.map((e) => (
              <div key={e.fila} className="flex items-center gap-3 px-5 py-3">
                <span className="font-mono text-xs shrink-0 w-16" style={{ color: '#9eaaa7' }}>
                  Fila {e.fila}
                </span>
                <span className="text-sm" style={{ color: '#ba1a1a' }}>{e.mensaje}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Created cases */}
      {result.casos.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e0e8e5] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#e0e8e5]">
            <h2 className="text-sm font-semibold" style={{ color: '#191c1d' }}>
              Casos creados ({result.casos.length})
            </h2>
          </div>
          <div className="divide-y divide-[#f2f4f4] max-h-80 overflow-y-auto">
            {result.casos.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs" style={{ color: '#9eaaa7' }}>Fila {c.fila}</span>
                  <span className="font-mono text-xs font-bold" style={{ color: '#1B7A6B' }}>
                    {c.consecutivo}
                  </span>
                </div>
                <Link
                  href={`/dx/casos/${c.id}`}
                  className="text-xs font-medium hover:underline"
                  style={{ color: '#1B7A6B' }}
                >
                  Ver caso
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={reset}>
          Nueva importación
        </Button>
        <Link href="/dx/casos">
          <Button>Ver todos los casos</Button>
        </Link>
      </div>
    </div>
  );
}
