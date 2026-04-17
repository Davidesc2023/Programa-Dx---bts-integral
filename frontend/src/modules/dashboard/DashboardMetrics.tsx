'use client';

import { ClipboardList, Activity, CheckCircle2 } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  delta: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  icon: React.ElementType;
  progress: number;
  isLoading: boolean;
}

function MetricCard({
  title,
  value,
  delta,
  borderColor,
  iconBg,
  iconColor,
  icon: Icon,
  progress,
  isLoading,
}: MetricCardProps) {
  return (
    <div
      className="rounded-2xl p-6 border-l-4"
      style={{
        background: '#ffffff',
        borderLeftColor: borderColor,
        boxShadow: '0px 8px 24px rgba(25,28,29,0.06)',
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <span
          className="text-xs font-black tracking-widest uppercase"
          style={{ color: '#3e4946' }}
        >
          {title}
        </span>
        <div
          className="p-2 rounded-lg"
          style={{ background: iconBg, color: iconColor }}
        >
          <Icon size={20} />
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        {isLoading ? (
          <div
            className="h-10 w-16 rounded-lg animate-pulse"
            style={{ background: '#e6e8e9' }}
          />
        ) : (
          <>
            <span
              className="text-4xl font-black tabular-nums"
              style={{ color: '#191c1d', fontFamily: 'Manrope, sans-serif' }}
            >
              {value.toLocaleString('es-CO')}
            </span>
            <span className="text-xs font-bold" style={{ color: iconColor }}>
              {delta}
            </span>
          </>
        )}
      </div>

      <div className="w-full h-1 rounded-full" style={{ background: '#e6e8e9' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(Math.max(progress, 5), 100)}%`, background: borderColor }}
        />
      </div>
    </div>
  );
}

interface DashboardMetricsProps {
  totalPatients: number;
  pendingOrders: number;
  activeOrders: number;
  completedOrders: number;
  isLoading: boolean;
}

export function DashboardMetrics({
  pendingOrders,
  activeOrders,
  completedOrders,
  isLoading,
}: DashboardMetricsProps) {
  const total = Math.max(pendingOrders + activeOrders + completedOrders, 1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <MetricCard
        title="Pendientes"
        value={pendingOrders}
        delta="+hoy"
        borderColor="#F5C518"
        iconBg="rgba(208,166,0,0.12)"
        iconColor="#584400"
        icon={ClipboardList}
        progress={(pendingOrders / total) * 100}
        isLoading={isLoading}
      />
      <MetricCard
        title="En Proceso"
        value={activeOrders}
        delta="Activo"
        borderColor="#4490D9"
        iconBg="rgba(0,97,163,0.10)"
        iconColor="#0061a3"
        icon={Activity}
        progress={(activeOrders / total) * 100}
        isLoading={isLoading}
      />
      <MetricCard
        title="Completadas"
        value={completedOrders}
        delta="↑ Mes"
        borderColor="#1B7A6B"
        iconBg="rgba(27,122,107,0.10)"
        iconColor="#006053"
        icon={CheckCircle2}
        progress={(completedOrders / total) * 100}
        isLoading={isLoading}
      />
    </div>
  );
}
