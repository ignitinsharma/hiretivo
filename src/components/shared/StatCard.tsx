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
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
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
              : 'bg-gray-100 text-gray-600'
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
