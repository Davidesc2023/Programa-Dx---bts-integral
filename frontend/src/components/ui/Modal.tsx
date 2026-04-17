'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeStyles: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({ open, onClose, title, children, className, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  // Cerrar al hacer click en el backdrop
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      className={cn(
        'w-full rounded-xl shadow-xl border border-surface-container-high p-0 backdrop:bg-on-surface/30',
        'open:flex open:flex-col',
        sizeStyles[size],
        className,
      )}
    >
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container-high">
          <h2 className="text-base font-semibold text-on-surface" style={{ fontFamily: 'Manrope, sans-serif' }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-outline hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-surface-container-low"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Body */}
      <div className="px-6 py-4 flex-1">{children}</div>
    </dialog>
  );
}
