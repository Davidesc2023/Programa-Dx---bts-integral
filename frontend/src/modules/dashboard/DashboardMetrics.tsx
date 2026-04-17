'use client';

import { Users, ClipboardList, Activity, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

function MetricCard({ title, value, icon: Icon, iconColor, iconBg }: MetricCardProps) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-4">
        <div
          className="p-3 rounded-xl shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={22} style={{ color: iconColor }} />
        </div>
        <div>
          <p className="text-sm" style={{ color: '#6e7976' }}>{title}</p>
          <p className="text-2xl font-bold tabular-nums" style={{ color: '#191c1d' }}>
            {value.toLocaleString('es-CO')}
          </p>
        </div>
      </div>
    </Card>
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
  totalPatients,
  pendingOrders,
  activeOrders,
  completedOrders,
  isLoading,
}: DashboardMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const metrics: MetricCardProps[] = [
    {
      title: 'Pacientes registrados',
      value: totalPatients,
      icon: Users,
      iconColor: '#1B7A6B',
      iconBg: 'rgba(27,122,107,0.10)',
    },
    {
      title: 'Órdenes pendientes',
      value: pendingOrders,
      icon: ClipboardList,
      iconColor: '#745b00',
      iconBg: 'rgba(208,166,0,0.12)',
    },
    {
      title: 'En proceso',
      value: activeOrders,
      icon: Activity,
      iconColor: '#0061a3',
      iconBg: 'rgba(0,97,163,0.10)',
    },
    {
      title: 'Completadas',
      value: completedOrders,
      icon: CheckCircle2,
      iconColor: '#006053',
      iconBg: 'rgba(0,96,83,0.10)',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <MetricCard key={m.title} {...m} />
      ))}
    </div>
  );
}
