'use client';

/**
 * PatientPicker — combobox que busca pacientes por nombre o número de documento.
 * Llama a GET /patients?search=... y muestra una lista desplegable.
 * Al seleccionar, entrega el id del paciente al padre mediante onChange.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { getPatients } from '@/services/patients.service';
import type { Patient } from '@/types/api.types';

interface PatientPickerProps {
  value: string;             // patientId seleccionado
  onChange: (id: string) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
}

export function PatientPicker({
  value,
  onChange,
  error,
  disabled = false,
  label = 'Paciente',
}: PatientPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search patients when query changes
  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await getPatients({ search: q, limit: 10, page: 1 });
      setResults(res.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(patient: Patient) {
    onChange(patient.id);
    setSelectedLabel(`${patient.firstName} ${patient.lastName} · ${patient.documentNumber}`);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  function handleClear() {
    onChange('');
    setSelectedLabel('');
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-1" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-on-surface-variant">{label}</label>
      )}

      <div className="relative">
        {/* Selected display */}
        {value && selectedLabel ? (
          <div className="flex items-center justify-between rounded-xl border border-outline-variant px-3 py-2.5 bg-surface-container-low text-sm text-on-surface">
            <span>{selectedLabel}</span>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="ml-2 text-outline hover:text-on-surface"
                aria-label="Quitar paciente"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ) : (
          /* Search input */
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              disabled={disabled}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => query.length >= 2 && setOpen(true)}
              placeholder="Buscar por nombre o documento…"
              className="w-full rounded-xl border border-outline-variant pl-8 pr-3 py-2.5 text-sm text-on-surface bg-surface-container-low placeholder:text-outline/60 focus:outline-none focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container disabled:opacity-50"
            />
          </div>
        )}

        {/* Dropdown */}
        {open && !value && (
          <ul className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg text-sm">
            {loading && (
              <li className="px-3 py-2 text-outline">Buscando…</li>
            )}
            {!loading && results.length === 0 && query.length >= 2 && (
              <li className="px-3 py-2 text-outline">Sin resultados para "{query}"</li>
            )}
            {!loading && query.length < 2 && (
              <li className="px-3 py-2 text-outline">Escribe al menos 2 caracteres…</li>
            )}
            {results.map((p) => (
              <li
                key={p.id}
                onMouseDown={() => handleSelect(p)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-surface-container-low cursor-pointer"
              >
                <div>
                  <p className="font-medium text-on-surface">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="text-xs text-outline">
                    {p.documentType} · {p.documentNumber}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
