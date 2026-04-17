'use client';

import Link from 'next/link';
import { PlusCircle, Clock } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/authStore';
import { UserRole } from '@/types/enums';

interface DashboardHeroProps {
  pendingOrders: number;
  totalPatients: number;
  isLoading: boolean;
}

export function DashboardHero({ pendingOrders, totalPatients, isLoading }: DashboardHeroProps) {
  const user = useAuthStore((s) => s.user);
  const name = user?.email ? user.email.split('@')[0] : 'Especialista';

  const canCreateOrder =
    user?.role &&
    [UserRole.ADMIN, UserRole.OPERADOR, UserRole.MEDICO].includes(user.role);

  return (
    <section className="flex flex-col md:flex-row gap-6 items-stretch">
      {/* ── Welcome Banner ── */}
      <div
        className="flex-1 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between"
        style={{
          background: 'linear-gradient(135deg, #1B7A6B 0%, #145a4f 100%)',
          boxShadow: '0px 8px 24px rgba(25,28,29,0.06)',
          minHeight: '200px',
        }}
      >
        <div className="relative z-10">
          <h2
            className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Hola, {name}
          </h2>
          <p className="text-white/80 font-medium max-w-md text-sm leading-relaxed">
            {isLoading
              ? 'Cargando información del panel…'
              : `Tienes ${pendingOrders} órdenes pendientes y ${totalPatients} pacientes registrados.`}
          </p>
        </div>

        <div className="mt-8 flex gap-3 relative z-10">
          <div
            className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl text-xs border border-white/10 flex items-center gap-2 font-semibold"
          >
            <Clock size={14} />
            Panel Clínico Activo
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-0 -top-16 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── Quick Action Card ── */}
      {canCreateOrder ? (
        <Link href="/orders/new" className="md:w-72 shrink-0 group block">
          <div
            className="h-full rounded-3xl p-8 flex flex-col justify-center items-center text-center transition-all duration-300 group-hover:-translate-y-1"
            style={{
              background: '#ffffff',
              boxShadow: '0px 8px 24px rgba(25,28,29,0.06)',
              border: '1px solid #e6e8e9',
            }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
              style={{ background: 'rgba(27,122,107,0.10)', color: '#1B7A6B' }}
            >
              <PlusCircle size={40} strokeWidth={1.5} />
            </div>
            <h3
              className="text-lg font-bold text-on-surface mb-2"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Crear Nueva Orden Médica
            </h3>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-[200px]">
              Inicia una solicitud de análisis, diagnóstico o tratamiento.
            </p>
          </div>
        </Link>
      ) : (
        <div className="md:w-72 shrink-0">
          <div
            className="h-full rounded-3xl p-8 flex flex-col justify-center items-center text-center"
            style={{
              background: '#ffffff',
              boxShadow: '0px 8px 24px rgba(25,28,29,0.06)',
              border: '1px solid #e6e8e9',
            }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ background: 'rgba(27,122,107,0.10)', color: '#1B7A6B' }}
            >
              <PlusCircle size={40} strokeWidth={1.5} />
            </div>
            <h3
              className="text-lg font-bold text-on-surface mb-2"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Portal de Laboratorio
            </h3>
            <p className="text-on-surface-variant text-sm leading-relaxed max-w-[200px]">
              Gestiona los análisis y resultados en proceso.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
