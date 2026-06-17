'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: '#f0f6f4' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.40)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden flex">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
