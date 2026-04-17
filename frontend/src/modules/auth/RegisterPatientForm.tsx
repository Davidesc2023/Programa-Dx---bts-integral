'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { registerPatientRequest } from '@/services/auth.service';
import { getApiErrorMessage } from '@/services/api';
import { DocumentType } from '@/types/enums';

const registerPatientSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  documentType: z.nativeEnum(DocumentType, { message: 'Tipo de documento inválido' }),
  documentNumber: z.string().min(1, 'El número de documento es requerido'),
});

type RegisterPatientFormValues = z.infer<typeof registerPatientSchema>;

interface Props {
  onSuccess: () => void;
  onBack: () => void;
}

export function RegisterPatientForm({ onSuccess, onBack }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterPatientFormValues>({
    resolver: zodResolver(registerPatientSchema),
    defaultValues: { documentType: DocumentType.CC },
  });

  const onSubmit = async (values: RegisterPatientFormValues) => {
    setServerError(null);
    try {
      await registerPatientRequest(values);
      setSuccessMsg(
        'Cuenta creada correctamente. Ahora puedes iniciar sesión con tu correo y contraseña.',
      );
      setTimeout(onSuccess, 2500);
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo.png"
            alt="BTS Integral"
            width={200}
            height={80}
            priority
            className="object-contain"
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-md border border-surface-container-high p-8">
          <h1 className="text-2xl font-semibold text-on-surface mb-1">Crear cuenta de paciente</h1>
          <p className="text-sm text-outline mb-6">
            Regístrate con tus datos para acceder a tu portal de resultados.
          </p>

          {successMsg ? (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
              {successMsg}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              {/* Nombre */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-on-surface-variant mb-1">
                    Nombre
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Juan"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.firstName
                        ? 'border-red-400 focus:ring-red-300'
                        : 'border-outline-variant focus:ring-primary-300 focus:border-primary-500'
                    }`}
                    {...register('firstName')}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-on-surface-variant mb-1">
                    Apellido
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Pérez"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.lastName
                        ? 'border-red-400 focus:ring-red-300'
                        : 'border-outline-variant focus:ring-primary-300 focus:border-primary-500'
                    }`}
                    {...register('lastName')}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Documento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="documentType" className="block text-sm font-medium text-on-surface-variant mb-1">
                    Tipo doc.
                  </label>
                  <select
                    id="documentType"
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
                    {...register('documentType')}
                  >
                    {Object.values(DocumentType).map((dt) => (
                      <option key={dt} value={dt}>{dt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="documentNumber" className="block text-sm font-medium text-on-surface-variant mb-1">
                    Número
                  </label>
                  <input
                    id="documentNumber"
                    type="text"
                    placeholder="12345678"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.documentNumber
                        ? 'border-red-400 focus:ring-red-300'
                        : 'border-outline-variant focus:ring-primary-300 focus:border-primary-500'
                    }`}
                    {...register('documentNumber')}
                  />
                  {errors.documentNumber && (
                    <p className="mt-1 text-xs text-red-600">{errors.documentNumber.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant mb-1">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="usuario@ejemplo.com"
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                    errors.email
                      ? 'border-red-400 focus:ring-red-300'
                      : 'border-outline-variant focus:ring-primary-300 focus:border-primary-500'
                  }`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-on-surface-variant mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.password
                        ? 'border-red-400 focus:ring-red-300'
                        : 'border-outline-variant focus:ring-primary-300 focus:border-primary-500'
                    }`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Server error */}
              {serverError && (
                <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {serverError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
              >
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>
          )}

          {/* Back to login */}
          <p className="mt-4 text-center text-sm text-outline">
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={onBack}
              className="text-primary-600 hover:underline font-medium"
            >
              Iniciar sesión
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-outline mt-6">APP-DX — BTS Integral © 2026</p>
      </div>
    </div>
  );
}
