'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '@/lib/validators';
import { useAuth } from './useAuth';
import { RegisterPatientForm } from './RegisterPatientForm';
import { getApiErrorMessage } from '@/services/api';
import Image from 'next/image';

function LabPattern() {
  return (
    <svg
      viewBox="0 0 480 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full opacity-10 pointer-events-none select-none"
      aria-hidden="true"
    >
      <circle cx="240" cy="240" r="180" stroke="white" strokeWidth="1" strokeDasharray="8 12" />
      <circle cx="240" cy="240" r="120" stroke="white" strokeWidth="0.8" strokeDasharray="4 8" />
      <circle cx="240" cy="240" r="60"  stroke="white" strokeWidth="0.6" />
      <circle cx="240" cy="60"  r="8" fill="white" fillOpacity="0.6" />
      <circle cx="420" cy="240" r="8" fill="white" fillOpacity="0.6" />
      <circle cx="240" cy="420" r="8" fill="white" fillOpacity="0.6" />
      <circle cx="60"  cy="240" r="8" fill="white" fillOpacity="0.6" />
      <circle cx="357" cy="123" r="5" fill="white" fillOpacity="0.4" />
      <circle cx="357" cy="357" r="5" fill="white" fillOpacity="0.4" />
      <circle cx="123" cy="357" r="5" fill="white" fillOpacity="0.4" />
      <circle cx="123" cy="123" r="5" fill="white" fillOpacity="0.4" />
    </svg>
  );
}

export function LoginForm() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await login(values);
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  if (showRegister) {
    return (
      <RegisterPatientForm
        onSuccess={() => setShowRegister(false)}
        onBack={() => setShowRegister(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f8fafa' }}>
      <div
        className="hidden lg:flex w-[45%] flex-col items-center justify-center p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg, #1B7A6B 0%, #006053 55%, #004540 100%)' }}
      >
        <LabPattern />
        <div className="relative z-10 flex flex-col items-center text-center gap-8 max-w-sm">
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <Image src="/logo.png" alt="BTS Integral" width={160} height={64} priority className="object-contain" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: '#ffffff', fontFamily: 'Manrope, sans-serif' }}>
              APP-DX
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Sistema de Gestion de Diagnostico Clinico — plataforma integral para resultados, ordenes y pacientes.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {['Resultados', 'Ordenes Medicas', 'Pacientes', 'Consentimientos'].map((f) => (
              <span
                key={f}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#ffffff' }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
        <p className="absolute bottom-6 text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}>
          BTS Integral (c) 2026 - Sistema de Diagnostico
        </p>
      </div>

      <div className="w-full lg:w-[55%] flex flex-col items-center justify-center p-8 sm:p-12" style={{ background: '#ffffff' }}>
        <div className="flex justify-center mb-8 lg:hidden">
          <Image src="/logo.png" alt="BTS Integral" width={140} height={56} priority className="object-contain" />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: '#191c1d', fontFamily: 'Manrope, sans-serif' }}>
              Bienvenido
            </h1>
            <p className="text-sm" style={{ color: '#6e7976', fontFamily: 'Inter, sans-serif' }}>
              Ingresa tus credenciales para acceder al portal
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold" style={{ color: '#3e4946', fontFamily: 'Inter, sans-serif' }}>
                Correo electronico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="usuario@ejemplo.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-150"
                style={{ background: '#f2f4f4', border: errors.email ? '1.5px solid #ba1a1a' : '1.5px solid #bec9c5', color: '#191c1d', fontFamily: 'Inter, sans-serif' }}
                onFocus={(e) => {
                  e.currentTarget.style.border = errors.email ? '1.5px solid #ba1a1a' : '1.5px solid #1B7A6B';
                  e.currentTarget.style.boxShadow = errors.email ? '0 0 0 3px rgba(186,26,26,0.12)' : '0 0 0 3px rgba(27,122,107,0.12)';
                }}
                {...(() => {
                  const { onBlur: rhfBlur, ...rest } = register('email');
                  return {
                    ...rest,
                    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                      e.currentTarget.style.border = errors.email ? '1.5px solid #ba1a1a' : '1.5px solid #bec9c5';
                      e.currentTarget.style.boxShadow = 'none';
                      void rhfBlur(e);
                    },
                  };
                })()}
              />
              {errors.email && <p className="text-xs" role="alert" style={{ color: '#ba1a1a' }}>{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-semibold" style={{ color: '#3e4946', fontFamily: 'Inter, sans-serif' }}>
                Contrasena
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="..."
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all duration-150"
                  style={{ background: '#f2f4f4', border: errors.password ? '1.5px solid #ba1a1a' : '1.5px solid #bec9c5', color: '#191c1d', fontFamily: 'Inter, sans-serif' }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = errors.password ? '1.5px solid #ba1a1a' : '1.5px solid #1B7A6B';
                    e.currentTarget.style.boxShadow = errors.password ? '0 0 0 3px rgba(186,26,26,0.12)' : '0 0 0 3px rgba(27,122,107,0.12)';
                  }}
                  {...(() => {
                    const { onBlur: rhfBlur, ...rest } = register('password');
                    return {
                      ...rest,
                      onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                        e.currentTarget.style.border = errors.password ? '1.5px solid #ba1a1a' : '1.5px solid #bec9c5';
                        e.currentTarget.style.boxShadow = 'none';
                        void rhfBlur(e);
                      },
                    };
                  })()}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#6e7976' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#1B7A6B')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#6e7976')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs" role="alert" style={{ color: '#ba1a1a' }}>{errors.password.message}</p>}
            </div>

            {serverError && (
              <div role="alert" className="text-sm rounded-xl px-4 py-3" style={{ background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.2)', color: '#ba1a1a' }}>
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-sm transition-all duration-200"
              style={{ background: isSubmitting ? '#6e7976' : '#1B7A6B', color: '#ffffff', boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(27,122,107,0.3)', fontFamily: 'Manrope, sans-serif' }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.background = '#006053'; }}
              onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.background = '#1B7A6B'; }}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Iniciando sesion...' : 'Ingresar al portal'}
            </button>
          </form>

          <p className="text-sm mt-8 text-center" style={{ color: '#6e7976', fontFamily: 'Inter, sans-serif' }}>
            ¿Eres paciente?{' '}
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="font-semibold transition-colors"
              style={{ color: '#1B7A6B' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#006053')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1B7A6B')}
            >
              Crear cuenta
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}