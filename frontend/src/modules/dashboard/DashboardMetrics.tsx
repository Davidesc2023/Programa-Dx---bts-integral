'use client';

import { Users, ClipboardList, Activity, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { cn } from '@/lib/cn';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}

function MetricCard({ title, value, icon: Icon, colorClass, bgClass }: MetricCardProps) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-4">
        <div className={cn('p-3 rounded-xl', bgClass)}>
          <Icon size={22} className={colorClass} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
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
      colorClass: 'text-primary-600',
      bgClass: 'bg-primary-50',
    },
    {
      title: 'Órdenes pendientes',
      value: pendingOrders,
      icon: ClipboardList,
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-50',
    },
    {
      title: 'En proceso',
      value: activeOrders,
      icon: Activity,
      colorClass: 'text-secondary-500',
      bgClass: 'bg-secondary-50',
    },
    {
      title: 'Completadas',
      value: completedOrders,
      icon: CheckCircle2,
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-50',
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
