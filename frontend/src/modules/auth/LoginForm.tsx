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

// ─── Decorative network-nodes SVG (evokes the BTS Integral logo) ─────────────
function NetworkNodes() {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full opacity-20 pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Connection lines */}
      <line x1="200" y1="200" x2="100" y2="100" stroke="#2BFFF8" strokeWidth="1" />
      <line x1="200" y1="200" x2="300" y2="100" stroke="#2BFFF8" strokeWidth="1" />
      <line x1="200" y1="200" x2="320" y2="250" stroke="#B0FCCE" strokeWidth="1" />
      <line x1="200" y1="200" x2="280" y2="320" stroke="#B0FCCE" strokeWidth="1" />
      <line x1="200" y1="200" x2="120" y2="310" stroke="#2BFFF8" strokeWidth="1" />
      <line x1="200" y1="200" x2="80"  y2="260" stroke="#B0FCCE" strokeWidth="1" />
      <line x1="100" y1="100" x2="300" y2="100" stroke="#007342" strokeWidth="0.8" />
      <line x1="100" y1="100" x2="80"  y2="260" stroke="#007342" strokeWidth="0.8" />
      <line x1="300" y1="100" x2="320" y2="250" stroke="#007342" strokeWidth="0.8" />
      <line x1="320" y1="250" x2="280" y2="320" stroke="#2BFFF8" strokeWidth="0.8" />
      <line x1="280" y1="320" x2="120" y2="310" stroke="#2BFFF8" strokeWidth="0.8" />
      <line x1="120" y1="310" x2="80"  y2="260" stroke="#007342" strokeWidth="0.8" />
      {/* Outer accent nodes */}
      <line x1="300" y1="100" x2="370" y2="60"  stroke="#B0FCCE" strokeWidth="0.6" strokeDasharray="4 4" />
      <line x1="80"  y1="260" x2="30"  y2="300" stroke="#B0FCCE" strokeWidth="0.6" strokeDasharray="4 4" />
      <line x1="280" y1="320" x2="310" y2="385" stroke="#2BFFF8" strokeWidth="0.6" strokeDasharray="4 4" />
      {/* Central glow ring */}
      <circle cx="200" cy="200" r="60" stroke="#2BFFF8" strokeWidth="0.5" strokeDasharray="6 6" />
      <circle cx="200" cy="200" r="110" stroke="#007342" strokeWidth="0.4" strokeDasharray="3 8" />
      {/* Nodes */}
      <circle cx="200" cy="200" r="10" fill="#F5C518" />
      <circle cx="100" cy="100" r="6"  fill="#2BFFF8" />
      <circle cx="300" cy="100" r="6"  fill="#2BFFF8" />
      <circle cx="320" cy="250" r="5"  fill="#B0FCCE" />
      <circle cx="280" cy="320" r="5"  fill="#B0FCCE" />
      <circle cx="120" cy="310" r="5"  fill="#2BFFF8" />
      <circle cx="80"  cy="260" r="5"  fill="#B0FCCE" />
      <circle cx="370" cy="60"  r="4"  fill="#007342" />
      <circle cx="30"  cy="300" r="4"  fill="#007342" />
      <circle cx="310" cy="385" r="4"  fill="#007342" />
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
    <div
      className="min-h-screen flex"
      style={{ background: '#060B0A' }}
    >
      {/* ── LEFT PANEL — branding ──────────────────────────────────────────── */}
      <div
        className="hidden lg:flex w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{
          background:
            'linear-gradient(145deg, #003d22 0%, #007342 40%, #004d2e 70%, #060B0A 100%)',
        }}
      >
        {/* Glow bloom */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: 420,
            height: 420,
            background:
              'radial-gradient(circle, rgba(43,255,248,0.12) 0%, rgba(0,115,66,0.06) 50%, transparent 70%)',
          }}
        />

        {/* Network nodes decorative SVG */}
        <NetworkNodes />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center gap-6">
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(6,11,10,0.4)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(43,255,248,0.2)',
            }}
          >
            <Image
              src="/logo.png"
              alt="BTS Integral"
              width={180}
              height={72}
              priority
              className="object-contain"
            />
          </div>

          <div className="space-y-2 max-w-sm">
            <h2 className="text-2xl font-bold" style={{ color: '#B0FCCE' }}>
              APP-DX
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(176,252,206,0.7)' }}>
              Sistema de Gestión de Diagnóstico de Laboratorios — Plataforma
              clínica integral para resultados, órdenes y pacientes.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {['Resultados', 'Órdenes', 'Pacientes', 'Notificaciones'].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: 'rgba(43,255,248,0.1)',
                  border: '1px solid rgba(43,255,248,0.25)',
                  color: '#2BFFF8',
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom caption */}
        <p
          className="absolute bottom-6 text-xs"
          style={{ color: 'rgba(176,252,206,0.4)' }}
        >
          BTS Integral © 2026
        </p>
      </div>

      {/* ── RIGHT PANEL — form ────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile-only logo */}
        <div className="flex justify-center mb-8 lg:hidden">
          <Image
            src="/logo.png"
            alt="BTS Integral"
            width={150}
            height={60}
            priority
            className="object-contain"
          />
        </div>

        {/* Card */}
        <div
          className="w-full max-w-md rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(176,252,206,0.12)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(43,255,248,0.05)',
          }}
        >
          <h1 className="text-2xl font-bold text-white mb-1">Iniciar sesión</h1>
          <p className="text-sm mb-7" style={{ color: 'rgba(176,252,206,0.55)' }}>
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#B0FCCE' }}
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="usuario@ejemplo.com"
                className="w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-gray-500 outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: errors.email
                    ? '1px solid rgba(248,113,113,0.7)'
                    : '1px solid rgba(176,252,206,0.18)',
                }}
                onFocus={(e) => {
                  if (!errors.email)
                    e.currentTarget.style.border = '1px solid #2BFFF8';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(43,255,248,0.1)';
                }}
                {...(() => {
                  const { onBlur: rhfBlur, ...rest } = register('email');
                  return {
                    ...rest,
                    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                      e.currentTarget.style.border = errors.email
                        ? '1px solid rgba(248,113,113,0.7)'
                        : '1px solid rgba(176,252,206,0.18)';
                      e.currentTarget.style.boxShadow = 'none';
                      void rhfBlur(e);
                    },
                  };
                })()}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: '#B0FCCE' }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-11 rounded-lg text-sm text-white placeholder-gray-500 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: errors.password
                      ? '1px solid rgba(248,113,113,0.7)'
                      : '1px solid rgba(176,252,206,0.18)',
                  }}
                  onFocus={(e) => {
                    if (!errors.password)
                      e.currentTarget.style.border = '1px solid #2BFFF8';
                    e.currentTarget.style.boxShadow =
                      '0 0 0 3px rgba(43,255,248,0.1)';
                  }}
                  {...(() => {
                    const { onBlur: rhfBlur, ...rest } = register('password');
                    return {
                      ...rest,
                      onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
                        e.currentTarget.style.border = errors.password
                          ? '1px solid rgba(248,113,113,0.7)'
                          : '1px solid rgba(176,252,206,0.18)';
                        e.currentTarget.style.boxShadow = 'none';
                        void rhfBlur(e);
                      },
                    };
                  })()}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(176,252,206,0.45)' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = '#2BFFF8')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = 'rgba(176,252,206,0.45)')
                  }
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div
                role="alert"
                className="text-sm rounded-lg px-4 py-3"
                style={{
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.35)',
                  color: '#fca5a5',
                }}
              >
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: isSubmitting
                  ? 'rgba(0,115,66,0.4)'
                  : 'linear-gradient(135deg, #007342 0%, #2BFFF8 100%)',
                color: isSubmitting ? 'rgba(176,252,206,0.5)' : '#060B0A',
                boxShadow: isSubmitting
                  ? 'none'
                  : '0 0 20px rgba(43,255,248,0.3)',
              }}
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isSubmitting ? 'Iniciando sesión...' : 'Ingresar al sistema'}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <p className="text-xs mt-6" style={{ color: 'rgba(176,252,206,0.3)' }}>
          ¿Eres paciente?{' '}
          <button
            type="button"
            onClick={() => setShowRegister(true)}
            className="font-medium transition-colors"
            style={{ color: '#2BFFF8' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#B0FCCE')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#2BFFF8')}
          >
            Crear cuenta
          </button>
        </p>
      </div>
    </div>
  );
}
