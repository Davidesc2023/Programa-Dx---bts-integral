'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ScrollText, Upload, UserCog } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/modules/auth/authStore';
import { UserRole } from '@/types/enums';

export function BottomNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === UserRole.ADMIN;

  const NAV_ITEMS = [
    { href: '/dx/dashboard', label: 'Panel DX',  icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.OPERADOR] },
    { href: '/dx/casos',     label: 'Casos',     icon: ScrollText,      roles: [UserRole.ADMIN, UserRole.OPERADOR] },
    { href: '/dx/importar',  label: 'Importar',  icon: Upload,          roles: [UserRole.ADMIN] },
    { href: '/users',        label: 'Usuarios',  icon: UserCog,         roles: [UserRole.ADMIN] },
  ];

  const visible = NAV_ITEMS.filter(
    (item) => user?.role && item.roles.includes(user.role),
  );

  if (!visible.length) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t"
      style={{
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: '#e0e8e5',
        boxShadow: '0 -1px 0 #e0e8e5',
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
              className={cn('flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[56px]')}
              style={{ color: isActive ? '#1B7A6B' : '#9eaaa7' }}
            >
              <Icon size={21} className={cn('transition-transform', isActive && 'scale-110')} />
              <span className="text-[10px] font-semibold tracking-tight leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
