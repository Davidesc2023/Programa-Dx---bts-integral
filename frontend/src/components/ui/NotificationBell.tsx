'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Bell, BellRing, CheckCheck, ClipboardList, FileText, CalendarCheck, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/modules/notifications/useNotifications';
import type { Notification } from '@/services/notifications.service';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'CONSENT_REQUEST':
    case 'CONSENT_RESPONDED':
      return <FileText size={16} className="text-[#4490D9]" />;
    case 'ORDER_CREATED':
    case 'ORDER_UPDATED':
      return <ClipboardList size={16} className="text-[#1B7A6B]" />;
    case 'RESULT_READY':
      return <CheckCheck size={16} className="text-[#1B7A6B]" />;
    case 'APPOINTMENT_SCHEDULED':
      return <CalendarCheck size={16} className="text-[#F5C518]" />;
    default:
      return <Info size={16} className="text-gray-400" />;
  }
}

function getOrderPath(notification: Notification, isPortal: boolean): string | null {
  const orderId = notification.metadata?.orderId as string | undefined;
  if (!orderId) return null;
  return isPortal ? `/portal/orders/${orderId}` : `/orders/${orderId}`;
}

interface NotificationBellProps {
  /** If true, order links will use /portal/orders/:id instead of /orders/:id */
  isPortal?: boolean;
}

export function NotificationBell({ isPortal = false }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function handleNotificationClick(n: Notification) {
    if (!n.isRead) markRead(n.id);
    const path = getOrderPath(n, isPortal);
    if (path) {
      setOpen(false);
      router.push(path);
    }
  }

  const hasUnread = unreadCount > 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
        aria-label={`Notificaciones${hasUnread ? ` (${unreadCount} sin leer)` : ''}`}
      >
        {hasUnread ? (
          <BellRing size={20} className="text-[#F5C518]" />
        ) : (
          <Bell size={20} className="text-white/70" />
        )}
        {hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">Notificaciones</span>
            {hasUnread && (
              <button
                onClick={() => markAllRead()}
                className="text-xs text-[#1B7A6B] hover:underline font-medium"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">
                No tienes notificaciones
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3 items-start ${
                    !n.isRead ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">{getNotificationIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        n.isRead ? 'text-gray-600' : 'text-gray-900'
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-[#1B7A6B] mt-1.5 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
