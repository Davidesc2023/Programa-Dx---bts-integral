'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowRight, Eye, EyeOff, ShieldCheck, Dna } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '@/lib/validators';
import { useAuth } from './useAuth';
import { RegisterPatientForm } from './RegisterPatientForm';
import { getApiErrorMessage } from '@/services/api';

// ─── Brand colors (logo palette) ─────────────────────────────────────────────
const C = {
  teal:    '#316358',   // teal oscuro — color base del logo
  tealDk:  '#224843',   // teal más oscuro para hover/sombras
  yellow:  '#f3e159',   // amarillo acento del logo
  blue:    '#3977e9',   // azul acento del logo
  white:   '#fafcfd',   // blanco/off-white
  dark:    '#0d1a17',   // texto oscuro
  muted:   'rgba(250,252,253,0.55)',
  border:  'rgba(250,252,253,0.12)',
  err:     '#ff6b6b',
};

const PROGRAMS = [
  { label: 'Wilson',   color: C.yellow },
  { label: 'DAAT',     color: C.blue },
  { label: 'Duchenne', color: '#c084fc' },
];

const PAISES = ['CO', 'EC', 'PA', 'CL', 'CR', 'SV', 'DO', 'GT'];

// ─── Componente principal ─────────────────────────────────────────────────────

export function LoginForm() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError]   = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

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
    <div className="min-h-screen md:min-h-dvh flex flex-col md:flex-row overflow-hidden">

      {/* ═══════════════════════════════════════════════════════════
          PANEL IZQUIERDO — brand hero en teal oscuro
      ════════════════════════════════════════════════════════════ */}
      <aside
        aria-hidden="true"
        className="hidden md:flex flex-col w-[46%] lg:w-[50%] xl:w-[52%] relative overflow-hidden"
        style={{ background: C.teal }}
      >
        {/* ── Patrón de puntos sutil ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(250,252,253,0.07) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* ── Gradiente superior (brillo) ── */}
        <div
          className="absolute pointer-events-none"
          style={{
            inset: 0,
            background: `radial-gradient(ellipse 70% 50% at 50% -10%, rgba(243,225,89,0.18) 0%, transparent 65%)`,
          }}
        />

        {/* ── Anillos decorativos (ADN) bottom-right ── */}
        <div className="absolute rounded-full pointer-events-none"
          style={{ width: 560, height: 560, bottom: -200, right: -200,
            border: '1px solid rgba(250,252,253,0.08)' }} />
        <div className="absolute rounded-full pointer-events-none"
          style={{ width: 380, height: 380, bottom: -140, right: -140,
            border: '1px solid rgba(250,252,253,0.10)' }} />
        <div className="absolute rounded-full pointer-events-none"
          style={{ width: 220, height: 220, bottom: -80, right: -80,
            border: '1px solid rgba(250,252,253,0.14)' }} />

        {/* ── Contenido centrado ── */}
        <div className="relative z-10 flex flex-col justify-between flex-1 px-10 xl:px-14 py-14">

          {/* Logo + nombre */}
          <div className="flex flex-col items-center text-center gap-8">

            {/* Logo sobre fondo teal — visible y contrastado */}
            <div
              className="rounded-3xl flex items-center justify-center"
              style={{
                width: 108, height: 108,
                background: 'rgba(250,252,253,0.10)',
                border: '1px solid rgba(250,252,253,0.18)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              }}
            >
              <Image
                src="/logo.png"
                alt="BTS Integral"
                width={72}
                height={72}
                className="object-contain"
                priority
              />
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <h1
                className="font-black leading-none tracking-tight"
                style={{ fontSize: '2.6rem', fontFamily: 'Manrope, sans-serif', color: C.white }}
              >
                BTS INTEGRAL
              </h1>
              <p
                className="text-[11px] font-bold tracking-[0.3em] uppercase"
                style={{ color: C.muted }}
              >
                Programa DX · Diagnóstico Genético
              </p>
            </div>

            {/* Separador amarillo */}
            <div style={{ width: 40, height: 3, background: C.yellow, borderRadius: 2 }} />

            {/* Descripción */}
            <p
              className="text-[15px] leading-relaxed font-medium max-w-[260px]"
              style={{ color: 'rgba(250,252,253,0.70)' }}
            >
              Seguimiento integral de pacientes en programas de diagnóstico genético en LATAM.
            </p>

            {/* Programas */}
            <div className="flex items-center gap-2.5 flex-wrap justify-center">
              {PROGRAMS.map((p) => (
                <div
                  key={p.label}
                  className="flex items-center gap-2 rounded-2xl px-4 py-2"
                  style={{
                    background: 'rgba(250,252,253,0.08)',
                    border: '1px solid rgba(250,252,253,0.14)',
                  }}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="text-xs font-bold" style={{ color: C.white }}>{p.label}</span>
                </div>
              ))}
            </div>

            {/* Países */}
            <div className="flex flex-wrap justify-center gap-1.5">
              {PAISES.map((c) => (
                <span
                  key={c}
                  className="text-[10px] font-bold tracking-wider rounded-lg px-2.5 py-1"
                  style={{
                    background: 'rgba(250,252,253,0.07)',
                    color: 'rgba(250,252,253,0.50)',
                    border: '1px solid rgba(250,252,253,0.10)',
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Badge inferior */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
              style={{ background: 'rgba(250,252,253,0.08)', border: '1px solid rgba(250,252,253,0.14)' }}
            >
              <ShieldCheck size={14} style={{ color: C.yellow }} />
              <span className="text-xs font-semibold" style={{ color: C.white }}>Grado Médico</span>
            </div>
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
              style={{ background: 'rgba(250,252,253,0.08)', border: '1px solid rgba(250,252,253,0.14)' }}
            >
              <Dna size={14} style={{ color: C.yellow }} />
              <span className="text-xs font-semibold" style={{ color: C.white }}>HIPAA Compliant</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════
          PANEL DERECHO — formulario
      ════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col" style={{ background: C.white }}>

        {/* Header móvil */}
        <div
          className="flex md:hidden flex-col items-center pt-14 pb-10 px-6"
          style={{ background: C.teal, borderBottom: '1px solid rgba(250,252,253,0.12)' }}
        >
          <div
            className="rounded-2xl flex items-center justify-center mb-4"
            style={{ width: 72, height: 72, background: 'rgba(250,252,253,0.12)' }}
          >
            <Image src="/logo.png" alt="BTS Integral" width={48} height={48} className="object-contain" priority />
          </div>
          <h1 className="font-black text-2xl tracking-tight" style={{ fontFamily: 'Manrope, sans-serif', color: C.white }}>
            BTS INTEGRAL
          </h1>
          <p className="text-[11px] font-bold tracking-[0.25em] uppercase mt-2" style={{ color: 'rgba(250,252,253,0.55)' }}>
            Programa DX
          </p>
        </div>

        {/* Área del formulario */}
        <div className="flex-1 flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">

            {/* Tarjeta del formulario */}
            <div
              className="rounded-3xl px-8 py-10 sm:px-10"
              style={{
                background: '#ffffff',
                boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 20px 60px rgba(49,99,88,0.10)',
                border: '1px solid rgba(49,99,88,0.10)',
              }}
            >
              {/* Encabezado */}
              <div className="mb-9">
                <div
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase mb-4"
                  style={{ background: `${C.teal}14`, color: C.teal }}
                >
                  <ShieldCheck size={11} />
                  Portal Clínico
                </div>
                <h2
                  className="text-[1.75rem] font-black tracking-tight"
                  style={{ color: '#0d1a17', fontFamily: 'Manrope, sans-serif' }}
                >
                  Bienvenido
                </h2>
                <p className="text-sm mt-1.5 font-medium" style={{ color: '#5c7270', lineHeight: 1.6 }}>
                  Ingresa tus credenciales para acceder al panel de gestión.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-semibold" style={{ color: '#1a2e2b' }}>
                    Correo electrónico
                    <span className="ml-1" style={{ color: C.err }} aria-hidden="true">*</span>
                  </label>
                  <div
                    className={`flex rounded-xl transition-all ${
                      errors.email
                        ? 'border border-[#ff6b6b]'
                        : 'border border-transparent bg-[#f2f6f5] focus-within:border-[#316358] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(49,99,88,0.12)]'
                    }`}
                    style={errors.email ? { background: 'rgba(255,107,107,0.04)' } : undefined}
                  >
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="usuario@bts-integral.com"
                      aria-required="true"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      className="w-full bg-transparent rounded-xl px-4 text-sm font-medium focus:outline-none"
                      style={{ height: 52, color: '#0d1a17' }}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p id="email-error" role="alert" className="text-xs font-medium" style={{ color: C.err }}>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Contraseña */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-semibold" style={{ color: '#1a2e2b' }}>
                      Contraseña
                      <span className="ml-1" style={{ color: C.err }} aria-hidden="true">*</span>
                    </label>
                    <button
                      type="button"
                      className="text-xs font-semibold hover:underline underline-offset-2 transition-colors"
                      style={{ color: C.blue }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div
                    className={`relative flex rounded-xl transition-all ${
                      errors.password
                        ? 'border border-[#ff6b6b]'
                        : 'border border-transparent bg-[#f2f6f5] focus-within:border-[#316358] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(49,99,88,0.12)]'
                    }`}
                    style={errors.password ? { background: 'rgba(255,107,107,0.04)' } : undefined}
                  >
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••••"
                      aria-required="true"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      className="w-full bg-transparent rounded-xl px-4 pr-14 text-sm font-medium focus:outline-none"
                      style={{ height: 52, color: '#0d1a17' }}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-0 top-0 h-full flex items-center justify-center rounded-r-xl transition-colors"
                      style={{ width: 52, color: '#8ea8a4' }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="password-error" role="alert" className="text-xs font-medium" style={{ color: C.err }}>
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Error del servidor */}
                {serverError && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="rounded-xl px-4 py-3 text-sm font-medium"
                    style={{
                      background: 'rgba(255,107,107,0.08)',
                      border: '1px solid rgba(255,107,107,0.25)',
                      color: '#c0392b',
                    }}
                  >
                    {serverError}
                  </div>
                )}

                {/* Botón */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-label="Iniciar sesión"
                  className="group w-full flex items-center justify-center gap-2.5 rounded-2xl font-bold text-[15px] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    height: 56,
                    background: isSubmitting
                      ? C.teal
                      : `linear-gradient(135deg, ${C.tealDk} 0%, ${C.teal} 60%, #3d7a6e 100%)`,
                    color: C.white,
                    fontFamily: 'Manrope, sans-serif',
                    boxShadow: isSubmitting
                      ? 'none'
                      : '0 4px 24px rgba(49,99,88,0.35), 0 1px 3px rgba(0,0,0,0.12)',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar al portal</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </button>
              </form>

              {/* Enlace de registro */}
              <p className="mt-7 text-center text-sm" style={{ color: '#5c7270' }}>
                ¿Nuevo en la plataforma?{' '}
                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  className="font-bold hover:underline underline-offset-2 transition-colors"
                  style={{ color: C.blue }}
                >
                  Solicitar acceso
                </button>
              </p>
            </div>

            {/* Pie */}
            <p className="text-center text-[10px] font-bold uppercase tracking-widest mt-7" style={{ color: '#8ea8a4' }}>
              Seguridad de Grado Médico · HIPAA Compliant
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
