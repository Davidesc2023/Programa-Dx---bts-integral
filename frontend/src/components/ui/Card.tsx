import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border',
        paddingMap[padding],
        className,
      )}
      style={{
        background: '#ffffff',
        borderColor: '#e6e8e9',
        boxShadow: '0px 8px 24px rgba(25,28,29,0.06)',
      }}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-5', className)}>
      <div>
        <h3
          className="text-base font-bold"
          style={{ color: '#191c1d', fontFamily: 'Manrope, sans-serif' }}
        >
          {title}
        </h3>
        {description && (
          <p className="text-sm mt-0.5" style={{ color: '#6e7976' }}>{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
