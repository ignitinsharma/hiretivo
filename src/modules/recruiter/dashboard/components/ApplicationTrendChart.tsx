'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { TrendDataPoint } from '@/modules/recruiter/dashboard/types/dashboard.types';

interface ApplicationTrendChartProps {
  trendData: TrendDataPoint[];
}

const chartConfig = {
  count: {
    label: 'Applications',
    color: 'hsl(239 84% 67%)',
  },
} satisfies ChartConfig;

export function ApplicationTrendChart({ trendData }: ApplicationTrendChartProps) {
  const formattedData = trendData.map((point) => ({
    ...point,
    date: new Date(point.date + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">
          Application Trend
        </h2>
        <p className="text-sm text-slate-500">
          Total applications received over the last 30 days
        </p>
      </div>
      <div className="p-6 h-80">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(239 84% 67%)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor="hsl(239 84% 67%)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-[10px]"
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              className="text-[10px]"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="count"
              type="monotone"
              fill="url(#fillGradient)"
              stroke="hsl(239 84% 67%)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </section>
  );
}