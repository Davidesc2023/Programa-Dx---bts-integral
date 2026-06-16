// Tests for the CSV parsing and validation logic extracted from ImportarCasos

// ─── Inline the functions under test (they're not exported, so we replicate) ──

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

const REQUIRED_KEYS = [
  'pais_codigo', 'medico_nombre', 'medico_especialidad',
  'medico_numero_registro', 'medico_email',
  'paciente_nombre', 'paciente_tipo_doc', 'paciente_num_doc',
];
const PAISES_VALIDOS = ['CO', 'EC', 'PA', 'CL', 'CR', 'SV', 'DO', 'GT'];

function validateRow(row: Record<string, string>): string | null {
  for (const key of REQUIRED_KEYS) {
    if (!row[key]?.trim()) return `Campo requerido vacío: ${key}`;
  }
  if (!PAISES_VALIDOS.includes(row.pais_codigo?.trim().toUpperCase())) {
    return `País no válido: "${row.pais_codigo}"`;
  }
  return null;
}

// ─── parseLine ─────────────────────────────────────────────────────────────────

describe('parseLine', () => {
  it('splits simple comma-separated values', () => {
    expect(parseLine('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('handles quoted fields with commas inside', () => {
    expect(parseLine('"García, Juan",b,c')).toEqual(['García, Juan', 'b', 'c']);
  });

  it('handles escaped double quotes inside quoted field', () => {
    expect(parseLine('"He said ""hello""",b')).toEqual(['He said "hello"', 'b']);
  });

  it('trims unquoted values', () => {
    expect(parseLine('  a  ,  b  ,  c  ')).toEqual(['a', 'b', 'c']);
  });

  it('handles empty fields', () => {
    expect(parseLine('a,,c')).toEqual(['a', '', 'c']);
  });

  it('handles trailing comma', () => {
    const result = parseLine('a,b,');
    expect(result[0]).toBe('a');
    expect(result[1]).toBe('b');
    // trailing empty
    expect(result[2]).toBe('');
  });
});

// ─── parseCSV ──────────────────────────────────────────────────────────────────

describe('parseCSV', () => {
  const HEADER = 'pais_codigo,medico_nombre,paciente_nombre';

  it('returns empty array for header-only CSV', () => {
    expect(parseCSV(HEADER)).toEqual([]);
  });

  it('parses one data row correctly', () => {
    const csv = `${HEADER}\nCO,Dr. García,Juan Pérez`;
    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      pais_codigo: 'CO',
      medico_nombre: 'Dr. García',
      paciente_nombre: 'Juan Pérez',
    });
  });

  it('strips UTF-8 BOM', () => {
    const csv = `﻿${HEADER}\nCO,Dr. García,Juan Pérez`;
    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].pais_codigo).toBe('CO');
  });

  it('handles CRLF line endings', () => {
    const csv = `${HEADER}\r\nCO,Dr. García,Juan Pérez\r\n`;
    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
  });

  it('skips blank lines', () => {
    const csv = `${HEADER}\nCO,García,Pérez\n\nEC,García2,Pérez2`;
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
  });

  it('handles quoted field with comma in a full row', () => {
    const csv = `${HEADER}\nCO,"García, Juan",María López`;
    const result = parseCSV(csv);
    expect(result[0].medico_nombre).toBe('García, Juan');
  });

  it('maps missing columns to empty string', () => {
    const csv = `${HEADER}\nCO,García`;
    const result = parseCSV(csv);
    expect(result[0].paciente_nombre).toBe('');
  });

  it('returns empty array for single-line (no data rows)', () => {
    expect(parseCSV('')).toEqual([]);
    expect(parseCSV('only-header')).toEqual([]);
  });
});

// ─── validateRow ───────────────────────────────────────────────────────────────

const VALID_ROW: Record<string, string> = {
  pais_codigo: 'CO',
  medico_nombre: 'Dr. García',
  medico_especialidad: 'Neurología',
  medico_numero_registro: 'RM-123',
  medico_email: 'dr@hospital.com',
  paciente_nombre: 'María Pérez',
  paciente_tipo_doc: 'CC',
  paciente_num_doc: '1234567890',
};

describe('validateRow', () => {
  it('returns null for a valid row', () => {
    expect(validateRow(VALID_ROW)).toBeNull();
  });

  it.each(REQUIRED_KEYS)('rejects row missing required field: %s', (field) => {
    const row = { ...VALID_ROW, [field]: '' };
    expect(validateRow(row)).toMatch(/Campo requerido vacío/);
  });

  it('rejects invalid country code', () => {
    const row = { ...VALID_ROW, pais_codigo: 'US' };
    expect(validateRow(row)).toMatch(/País no válido/);
  });

  it.each(PAISES_VALIDOS)('accepts valid country: %s', (pais) => {
    const row = { ...VALID_ROW, pais_codigo: pais };
    expect(validateRow(row)).toBeNull();
  });

  it('accepts country code in uppercase (case-insensitive check)', () => {
    const row = { ...VALID_ROW, pais_codigo: 'co' };
    // The validator does .toUpperCase() so 'co' → 'CO' should pass
    expect(validateRow(row)).toBeNull();
  });

  it('returns first missing field error (not all)', () => {
    const row: Record<string, string> = {};
    const result = validateRow(row);
    expect(result).toContain('pais_codigo');
  });
});
