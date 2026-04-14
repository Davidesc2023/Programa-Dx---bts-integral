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
    roles: [UserRole.ADMIN, UserRole.OPERADOR, UserRole.LABORATORIO],
  },
  {
    label: 'Pacientes',
    href: '/patients',
    icon: Users,
    roles: [UserRole.ADMIN, UserRole.OPERADOR],
  },
  {
    label: 'Órdenes',
    href: '/orders',
    icon: ClipboardList,
    roles: [UserRole.ADMIN, UserRole.OPERADOR, UserRole.LABORATORIO],
  },
  {
    label: 'Consentimientos',
    href: '/consents',
    icon: FileText,
    roles: [UserRole.ADMIN, UserRole.OPERADOR],
  },
  {
    label: 'Resultados',
    href: '/results',
    icon: FlaskConical,
    roles: [UserRole.ADMIN, UserRole.OPERADOR, UserRole.LABORATORIO],
  },
  {
    label: 'Citas',
    href: '/appointments',
    icon: Calendar,
    roles: [UserRole.ADMIN, UserRole.OPERADOR],
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
    <aside className="flex flex-col w-60 shrink-0 h-screen bg-white border-r border-gray-200 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="BTS Integral" width={36} height={36} />
          <span className="text-sm font-semibold text-gray-800 leading-tight">
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
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <Icon
                    size={18}
                    className={cn(
                      'shrink-0',
                      isActive ? 'text-primary-600' : 'text-gray-400',
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 text-white text-sm font-semibold shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {user?.email ?? '—'}
            </p>
            <p className="text-xs text-gray-400">{roleLabel}</p>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
