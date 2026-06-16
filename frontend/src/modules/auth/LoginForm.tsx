'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '@/lib/validators';
import { useAuth } from './useAuth';
import { RegisterPatientForm } from './RegisterPatientForm';
import { getApiErrorMessage } from '@/services/api';

// ─── Constantes de marca ─────────────────────────────────────────────────────

const PROGRAMS = [
  { label: 'Wilson',   color: '#1B7A6B' },
  { label: 'DAAT',     color: '#2563eb' },
  { label: 'Duchenne', color: '#7c3aed' },
];

const PAISES = ['CO', 'EC', 'PA', 'CL', 'CR', 'SV', 'DO', 'GT'];

// ─── Componente principal ────────────────────────────────────────────────────

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
          PANEL IZQUIERDO — brand hero (md+)
      ════════════════════════════════════════════════════════════ */}
      <aside
        aria-hidden="true"
        className="hidden md:flex flex-col w-[46%] lg:w-[52%] xl:w-[55%] relative overflow-hidden"
        style={{
          background:
            'linear-gradient(155deg, #001208 0%, #001a12 18%, #002e20 42%, #00432f 62%, #1B7A6B 100%)',
        }}
      >
        {/* ── Decoración: anillos abstractos (ADN) ── */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 700, height: 700,
            top: -200, right: -200,
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 520, height: 520,
            top: -140, right: -140,
            border: '1px solid rgba(255,255,255,0.055)',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 340, height: 340,
            top: -80, right: -80,
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 560, height: 560,
            bottom: -200, left: -200,
            border: '1px solid rgba(255,255,255,0.035)',
          }}
        />
        {/* Glow verde tenue */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 480, height: 480,
            bottom: -80, right: -80,
            background: 'radial-gradient(circle, rgba(27,122,107,0.18) 0%, transparent 70%)',
          }}
        />
        {/* Textura cuadrícula sutil */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.028,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), ' +
              'linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
          }}
        />

        {/* ── Contenido centrado ── */}
        <div className="relative z-10 flex flex-col justify-between flex-1 px-10 xl:px-14 py-12">

          {/* Bloque hero: logo + nombre */}
          <div className="flex flex-col items-center text-center gap-8 mt-4">

            {/* Logo con glow + glassmorphism */}
            <div className="relative">
              {/* Glow exterior */}
              <div
                className="absolute inset-0 rounded-[40px] pointer-events-none"
                style={{
                  background: 'rgba(27,122,107,0.30)',
                  filter: 'blur(28px)',
                  transform: 'scale(1.2)',
                }}
              />
              {/* Contenedor del logo */}
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 44,
                  background:
                    'linear-gradient(140deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1.5px solid rgba(255,255,255,0.18)',
                  boxShadow:
                    '0 32px 64px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.18)',
                }}
              >
                <Image
                  src="/logo.png"
                  alt="BTS Integral"
                  width={128}
                  height={128}
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            {/* Nombre + subtítulo */}
            <div className="space-y-2">
              <h1
                className="text-white font-black leading-none tracking-tight"
                style={{ fontSize: '3rem', fontFamily: 'Manrope, sans-serif' }}
              >
                BTS INTEGRAL
              </h1>
              <p
                className="text-[11px] font-bold tracking-[0.3em] uppercase"
                style={{ color: 'rgba(255,255,255,0.40)' }}
              >
                Programa DX · Diagnóstico Genético
              </p>
            </div>

            {/* Separador */}
            <div
              className="w-12 h-[1px]"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            />

            {/* Descripción */}
            <p
              className="text-[15px] leading-relaxed font-medium max-w-[260px]"
              style={{ color: 'rgba(255,255,255,0.58)' }}
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
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: p.color }}
                  />
                  <span
                    className="text-xs font-bold"
                    style={{ color: 'rgba(255,255,255,0.70)' }}
                  >
                    {p.label}
                  </span>
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
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.35)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Badge inferior de confianza */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.10)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <ShieldCheck size={14} style={{ color: 'rgba(255,255,255,0.55)' }} />
              <span
                className="text-xs font-semibold"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                Grado Médico
              </span>
            </div>
            <div
              className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.10)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span
                className="text-xs font-bold font-mono"
                style={{ color: 'rgba(255,255,255,0.50)' }}
              >
                HIPAA
              </span>
              <span
                className="text-xs font-semibold"
                style={{ color: 'rgba(255,255,255,0.55)' }}
              >
                Compliant
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════
          PANEL DERECHO — formulario
      ════════════════════════════════════════════════════════════ */}
      <main
        className="flex-1 flex flex-col"
        style={{ background: '#f4f6f5' }}
      >
        {/* ── Header móvil (solo <md) ── */}
        <div
          className="flex md:hidden flex-col items-center pt-14 pb-10 px-6"
          style={{
            background:
              'linear-gradient(160deg, #001208 0%, #002e20 50%, #1B7A6B 100%)',
          }}
        >
          <div
            className="flex items-center justify-center mb-5"
            style={{
              width: 96, height: 96,
              borderRadius: 28,
              background: 'rgba(255,255,255,0.13)',
              border: '1.5px solid rgba(255,255,255,0.18)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.22)',
            }}
          >
            <Image
              src="/logo.png"
              alt="BTS Integral"
              width={60}
              height={60}
              className="object-contain"
              priority
            />
          </div>
          <h1
            className="text-white font-black text-2xl tracking-tight"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            BTS INTEGRAL
          </h1>
          <p
            className="text-[11px] font-bold tracking-[0.25em] uppercase mt-2"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Programa DX
          </p>
        </div>

        {/* ── Área del formulario centrada ── */}
        <div className="flex-1 flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">

            {/* Tarjeta del formulario */}
            <div
              className="rounded-3xl px-8 py-10 sm:px-10"
              style={{
                background: '#ffffff',
                boxShadow:
                  '0 4px 6px rgba(0,0,0,0.03), 0 20px 60px rgba(0,0,0,0.08)',
              }}
            >
              {/* Encabezado */}
              <div className="mb-9">
                <h2
                  className="text-[1.75rem] font-black tracking-tight"
                  style={{ color: '#101c19', fontFamily: 'Manrope, sans-serif' }}
                >
                  Bienvenido
                </h2>
                <p
                  className="text-sm mt-1.5 font-medium"
                  style={{ color: '#6e7976', lineHeight: 1.6 }}
                >
                  Ingresa tus credenciales para acceder al portal clínico.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

                {/* ── Email ── */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold"
                    style={{ color: '#2e3d3a' }}
                  >
                    Correo electrónico
                    <span className="ml-1" style={{ color: '#ba1a1a' }} aria-hidden="true">*</span>
                  </label>
                  <div
                    className={`flex rounded-xl transition-all ${
                      errors.email
                        ? 'border border-[#ba1a1a]'
                        : 'border border-transparent bg-[#f2f5f4] focus-within:border-[#1B7A6B] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(27,122,107,0.12)]'
                    }`}
                    style={errors.email ? { background: 'rgba(186,26,26,0.03)' } : undefined}
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
                      style={{ height: 52, color: '#101c19' }}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p
                      id="email-error"
                      role="alert"
                      className="text-xs font-medium"
                      style={{ color: '#ba1a1a' }}
                    >
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* ── Contraseña ── */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-semibold"
                      style={{ color: '#2e3d3a' }}
                    >
                      Contraseña
                      <span className="ml-1" style={{ color: '#ba1a1a' }} aria-hidden="true">*</span>
                    </label>
                    <button
                      type="button"
                      className="text-xs font-semibold hover:underline underline-offset-2 transition-colors"
                      style={{ color: '#006053' }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div
                    className={`relative flex rounded-xl transition-all ${
                      errors.password
                        ? 'border border-[#ba1a1a]'
                        : 'border border-transparent bg-[#f2f5f4] focus-within:border-[#1B7A6B] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(27,122,107,0.12)]'
                    }`}
                    style={errors.password ? { background: 'rgba(186,26,26,0.03)' } : undefined}
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
                      style={{ height: 52, color: '#101c19' }}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-0 top-0 h-full flex items-center justify-center rounded-r-xl transition-colors hover:text-[#6e7976]"
                      style={{ width: 52, color: '#9eaaa7' }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p
                      id="password-error"
                      role="alert"
                      className="text-xs font-medium"
                      style={{ color: '#ba1a1a' }}
                    >
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* ── Error del servidor ── */}
                {serverError && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="rounded-xl px-4 py-3 text-sm font-medium"
                    style={{
                      background: 'rgba(186,26,26,0.07)',
                      border: '1px solid rgba(186,26,26,0.18)',
                      color: '#9b1515',
                    }}
                  >
                    {serverError}
                  </div>
                )}

                {/* ── Botón de entrar ── */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  aria-label="Iniciar sesión"
                  className="group w-full flex items-center justify-center gap-2.5 rounded-2xl font-bold text-[15px] transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    height: 56,
                    background: isSubmitting
                      ? '#006053'
                      : 'linear-gradient(135deg, #005c4e 0%, #1B7A6B 55%, #22907e 100%)',
                    color: '#ffffff',
                    fontFamily: 'Manrope, sans-serif',
                    boxShadow: isSubmitting
                      ? 'none'
                      : '0 4px 24px rgba(27,122,107,0.35), 0 1px 3px rgba(0,0,0,0.15)',
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
                      <ArrowRight
                        size={18}
                        className="group-hover:translate-x-1 transition-transform duration-200"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* ── Enlace de registro ── */}
              <p
                className="mt-7 text-center text-sm"
                style={{ color: '#6e7976' }}
              >
                ¿Nuevo en la plataforma?{' '}
                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  className="font-bold hover:underline underline-offset-2 transition-colors"
                  style={{ color: '#006053' }}
                >
                  Solicitar acceso
                </button>
              </p>
            </div>

            {/* Pie de página */}
            <p
              className="text-center text-[10px] font-bold uppercase tracking-widest mt-7"
              style={{ color: '#b0bab7' }}
            >
              Seguridad de Grado Médico · HIPAA Compliant
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
