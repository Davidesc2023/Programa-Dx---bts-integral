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
    label: 'Dashboard',
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
    label: 'Órdenes',
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

  return (
    <aside
      className="flex flex-col w-60 shrink-0 h-screen border-r"
      style={{ background: '#0f1319', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2 px-4 py-5 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="BTS Integral" width={36} height={36} />
          <span className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
            BTS Integral
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: isActive ? 'rgba(74,222,128,0.1)' : 'transparent',
                    color: isActive ? '#4ade80' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <Icon
                    size={17}
                    className="shrink-0"
                    style={{ color: isActive ? '#4ade80' : 'rgba(255,255,255,0.35)' }}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div
        className="border-t p-3"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-2 px-1 py-1.5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0"
            style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80' }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: '#e2e8f0' }}>
              {user?.email ?? '—'}
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{roleLabel}</p>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="p-1.5 rounded transition-colors"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
