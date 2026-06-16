import {
  loginSchema,
  patientSchema,
  orderSchema,
  userSchema,
  resultSchema,
  appointmentSchema,
  validateAttachmentFile,
  MAX_FILE_SIZE_BYTES,
} from '@/lib/validators';

// ─── loginSchema ──────────────────────────────────────────────────────────────

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(() => loginSchema.parse({ email: 'admin@test.com', password: 'secret' })).not.toThrow();
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'notanemail', password: 'secret' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
  });
});

// ─── patientSchema ────────────────────────────────────────────────────────────

const VALID_PATIENT = {
  firstName: 'Juan',
  lastName: 'García',
  documentType: 'CC' as const,
  documentNumber: '1234567890',
  birthDate: '1990-01-01',
  phone: '3001234567',
  email: 'juan@test.com',
};

describe('patientSchema', () => {
  it('accepts valid patient data', () => {
    expect(() => patientSchema.parse(VALID_PATIENT)).not.toThrow();
  });

  it('accepts patient with optional fields', () => {
    expect(() => patientSchema.parse({ ...VALID_PATIENT, city: 'Bogotá', insurance: 'Sura' })).not.toThrow();
  });

  it('rejects firstName shorter than 2 chars', () => {
    expect(patientSchema.safeParse({ ...VALID_PATIENT, firstName: 'J' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(patientSchema.safeParse({ ...VALID_PATIENT, email: 'bad' }).success).toBe(false);
  });

  it('rejects invalid documentType', () => {
    expect(patientSchema.safeParse({ ...VALID_PATIENT, documentType: 'UNKNOWN' }).success).toBe(false);
  });

  it('rejects short documentNumber', () => {
    expect(patientSchema.safeParse({ ...VALID_PATIENT, documentNumber: '123' }).success).toBe(false);
  });

  it('rejects short phone', () => {
    expect(patientSchema.safeParse({ ...VALID_PATIENT, phone: '123' }).success).toBe(false);
  });
});

// ─── orderSchema ──────────────────────────────────────────────────────────────

describe('orderSchema', () => {
  it('accepts valid order', () => {
    expect(() => orderSchema.parse({ patientId: 'patient-uuid', priority: 'NORMAL' })).not.toThrow();
  });

  it('accepts all priorities', () => {
    for (const p of ['URGENTE', 'NORMAL', 'RUTINA'] as const) {
      expect(orderSchema.safeParse({ patientId: 'uuid', priority: p }).success).toBe(true);
    }
  });

  it('rejects invalid priority', () => {
    expect(orderSchema.safeParse({ patientId: 'uuid', priority: 'HIGH' }).success).toBe(false);
  });

  it('rejects empty patientId', () => {
    expect(orderSchema.safeParse({ patientId: '', priority: 'NORMAL' }).success).toBe(false);
  });
});

// ─── userSchema ───────────────────────────────────────────────────────────────

describe('userSchema', () => {
  it('accepts valid user', () => {
    expect(() => userSchema.parse({ email: 'admin@test.com', role: 'ADMIN' })).not.toThrow();
  });

  it('accepts all roles', () => {
    for (const role of ['ADMIN', 'OPERADOR', 'LABORATORIO', 'MEDICO'] as const) {
      expect(userSchema.safeParse({ email: 'a@b.com', role }).success).toBe(true);
    }
  });

  it('rejects invalid role', () => {
    expect(userSchema.safeParse({ email: 'a@b.com', role: 'SUPERADMIN' }).success).toBe(false);
  });

  it('accepts password of 8+ chars', () => {
    expect(userSchema.safeParse({ email: 'a@b.com', role: 'ADMIN', password: '12345678' }).success).toBe(true);
  });

  it('rejects password shorter than 8 chars (when not empty)', () => {
    expect(userSchema.safeParse({ email: 'a@b.com', role: 'ADMIN', password: '123' }).success).toBe(false);
  });

  it('accepts empty password string (treated as "no change")', () => {
    expect(userSchema.safeParse({ email: 'a@b.com', role: 'ADMIN', password: '' }).success).toBe(true);
  });
});

// ─── resultSchema ─────────────────────────────────────────────────────────────

describe('resultSchema', () => {
  it('accepts valid result', () => {
    expect(() => resultSchema.parse({ orderId: 'order-uuid', examType: 'Hematología', value: '12.5' })).not.toThrow();
  });

  it('rejects missing orderId', () => {
    expect(resultSchema.safeParse({ examType: 'H', value: '1' }).success).toBe(false);
  });

  it('rejects empty examType', () => {
    expect(resultSchema.safeParse({ orderId: 'uuid', examType: '', value: '1' }).success).toBe(false);
  });
});

// ─── appointmentSchema ────────────────────────────────────────────────────────

describe('appointmentSchema', () => {
  it('accepts valid appointment', () => {
    expect(() => appointmentSchema.parse({ patientId: 'uuid', scheduledAt: '2026-07-01T10:00' })).not.toThrow();
  });

  it('rejects empty patientId', () => {
    expect(appointmentSchema.safeParse({ patientId: '', scheduledAt: '2026-07-01T10:00' }).success).toBe(false);
  });

  it('rejects missing scheduledAt', () => {
    expect(appointmentSchema.safeParse({ patientId: 'uuid', scheduledAt: '' }).success).toBe(false);
  });
});

// ─── validateAttachmentFile ───────────────────────────────────────────────────

function makeFile(type: string, sizeBytes: number): File {
  const file = new File(['x'], 'test.pdf', { type });
  Object.defineProperty(file, 'size', { value: sizeBytes, configurable: true });
  return file;
}

describe('validateAttachmentFile', () => {
  it('accepts PDF files under 10 MB', () => {
    expect(validateAttachmentFile(makeFile('application/pdf', 1024))).toBeNull();
  });

  it('accepts image/jpeg, image/png, image/webp', () => {
    expect(validateAttachmentFile(makeFile('image/jpeg', 1024))).toBeNull();
    expect(validateAttachmentFile(makeFile('image/png', 1024))).toBeNull();
    expect(validateAttachmentFile(makeFile('image/webp', 1024))).toBeNull();
  });

  it('rejects unsupported MIME types', () => {
    const msg = validateAttachmentFile(makeFile('application/zip', 1024));
    expect(msg).toMatch(/PDF|JPG|PNG|WEBP/);
  });

  it('rejects files over 10 MB', () => {
    const oversized = makeFile('application/pdf', MAX_FILE_SIZE_BYTES + 1);
    expect(validateAttachmentFile(oversized)).toMatch(/10 MB/);
  });

  it('accepts file exactly at 10 MB limit', () => {
    expect(validateAttachmentFile(makeFile('application/pdf', MAX_FILE_SIZE_BYTES))).toBeNull();
  });
});
