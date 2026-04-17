'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  FlaskConical,
  Calendar,
  UserCog,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/modules/auth/authStore';
import { useAuth } from '@/modules/auth/useAuth';
import { UserRole, ROLE_LABELS } from '@/types/enums';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Panel Principal',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.ADMIN, UserRole.OPERADOR, UserRole.LABORATORIO, UserRole.MEDICO],
  },
  {
    label: 'Pacientes',
    href: '/patients',
    icon: Users,
    roles: [UserRole.ADMIN, UserRole.OPERADOR, UserRole.MEDICO],
  },
  {
    label: 'Ordenes Medicas',
    href: '/orders',
    icon: ClipboardList,
    roles: [UserRole.ADMIN, UserRole.OPERADOR, UserRole.LABORATORIO, UserRole.MEDICO],
  },
  {
    label: 'Consentimientos',
    href: '/consents',
    icon: FileText,
    roles: [UserRole.ADMIN, UserRole.OPERADOR, UserRole.MEDICO],
  },
  {
    label: 'Resultados',
    href: '/results',
    icon: FlaskConical,
    roles: [UserRole.ADMIN, UserRole.OPERADOR, UserRole.LABORATORIO, UserRole.MEDICO],
  },
  {
    label: 'Citas',
    href: '/appointments',
    icon: Calendar,
    roles: [UserRole.ADMIN, UserRole.OPERADOR, UserRole.MEDICO],
  },
  {
    label: 'Usuarios',
    href: '/users',
    icon: UserCog,
    roles: [UserRole.ADMIN],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => user?.role && item.roles.includes(user.role),
  );

  const initial = user?.email?.charAt(0).toUpperCase() ?? '?';
  const roleLabel = user?.role ? ROLE_LABELS[user.role] : '';

  const canCreateOrder =
    user?.role &&
    [UserRole.ADMIN, UserRole.OPERADOR, UserRole.MEDICO].includes(user.role);

  return (
    <aside
      className="flex flex-col w-72 shrink-0 h-screen border-r"
      style={{
        fontFamily: 'Manrope, sans-serif',
        background: '#ffffff',
        borderColor: '#e6e8e9',
        boxShadow: '8px 0px 24px rgba(25,28,29,0.05)',
      }}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-6 border-b" style={{ borderColor: '#e6e8e9' }}>
        <Link href="/dashboard" className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ background: '#1B7A6B' }}
          >
            <Image src="/logo.png" alt="BTS Integral" width={24} height={24} className="object-contain" />
          </div>
          <div>
            <h1 className="font-black text-lg leading-tight" style={{ color: '#1B7A6B', fontFamily: 'Manrope, sans-serif' }}>
              BTS Integral
            </h1>
            <p className="text-xs font-medium" style={{ color: '#3e4946' }}>
              Portal del Especialista
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-5 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
              )}
              style={
                isActive
                  ? { background: 'rgba(27,122,107,0.10)', color: '#1B7A6B' }
                  : { color: '#3e4946' }
              }
            >
              <Icon
                size={18}
                className="shrink-0"
                style={{ color: isActive ? '#1B7A6B' : '#6e7976' }}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* CTA Nueva Orden */}
      {canCreateOrder && (
        <div className="px-4 pb-4">
          <Link
            href="/orders/new"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
            style={{
              background: '#1B7A6B',
              boxShadow: '0 4px 14px rgba(27,122,107,0.25)',
            }}
          >
            <PlusCircle size={18} />
            Nueva Orden
          </Link>
        </div>
      )}

      {/* User Footer */}
      <div className="border-t px-4 py-4" style={{ borderColor: '#e6e8e9' }}>
        <div className="flex items-center gap-3 px-2 py-2">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0"
            style={{ background: 'rgba(27,122,107,0.12)', color: '#1B7A6B' }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: '#191c1d' }}>
              {user?.email ?? '---'}
            </p>
            <p className="text-xs" style={{ color: '#6e7976' }}>{roleLabel}</p>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesion"
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#6e7976' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}