'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2, ArrowRight, AtSign, KeyRound, Eye, EyeOff,
  Stethoscope, Users, ShieldCheck,
} from 'lucide-react';
import { loginSchema, type LoginFormValues } from '@/lib/validators';
import { useAuth } from './useAuth';
import { RegisterPatientForm } from './RegisterPatientForm';
import { getApiErrorMessage } from '@/services/api';

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
    <div className="min-h-screen flex items-stretch bg-surface overflow-hidden">
      {/* ── LEFT PANEL ── */}
      <section
        className="hidden md:flex flex-col justify-between w-1/2 lg:w-3/5 p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(150deg, #004d42 0%, #006053 35%, #1B7A6B 70%, #0d5c50 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-[520px] h-[520px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #b0ffed 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-[360px] h-[360px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #b0ffed 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        {/* Top: Logo + brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border border-white/30">
            <Image src="/logo.png" alt="BTS Integral" width={32} height={32} className="object-contain" />
          </div>
          <div>
            <p className="text-white font-extrabold text-lg leading-tight tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>BTS Integral</p>
            <p className="text-white/60 text-xs font-medium tracking-widest uppercase">APP-DX</p>
          </div>
        </div>

        {/* Center: Headline */}
        <div className="relative z-10 space-y-6 max-w-md">
          <h1 className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
            The Clinical<br />Sanctuary.
          </h1>
          <p className="text-white/80 text-lg leading-relaxed font-medium">
            Elevando la precisión diagnóstica a través de un ecosistema digital diseñado para la serenidad y la eficiencia médica.
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-8 pt-4">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>+500</p>
              <p className="text-white/60 text-xs font-semibold tracking-wide uppercase">Especialistas</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>99.9%</p>
              <p className="text-white/60 text-xs font-semibold tracking-wide uppercase">Disponibilidad</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>HIPAA</p>
              <p className="text-white/60 text-xs font-semibold tracking-wide uppercase">Compliant</p>
            </div>
          </div>
        </div>

        {/* Bottom: Trust badges */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-3">
            <ShieldCheck size={18} className="text-white/80" />
            <span className="text-white/90 text-sm font-semibold">Grado Médico</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-3">
            <Users size={18} className="text-white/80" />
            <span className="text-white/90 text-sm font-semibold">+500 especialistas</span>
          </div>
        </div>
      </section>

      {/* ── RIGHT PANEL ── */}
      <section className="flex-1 flex flex-col justify-center items-center px-6 py-12 sm:px-12 lg:px-16 bg-white">
        {/* Mobile brand */}
        <div className="flex md:hidden items-center gap-3 mb-12 self-start">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #006053, #1B7A6B)' }}>
            <Image src="/logo.png" alt="BTS Integral" width={24} height={24} className="object-contain" />
          </div>
          <div>
            <p className="font-extrabold text-on-surface leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>BTS Integral</p>
            <p className="text-xs text-outline font-semibold tracking-widest uppercase">APP-DX</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-10 space-y-2">
            <h2 className="text-3xl font-extrabold text-on-surface tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Bienvenido
            </h2>
            <p className="text-on-surface-variant font-medium text-sm">
              Ingresa tus credenciales para acceder al portal clínico.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface-variant" htmlFor="email">
                Correo Electrónico
              </label>
              <div className="relative">
                <AtSign
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="doctor@bts-integral.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-transparent transition-all text-sm font-medium"
                  aria-invalid={Boolean(errors.email)}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-error" role="alert">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface-variant" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <KeyRound
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  className="w-full pl-11 pr-12 py-3.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-transparent transition-all text-sm font-medium"
                  aria-invalid={Boolean(errors.password)}
                  {...register('password')}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-error" role="alert">{errors.password.message}</p>
              )}
            </div>

            {/* Remember */}
            <div className="flex items-center gap-2.5">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary/20"
              />
              <label htmlFor="remember" className="text-sm text-on-surface-variant select-none">
                Recordar sesión en este equipo
              </label>
            </div>

            {/* Server error */}
            {serverError && (
              <div role="alert" className="text-sm rounded-xl px-4 py-3 bg-error-container text-on-error-container border border-error/20">
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 group transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #006053 0%, #1B7A6B 100%)',
                color: '#ffffff',
                fontFamily: 'Manrope, sans-serif',
                boxShadow: '0 4px 24px rgba(0,96,83,0.35)',
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

          {/* Register link */}
          <div className="mt-8 pt-6 border-t border-outline-variant/30 text-center">
            <p className="text-sm text-on-surface-variant">
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

          {/* Footer */}
          <p className="mt-10 text-center text-[10px] uppercase tracking-widest text-outline font-bold">
            Seguridad de Grado Médico • HIPAA Compliant
          </p>
        </div>
      </section>
    </div>
  );
}