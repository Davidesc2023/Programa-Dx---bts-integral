'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowRight } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '@/lib/validators';
import { useAuth } from './useAuth';
import { RegisterPatientForm } from './RegisterPatientForm';
import { getApiErrorMessage } from '@/services/api';

/* ─── Doctor avatar URLs from the reference design ─── */
const DOCTOR_AVATARS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCri2eLRmAYhiMxDOnCm5skrbjjj4a64QZgq-w2IRs-qjw0rQSddmC5scd5Xh0zJ7svnDsNRHUEYcG2UdvyCM-zfGR96VIvf_b6gK5kQUwJAonmCSV0cNdD8joFNJVnVJrtiAjbCdAnYV7baP-U9U_N8-SbA355zzmNA-ng9pviaD-Xy4gHhv6kHZw4Ds-RP4bKOYogrumBVZ7eoqQymG-Vi4_wqCwKzix33amrYq3tUliFW6Dl8AVRucw4eIOhXojgnO5JKlgYpMKI',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAUVGhHG74yWtEf0kFwBRgcvaFsdQVG7ZwpYngQmqqPyRr1IzdHLRg0sHRDUvkcJ2vkh7g2F9HnDS43VeVAbADtXteC5vflMQYLNDIZHofN3AEazSrpfnhn_ALQRlxt3cCPwL-QqV4j4Inj_6h_Y1sKbFAmiXlXKyCfJBrALRfisupvGz4B0nyEUoWZ5Agmsh8u2gkXarNFTLA7s9Cbz9mcSZ4W93Ri-VVlp0pkpD5rHzq-pFX-XRF_mucCutAz05KeH9ZkjYW6v2-J',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDvIjAY601iso2u3Js6uf2HLDzvIhrMRdTvM5fE3hVEqW2DLVGqa7lCCdyRVC5CqI-aJeuj_B9rpdblMiG0oyE3HPvn41KvCUd6AXwRFyQZYmfto5HNrBu85Ht9ZqAPj0orHurc9Z-o3TMi5Yq9qr8b0LXcp3Lh1A3pkVNSkWlK-jCTWnYWs3Zw51olrKHRXk6-A7yAg4HG07dHHfSMvZhqd2ssVsLFNfg0tNIvDMEOKN5YTGdnuG9vbFF7dquWuiPUFHtUu',
];

/* ─── Lab background URL from the reference design ─── */
const LAB_BG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA1v4MlSDjSBHIhu11wdKd8hj6UpChiO3mOfjCYHf-GZUelGtWCNEODNU9wkqWC09CpcKLiWi-GnIcu477sL4IqYduBdNDAfQE08xUyt59p6e18_lRAXiD7qG5tqOZ_B3cG7MkC9gvW_N_sdWvYIvJPY5vp_Rj64_-iXDYZ6gQJlUkgFnUeiYypkA2XIRWSKBKQ8glMWDO-gXS7EKfXEgUIefGk75Cuh9366jlTq8LH42ZI7zFNm3_k6pg0UX8KlbIfmqSq-cqA7hLU';

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
    <div className="min-h-screen flex items-center justify-center p-0 md:p-6 bg-background overflow-hidden">
      <main className="w-full max-w-7xl mx-auto flex flex-col md:flex-row shadow-2xl overflow-hidden rounded-none md:rounded-[2rem] bg-surface-container-lowest"
        style={{ minHeight: 'min(921px, 100dvh)' }}>

        {/* ── Left Panel: Visual Sanctuary (hidden on mobile) ── */}
        <section className="relative w-full md:w-1/2 lg:w-3/5 hidden md:flex flex-col justify-between p-12 overflow-hidden">
          {/* Background image layer */}
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LAB_BG}
              alt="Laboratorio clínico moderno"
              className="w-full h-full object-cover"
            />
            {/* Tonal overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 via-transparent to-secondary/20 mix-blend-multiply" />
            <div className="absolute inset-0 bg-on-background/10" />
          </div>

          {/* Top: Logo + brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-primary-container flex items-center justify-center rounded-xl shadow-lg">
                <span className="material-symbols-outlined text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                  medical_services
                </span>
              </div>
              <span className="text-2xl font-extrabold tracking-tighter text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                APP-DX
              </span>
            </div>
            <div className="max-w-md">
              <h2 className="text-5xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                The Clinical Sanctuary.
              </h2>
              <p className="text-white/90 text-lg leading-relaxed font-medium">
                Elevando la precisión diagnóstica a través de un ecosistema digital diseñado para la serenidad y la eficiencia médica.
              </p>
            </div>
          </div>

          {/* Bottom: Doctor avatars glass pill */}
          <div className="relative z-10">
            <div className="glass-panel p-6 rounded-3xl border border-white/20 inline-flex items-center gap-4">
              <div className="flex -space-x-3">
                {DOCTOR_AVATARS.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`Doctor ${i + 1}`}
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <p className="text-on-background text-sm font-semibold">
                +500 especialistas confían en{' '}
                <span className="text-primary font-bold">BTS Integral</span>
              </p>
            </div>
          </div>
        </section>

        {/* ── Right Panel: Login Form ── */}
        <section className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center items-center p-8 md:p-16 lg:p-24 bg-surface-container-lowest">
          {/* Mobile-only brand header */}
          <div className="flex md:hidden items-center gap-2 mb-12 self-start">
            <span className="material-symbols-outlined text-primary text-[2rem]">medical_services</span>
            <span className="text-xl font-extrabold tracking-tighter text-on-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>
              APP-DX
            </span>
          </div>

          <div className="w-full max-w-sm space-y-10">
            {/* Heading */}
            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold text-on-surface tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Bienvenido
              </h1>
              <p className="text-on-surface-variant font-medium">
                Ingresa tus credenciales para acceder al portal clínico.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
              <div className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface-variant px-1" htmlFor="email">
                    Correo Electrónico
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline transition-colors group-focus-within:text-primary">
                      <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="doctor@bts-integral.com"
                      className="block w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none font-medium"
                      aria-invalid={Boolean(errors.email)}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-error px-1" role="alert">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-sm font-semibold text-on-surface-variant" htmlFor="password">
                      Contraseña
                    </label>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline transition-colors group-focus-within:text-primary">
                      <span className="material-symbols-outlined text-[20px]">lock_open</span>
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••••••"
                      className="block w-full pl-12 pr-12 py-4 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none font-medium"
                      aria-invalid={Boolean(errors.password)}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute inset-y-0 right-4 flex items-center text-outline hover:text-on-surface transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-error px-1" role="alert">{errors.password.message}</p>
                  )}
                </div>
              </div>

              {/* Remember session */}
              <div className="flex items-center gap-3 py-2">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 bg-surface-container-low"
                />
                <label htmlFor="remember" className="text-sm font-medium text-on-surface-variant select-none">
                  Recordar sesión en este equipo
                </label>
              </div>

              {/* Server error */}
              {serverError && (
                <div
                  role="alert"
                  className="text-sm rounded-xl px-4 py-3 bg-error-container text-on-error-container border border-error/20"
                >
                  {serverError}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-primary-container text-on-primary-container font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Manrope, sans-serif' }}
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
            <div className="pt-8 border-t border-outline-variant/30 text-center">
              <p className="text-sm text-on-surface-variant font-medium">
                ¿Nuevo en la plataforma?{' '}
                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  className="text-primary font-bold hover:underline"
                >
                  Solicitar acceso
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-12 flex flex-col items-center gap-4">
            <p className="text-[10px] uppercase tracking-widest text-outline font-bold text-center">
              Seguridad de Grado Médico • HIPAA Compliant
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-[11px] font-semibold text-outline hover:text-on-surface transition-colors">
                Privacidad
              </a>
              <a href="#" className="text-[11px] font-semibold text-outline hover:text-on-surface transition-colors">
                Soporte Técnico
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}