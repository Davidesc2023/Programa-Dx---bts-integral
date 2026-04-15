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
        'rounded-xl border shadow-sm',
        paddingMap[padding],
        className,
      )}
      style={{
        background: 'rgba(176,252,206,0.03)',
        borderColor: 'rgba(176,252,206,0.1)',
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
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
      <div>
        <h3 className="text-base font-semibold" style={{ color: '#B0FCCE' }}>{title}</h3>
        {description && (
          <p className="text-sm mt-0.5" style={{ color: 'rgba(176,252,206,0.5)' }}>{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
