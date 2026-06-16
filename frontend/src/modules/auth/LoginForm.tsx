'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2, ArrowRight, AtSign, KeyRound, Eye, EyeOff,
  ShieldCheck, Globe, FlaskConical,
} from 'lucide-react';
import { loginSchema, type LoginFormValues } from '@/lib/validators';
import { useAuth } from './useAuth';
import { RegisterPatientForm } from './RegisterPatientForm';
import { getApiErrorMessage } from '@/services/api';

const PROGRAMS = [
  { code: 'Wilson',    color: '#1B7A6B' },
  { code: 'DAAT',      color: '#2563eb' },
  { code: 'Duchenne',  color: '#7c3aed' },
];

const COUNTRIES = ['CO', 'EC', 'PA', 'CL', 'CR', 'SV', 'DO', 'GT'];

export function LoginForm() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError]   = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
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
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#f2f4f4' }}>

      {/* ═══════════════════════════════════════════════════════════
          LEFT PANEL — BTS INTEGRAL hero (desktop)
      ════════════════════════════════════════════════════════════ */}
      <section
        className="hidden md:flex flex-col items-center justify-between w-1/2 lg:w-3/5 py-14 px-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, #001f1a 0%, #003028 25%, #004d3d 55%, #1B7A6B 100%)',
        }}
      >
        {/* Blob decorativo superior derecho */}
        <div
          className="absolute top-0 right-0 rounded-full pointer-events-none"
          style={{
            width: 640, height: 640,
            background: 'radial-gradient(circle, rgba(176,255,237,0.12) 0%, transparent 65%)',
            transform: 'translate(35%, -35%)',
          }}
        />
        {/* Blob decorativo inferior izquierdo */}
        <div
          className="absolute bottom-0 left-0 rounded-full pointer-events-none"
          style={{
            width: 480, height: 480,
            background: 'radial-gradient(circle, rgba(176,255,237,0.08) 0%, transparent 65%)',
            transform: 'translate(-35%, 35%)',
          }}
        />
        {/* Textura de rejilla */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.035,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* ── HERO central: logo + nombre ─────────────────────── */}
        <div className="relative z-10 flex flex-col items-center text-center gap-8 w-full max-w-md">

          {/* Logo grande con glow */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-[36px] blur-2xl"
              style={{ background: 'rgba(27,122,107,0.35)', transform: 'scale(1.15)' }}
            />
            <div
              className="relative w-36 h-36 rounded-[36px] flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.13)',
                backdropFilter: 'blur(16px)',
                border: '1.5px solid rgba(255,255,255,0.22)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              <Image
                src="/logo.png"
                alt="BTS Integral"
                width={96}
                height={96}
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Nombre de marca */}
          <div className="space-y-2">
            <h1
              className="font-black text-white leading-none tracking-tight"
              style={{ fontSize: '2.75rem', fontFamily: 'Manrope, sans-serif' }}
            >
              BTS INTEGRAL
            </h1>
            <p className="text-white/50 text-[11px] font-bold tracking-[0.28em] uppercase">
              Programa DX · Diagnóstico Genético
            </p>
          </div>

          {/* Separador */}
          <div className="w-14 h-px" style={{ background: 'rgba(255,255,255,0.18)' }} />

          {/* Descripción */}
          <p className="text-white/65 text-[15px] leading-relaxed font-medium max-w-[260px]">
            Seguimiento integral de pacientes en programas de diagnóstico genético en LATAM.
          </p>

          {/* Programas */}
          <div className="flex items-center gap-3">
            {PROGRAMS.map((p) => (
              <div
                key={p.code}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                <span className="text-xs font-semibold text-white/70">{p.code}</span>
              </div>
            ))}
          </div>

          {/* Países */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {COUNTRIES.map((c) => (
              <span
                key={c}
                className="text-[10px] font-bold rounded-lg px-2 py-0.5"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* ── Badges de confianza ───────────────────────────────── */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <ShieldCheck size={15} className="text-white/65" />
            <span className="text-white/75 text-sm font-semibold">Grado Médico</span>
          </div>
          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <Globe size={15} className="text-white/65" />
            <span className="text-white/75 text-sm font-semibold">8 países LATAM</span>
          </div>
          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <FlaskConical size={15} className="text-white/65" />
            <span className="text-white/75 text-sm font-semibold">900+ casos</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          RIGHT PANEL — formulario
      ════════════════════════════════════════════════════════════ */}
      <section className="flex-1 flex flex-col bg-white">

        {/* Header móvil */}
        <div
          className="flex md:hidden flex-col items-center pt-12 pb-8 px-6"
          style={{
            background: 'linear-gradient(160deg, #001f1a 0%, #1B7A6B 100%)',
          }}
        >
          <div
            className="w-24 h-24 rounded-[28px] flex items-center justify-center mb-4"
            style={{
              background: 'rgba(255,255,255,0.14)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
            }}
          >
            <Image src="/logo.png" alt="BTS Integral" width={60} height={60} className="object-contain" priority />
          </div>
          <h1
            className="text-2xl font-black text-white tracking-tight"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            BTS INTEGRAL
          </h1>
          <p className="text-white/55 text-[11px] font-bold mt-1.5 tracking-widest uppercase">
            Programa DX
          </p>
        </div>

        {/* Área del formulario */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="w-full max-w-sm">

            {/* Encabezado del formulario */}
            <div className="mb-9 space-y-1.5">
              <h2
                className="text-3xl font-black tracking-tight"
                style={{ color: '#191c1d', fontFamily: 'Manrope, sans-serif' }}
              >
                Bienvenido
              </h2>
              <p className="text-sm font-medium" style={{ color: '#6e7976' }}>
                Ingresa tus credenciales para acceder al portal clínico.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  className="text-sm font-semibold"
                  style={{ color: '#3e4946' }}
                  htmlFor="email"
                >
                  Correo Electrónico
                </label>
                <div className="relative">
                  <AtSign
                    size={15}
                    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: '#9eaaa7' }}
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="usuario@bts-integral.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#f2f4f4] rounded-2xl text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-medium"
                    aria-invalid={Boolean(errors.email)}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-medium" style={{ color: '#ba1a1a' }} role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Contraseña */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="text-sm font-semibold"
                    style={{ color: '#3e4946' }}
                    htmlFor="password"
                  >
                    Contraseña
                  </label>
                  <button
                    type="button"
                    className="text-xs font-semibold hover:underline transition-colors"
                    style={{ color: '#006053' }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound
                    size={15}
                    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: '#9eaaa7' }}
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    className="w-full pl-11 pr-12 py-3.5 bg-[#f2f4f4] rounded-2xl text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-medium"
                    aria-invalid={Boolean(errors.password)}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#9eaaa7' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs font-medium" style={{ color: '#ba1a1a' }} role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Error de servidor */}
              {serverError && (
                <div
                  role="alert"
                  className="text-sm rounded-xl px-4 py-3 font-medium"
                  style={{
                    background: 'rgba(186,26,26,0.08)',
                    color: '#ba1a1a',
                    border: '1px solid rgba(186,26,26,0.15)',
                  }}
                >
                  {serverError}
                </div>
              )}

              {/* Botón de entrar */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 group transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, #006053 0%, #1B7A6B 100%)',
                  color: '#ffffff',
                  fontFamily: 'Manrope, sans-serif',
                  boxShadow: '0 4px 20px rgba(0,96,83,0.30)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Link de registro */}
            <p className="mt-8 text-center text-sm" style={{ color: '#6e7976' }}>
              ¿Nuevo en la plataforma?{' '}
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="font-bold hover:underline"
                style={{ color: '#006053' }}
              >
                Solicitar acceso
              </button>
            </p>
          </div>
        </div>

        {/* Footer escritorio */}
        <p
          className="hidden md:block text-center text-[10px] uppercase tracking-widest font-bold py-5 border-t"
          style={{ color: '#bec9c5', borderColor: '#f2f4f4' }}
        >
          Seguridad de Grado Médico · HIPAA Compliant
        </p>
      </section>
    </div>
  );
}
