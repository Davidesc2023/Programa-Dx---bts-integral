'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Loader2, ArrowRight, AtSign, KeyRound, Eye, EyeOff,
  ShieldCheck, Users,
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
    <div className="min-h-screen flex bg-surface overflow-hidden">

      {/* ── LEFT PANEL (desktop) ── */}
      <section
        className="hidden md:flex flex-col justify-between w-1/2 lg:w-3/5 p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(150deg, #003d34 0%, #004d42 25%, #006053 55%, #1B7A6B 80%, #0d5c50 100%)',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{
            background: 'radial-gradient(circle, #b0ffed 0%, transparent 70%)',
            transform: 'translate(30%, -30%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.07]"
          style={{
            background: 'radial-gradient(circle, #b0ffed 0%, transparent 70%)',
            transform: 'translate(-30%, 30%)',
          }}
        />
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Top: Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
            <Image src="/logo.png" alt="BTS Integral" width={28} height={28} className="object-contain" />
          </div>
          <div>
            <p className="text-white font-black text-base leading-tight tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              APP-DX
            </p>
            <p className="text-white/55 text-[11px] font-semibold tracking-widest uppercase">
              BTS Integral
            </p>
          </div>
        </div>

        {/* Center: Headline */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <h1
            className="text-[3.25rem] font-black text-white leading-[1.05] tracking-tight"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            The Clinical<br />Sanctuary.
          </h1>
          <p className="text-white/75 text-lg leading-relaxed font-medium max-w-sm">
            Elevando la precisión diagnóstica a través de un ecosistema digital diseñado para la serenidad y la eficiencia médica.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-8 pt-2">
            {[
              { value: '+500', label: 'Especialistas' },
              { value: '99.9%', label: 'Disponibilidad' },
              { value: 'HIPAA', label: 'Compliant' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-8">
                {i > 0 && <div className="w-px h-10 bg-white/20" />}
                <div className="text-center">
                  <p className="text-2xl font-black text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {s.value}
                  </p>
                  <p className="text-white/55 text-[10px] font-bold tracking-widest uppercase mt-0.5">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Trust badges */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-2.5">
            <ShieldCheck size={16} className="text-white/80" />
            <span className="text-white/85 text-sm font-semibold">Grado Médico</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-2.5">
            <Users size={16} className="text-white/80" />
            <span className="text-white/85 text-sm font-semibold">+500 especialistas</span>
          </div>
        </div>
      </section>

      {/* ── RIGHT PANEL (form) ── */}
      <section className="flex-1 flex flex-col bg-white">

        {/* Mobile header */}
        <div className="flex md:hidden flex-col items-center pt-14 pb-8 px-6 bg-[#f4f7f6]">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #006053, #1B7A6B)' }}
          >
            <Image src="/logo.png" alt="APP-DX" width={36} height={36} className="object-contain" />
          </div>
          <h1
            className="text-3xl font-black text-on-surface tracking-tight"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            APP-DX
          </h1>
          <p className="text-sm text-outline font-medium mt-1">BTS Integral</p>
        </div>

        {/* Form area */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 sm:px-12 lg:px-16 bg-white">
          <div className="w-full max-w-sm">

            {/* Desktop heading */}
            <div className="mb-9 space-y-1.5">
              <h2
                className="text-3xl font-black text-on-surface tracking-tight"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Bienvenido
              </h2>
              <p className="text-on-surface-variant font-medium text-sm">
                Ingresa tus credenciales para acceder al portal clínico.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-on-surface-variant" htmlFor="email">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <AtSign
                    size={15}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="doctor@bts-integral.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#f2f4f4] rounded-2xl text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-medium"
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
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-on-surface-variant" htmlFor="password">
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-error" role="alert">{errors.password.message}</p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2.5">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-4 h-4 rounded border-outline-variant accent-primary"
                />
                <label htmlFor="remember" className="text-sm text-on-surface-variant select-none">
                  Recordar sesión en este equipo
                </label>
              </div>

              {/* Server error */}
              {serverError && (
                <div role="alert" className="text-sm rounded-xl px-4 py-3 bg-error-container text-on-error-container">
                  {serverError}
                </div>
              )}

              {/* Submit */}
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

            {/* Register link */}
            <p className="mt-7 text-center text-sm text-on-surface-variant">
              <span className="hidden md:inline">¿Nuevo en la plataforma? </span>
              <span className="md:hidden">¿No tienes una cuenta? </span>
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="font-bold hover:underline"
                style={{ color: '#006053' }}
              >
                <span className="hidden md:inline">Solicitar acceso</span>
                <span className="md:hidden">Crear cuenta</span>
              </button>
            </p>
          </div>
        </div>

        {/* Mobile footer — Clinical Sanctuary */}
        <div className="flex md:hidden flex-col items-center gap-3 py-8 bg-[#f4f7f6]">
          <div className="w-16 h-px bg-outline/20" />
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-surface-container-low flex items-center justify-center">
              <ShieldCheck size={14} className="text-outline/50" />
            </div>
            <div className="w-7 h-7 rounded-full bg-surface-container-low flex items-center justify-center">
              <ShieldCheck size={14} className="text-outline/50" />
            </div>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-outline/40">
            Clinical Sanctuary Design System
          </p>
        </div>

        {/* Desktop footer */}
        <p className="hidden md:block text-center text-[10px] uppercase tracking-widest text-outline/40 font-bold py-5 border-t border-outline/10">
          Seguridad de Grado Médico • HIPAA Compliant
        </p>
      </section>
    </div>
  );
}
