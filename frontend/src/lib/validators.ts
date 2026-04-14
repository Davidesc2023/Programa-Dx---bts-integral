import { z } from 'zod';

// ─── Auth schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo es requerido' })
    .email('Ingresa un correo válido'),
  password: z
    .string({ required_error: 'La contraseña es requerida' })
    .min(1, 'La contraseña es requerida'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Patient schemas ──────────────────────────────────────────────────────────

export const patientSchema = z.object({
  firstName: z
    .string({ required_error: 'El nombre es requerido' })
    .min(2, 'Mínimo 2 caracteres'),
  lastName: z
    .string({ required_error: 'El apellido es requerido' })
    .min(2, 'Mínimo 2 caracteres'),
  documentType: z.enum(['DNI', 'PASAPORTE', 'CE', 'NIT', 'CC', 'TI', 'RC'], {
    required_error: 'Selecciona un tipo de documento',
  }),
  documentNumber: z
    .string({ required_error: 'El número de documento es requerido' })
    .min(5, 'Mínimo 5 caracteres'),
  birthDate: z
    .string({ required_error: 'La fecha de nacimiento es requerida' })
    .min(1, 'La fecha de nacimiento es requerida'),
  phone: z
    .string({ required_error: 'El teléfono es requerido' })
    .min(7, 'Mínimo 7 dígitos'),
  email: z
    .string({ required_error: 'El correo es requerido' })
    .email('Ingresa un correo válido'),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

// ─── Order schemas ────────────────────────────────────────────────────────────

export const orderSchema = z.object({
  patientId: z.string({ required_error: 'Selecciona un paciente' }).min(1, 'Selecciona un paciente'),
  physician: z
    .string({ required_error: 'El nombre del médico es requerido' })
    .min(3, 'Mínimo 3 caracteres'),
  doctorId: z.string().optional(),
  priority: z.enum(['URGENTE', 'NORMAL', 'RUTINA'], {
    required_error: 'Selecciona la prioridad',
  }),
  estimatedCompletionDate: z.string().optional(),
  observations: z.string().optional(),
});

export type OrderFormValues = z.infer<typeof orderSchema>;

// ─── Result schemas ───────────────────────────────────────────────────────────

export const resultSchema = z.object({
  orderId: z.string({ required_error: 'Selecciona una orden' }).min(1, 'Selecciona una orden'),
  examType: z
    .string({ required_error: 'El tipo de examen es requerido' })
    .min(1, 'El tipo de examen es requerido'),
  value: z
    .string({ required_error: 'El valor es requerido' })
    .min(1, 'El valor es requerido'),
  unit: z.string().optional(),
  referenceRange: z.string().optional(),
  notes: z.string().optional(),
});

export type ResultFormValues = z.infer<typeof resultSchema>;
/** Alias used in result form components */
export type ResultInput = ResultFormValues;

// ─── Appointment schemas ──────────────────────────────────────────────────────

export const appointmentSchema = z.object({
  patientId: z.string({ required_error: 'Selecciona un paciente' }).min(1, 'Selecciona un paciente'),
  orderId: z.string().optional(),
  scheduledAt: z
    .string({ required_error: 'La fecha y hora son requeridas' })
    .min(1, 'La fecha y hora son requeridas'),
  notes: z.string().optional(),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;
/** Alias used in appointment form components */
export type AppointmentInput = AppointmentFormValues;

// ─── Attachment validation (client-side, before upload) ───────────────────────

export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateAttachmentFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Solo se permiten archivos PDF, JPG, PNG o WEBP';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'El archivo no puede superar los 10 MB';
  }
  return null;
}
