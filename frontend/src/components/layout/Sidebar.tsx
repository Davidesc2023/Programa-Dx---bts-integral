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
      style={{
        background: '#0A1410',
        borderColor: 'rgba(176,252,206,0.08)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2 px-4 py-5 border-b"
        style={{ borderColor: 'rgba(176,252,206,0.08)' }}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="BTS Integral" width={36} height={36} />
          <span className="text-sm font-semibold leading-tight" style={{ color: '#B0FCCE' }}>
            BTS Integral
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: isActive ? 'rgba(43,255,248,0.1)' : 'transparent',
                    color: isActive ? '#2BFFF8' : 'rgba(176,252,206,0.6)',
                    border: isActive ? '1px solid rgba(43,255,248,0.2)' : '1px solid transparent',
                  }}
                >
                  <Icon
                    size={18}
                    className="shrink-0"
                    style={{ color: isActive ? '#2BFFF8' : 'rgba(176,252,206,0.4)' }}
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
        style={{ borderColor: 'rgba(176,252,206,0.08)' }}
      >
        <div className="flex items-center gap-2 px-2 py-2">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0"
            style={{ background: 'rgba(43,255,248,0.15)', color: '#2BFFF8', border: '1px solid rgba(43,255,248,0.3)' }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: '#B0FCCE' }}>
              {user?.email ?? '—'}
            </p>
            <p className="text-xs" style={{ color: 'rgba(176,252,206,0.4)' }}>{roleLabel}</p>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="p-1 rounded transition-colors"
            style={{ color: 'rgba(176,252,206,0.4)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ff6b6b')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(176,252,206,0.4)')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
