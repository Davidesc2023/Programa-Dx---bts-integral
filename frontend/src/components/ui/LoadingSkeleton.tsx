import { cn } from '@/lib/cn';

interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
}

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-surface-container-high rounded animate-pulse',
        className,
      )}
    />
  );
}

export function LoadingSkeleton({ className, rows = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)} aria-busy="true" aria-label="Cargando...">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine
          key={i}
          className={cn('h-4', i === 0 ? 'w-3/4' : i % 3 === 0 ? 'w-1/2' : 'w-full')}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full" aria-busy="true" aria-label="Cargando tabla...">
      {/* Header */}
      <div className={`grid gap-4 mb-2`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} className="h-3 bg-surface-container-highest" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid gap-4 py-3 border-b border-surface-container-high"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine
              key={c}
              className={cn('h-4 animate-pulse', c === 0 ? 'w-4/5' : 'w-3/5')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-sm p-6 space-y-3 animate-pulse">
      <SkeletonLine className="h-4 w-1/3 bg-surface-container" />
      <SkeletonLine className="h-8 w-1/2 bg-surface-container" />
      <SkeletonLine className="h-3 w-2/3 bg-surface-container-low" />
    </div>
  );
}
