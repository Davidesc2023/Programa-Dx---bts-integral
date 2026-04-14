'use client';

/**
 * DoctorPicker — combobox que busca médicos por nombre.
 * Llama a GET /users?role=MEDICO&search=... y muestra una lista desplegable.
 * Al seleccionar, entrega el id del médico al padre mediante onChange.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { getDoctors } from '@/services/users.service';
import type { User } from '@/types/api.types';

interface DoctorPickerProps {
  value: string;             // doctorId seleccionado
  onChange: (id: string) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
}

export function DoctorPicker({
  value,
  onChange,
  error,
  disabled = false,
  label = 'Médico solicitante',
}: DoctorPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const doctors = await getDoctors(q.trim().length >= 1 ? q : undefined);
      setResults(doctors);
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

  function doctorLabel(doctor: User) {
    const name = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ');
    const detail = doctor.specialty ?? doctor.email;
    return name ? `${name} · ${detail}` : doctor.email;
  }

  function handleSelect(doctor: User) {
    onChange(doctor.id);
    setSelectedLabel(doctorLabel(doctor));
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
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      <div className="relative">
        {/* Selected display */}
        {value && selectedLabel ? (
          <div className="flex items-center justify-between rounded-lg border border-gray-300 px-3 py-2 bg-white text-sm text-gray-900">
            <span>{selectedLabel}</span>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="ml-2 text-gray-400 hover:text-gray-600"
                aria-label="Quitar médico"
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
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
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
              onFocus={() => {
                setOpen(true);
                if (results.length === 0) search('');
              }}
              placeholder="Buscar médico por nombre…"
              className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>
        )}

        {/* Dropdown */}
        {open && !value && (
          <ul className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg text-sm">
            {loading && (
              <li className="px-3 py-2 text-gray-400">Buscando…</li>
            )}
            {!loading && results.length === 0 && (
              <li className="px-3 py-2 text-gray-400">
                {query.length >= 1 ? `Sin resultados para "${query}"` : 'No hay médicos registrados'}
              </li>
            )}
            {results.map((doc) => (
              <li
                key={doc.id}
                onMouseDown={() => handleSelect(doc)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-primary-50 cursor-pointer"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {[doc.firstName, doc.lastName].filter(Boolean).join(' ') || doc.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {doc.specialty && <span>{doc.specialty}</span>}
                    {doc.specialty && doc.medicalLicense && <span> · </span>}
                    {doc.medicalLicense && <span>Reg. {doc.medicalLicense}</span>}
                    {!doc.specialty && !doc.medicalLicense && <span>{doc.email}</span>}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
