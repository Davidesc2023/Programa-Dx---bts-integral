'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, FlaskConical, Calendar } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/modules/auth/authStore';
import { UserRole } from '@/types/enums';

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Inicio',      icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.OPERADOR, UserRole.LABORATORIO, UserRole.MEDICO] },
  { href: '/orders',       label: 'Órdenes',     icon: ClipboardList,   roles: [UserRole.ADMIN, UserRole.OPERADOR, UserRole.LABORATORIO, UserRole.MEDICO] },
  { href: '/results',      label: 'Resultados',  icon: FlaskConical,    roles: [UserRole.ADMIN, UserRole.OPERADOR, UserRole.LABORATORIO, UserRole.MEDICO] },
  { href: '/appointments', label: 'Citas',       icon: Calendar,        roles: [UserRole.ADMIN, UserRole.OPERADOR, UserRole.MEDICO] },
];

export function BottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const visible = NAV_ITEMS.filter(
    (item) => user?.role && item.roles.includes(user.role),
  );

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t"
      style={{
        background: 'rgba(248,250,250,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: '#e6e8e9',
        boxShadow: '0px -4px 20px rgba(25,28,29,0.06)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {visible.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[60px]',
                isActive ? 'text-primary-container' : 'text-outline',
              )}
            >
              <Icon
                size={22}
                className={cn('transition-transform', isActive && 'scale-110')}
              />
              <span className="text-[10px] font-semibold tracking-tight leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
