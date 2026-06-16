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
  return `hace ${Math.floor(hrs / 24)}d`;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'CONSENT_REQUEST':
    case 'CONSENT_RESPONDED':
      return <FileText size={15} style={{ color: '#2563eb' }} />;
    case 'ORDER_CREATED':
    case 'ORDER_UPDATED':
      return <ClipboardList size={15} style={{ color: '#1B7A6B' }} />;
    case 'RESULT_READY':
      return <CheckCheck size={15} style={{ color: '#1B7A6B' }} />;
    case 'APPOINTMENT_SCHEDULED':
      return <CalendarCheck size={15} style={{ color: '#d97706' }} />;
    default:
      return <Info size={15} style={{ color: '#9eaaa7' }} />;
  }
}

function getOrderPath(notification: Notification, isPortal: boolean): string | null {
  const orderId = notification.metadata?.orderId as string | undefined;
  if (!orderId) return null;
  return isPortal ? `/portal/orders/${orderId}` : `/orders/${orderId}`;
}

interface NotificationBellProps {
  isPortal?: boolean;
  theme?: 'light' | 'dark';
}

export function NotificationBell({ isPortal = false, theme = 'light' }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

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
    if (path) { setOpen(false); router.push(path); }
  }

  const hasUnread = unreadCount > 0;
  const iconColor = theme === 'dark' ? 'rgba(255,255,255,0.75)' : '#6e7976';
  const iconColorUnread = '#d97706';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl transition-colors"
        style={{
          color: hasUnread ? iconColorUnread : iconColor,
          background: hasUnread ? 'rgba(217,119,6,0.07)' : 'transparent',
        }}
        aria-label={`Notificaciones${hasUnread ? ` (${unreadCount} sin leer)` : ''}`}
      >
        {hasUnread ? <BellRing size={19} /> : <Bell size={19} />}
        {hasUnread && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none"
            style={{ background: '#ba1a1a' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl z-50 overflow-hidden"
          style={{
            background: '#ffffff',
            border: '1px solid #e0e8e5',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#f2f4f4' }}>
            <span className="text-sm font-semibold" style={{ color: '#191c1d' }}>Notificaciones</span>
            {hasUnread && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-xs font-semibold hover:underline underline-offset-2"
                style={{ color: '#1B7A6B' }}
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <Bell size={24} style={{ color: '#9eaaa7' }} />
                <p className="text-sm" style={{ color: '#9eaaa7' }}>Sin notificaciones</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleNotificationClick(n)}
                  className="w-full text-left px-4 py-3 flex gap-3 items-start transition-colors border-b last:border-0"
                  style={{
                    borderColor: '#f2f4f4',
                    background: !n.isRead ? 'rgba(27,122,107,0.04)' : 'transparent',
                  }}
                >
                  <div
                    className="mt-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: '#f2f4f4' }}
                  >
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: n.isRead ? '#6e7976' : '#191c1d' }}
                    >
                      {n.title}
                    </p>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#9eaaa7' }}>{n.message}</p>
                    <p className="text-[10px] mt-1" style={{ color: '#b0bab7' }}>{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: '#1B7A6B' }} />
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
