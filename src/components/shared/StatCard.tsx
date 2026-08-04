import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'purple';
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = 'default',
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 border border-brand-border-light">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-brand-foreground-muted">{label}</p>
          <p className="text-2xl font-bold text-brand-foreground mt-1">{value}</p>
          {trend && (
            <p
              className={cn(
                'text-sm font-medium mt-2',
                trend.isPositive ? 'text-brand-primary' : 'text-red-600'
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}% from last week
            </p>
          )}
        </div>
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            variant === 'purple'
              ? 'bg-brand-primary/10 text-brand-primary'
              : 'bg-brand-surface text-brand-foreground-muted'
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
