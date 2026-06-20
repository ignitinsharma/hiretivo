'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import type { TrendDataPoint } from '@/modules/recruiter/dashboard/types/dashboard.types';

interface ApplicationTrendChartProps {
  data: TrendDataPoint[];
  isLoading: boolean;
}

interface ChartPoint {
  x: number;
  y: number;
  date: string;
  count: number;
}

const CHART_EMPTY_Y = 80;
const CHART_TOP_Y = 20;
const CHART_BOTTOM_Y = 80;
const HIT_AREA_RADIUS = 4;

function getChartPoints(data: TrendDataPoint[], maxCount: number): ChartPoint[] {
  return data.map((point, index) => {
    const x = data.length === 1 ? 50 : (index / Math.max(data.length - 1, 1)) * 100;
    const y =
      maxCount === 0
        ? CHART_EMPTY_Y
        : CHART_BOTTOM_Y - (point.count / maxCount) * (CHART_BOTTOM_Y - CHART_TOP_Y);

    return { x, y, date: point.date, count: point.count };
  });
}

function getLinePath(points: ChartPoint[]): string {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' ');
}

function getAreaPath(points: ChartPoint[]): string {
  if (points.length === 0) {
    return '';
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  return `${getLinePath(points)} L${lastPoint.x},100 L${firstPoint.x},100 Z`;
}

function getDateLabels(data: TrendDataPoint[]): string[] {
  if (data.length === 0) {
    return [];
  }

  const lastIndex = data.length - 1;
  const labelIndexes = [
    0,
    Math.floor(lastIndex * 0.25),
    Math.floor(lastIndex * 0.5),
    Math.floor(lastIndex * 0.75),
    lastIndex,
  ];
  const uniqueIndexes = Array.from(new Set(labelIndexes));

  return uniqueIndexes.map((index) =>
    format(new Date(data[index].date), 'MMM d')
  );
}

function Tooltip({ point }: { point: ChartPoint }) {
  const formattedDate = format(new Date(point.date), 'MMMM d, yyyy');
  const applicationLabel = point.count === 1 ? 'application' : 'applications';

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 pointer-events-none">
      <div className="bg-slate-900 text-white text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
        <div className="text-center">
          <span className="font-semibold">{point.count}</span>{' '}
          <span className="font-normal text-slate-300">{applicationLabel} received</span>
        </div>
        <div className="text-slate-400 text-[10px] mt-0.5 text-center">
          on {formattedDate}
        </div>
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
    </div>
  );
}

export function ApplicationTrendChart({ data, isLoading }: ApplicationTrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

  if (isLoading) {
    return (
      <section className="bg-white rounded-xl border border-brand-border overflow-hidden">
        <div className="px-8 py-6 border-b border-brand-border space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="p-8 h-80">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      </section>
    );
  }

  const maxCount = Math.max(...data.map((point) => point.count), 0);
  const points = getChartPoints(data, maxCount);
  const linePath = getLinePath(points);
  const areaPath = getAreaPath(points);
  const dateLabels = getDateLabels(data);

  return (
    <section className="bg-white rounded-xl border border-brand-border overflow-hidden">
      <div className="px-8 py-6 border-b border-brand-border">
        <h2 className="text-xl font-bold text-slate-900">
          Application Trend
        </h2>
        <p className="text-sm text-slate-500">
          Total applications received over the last 30 days
        </p>
      </div>
      <div className="p-8 h-80 relative">
        <div className="absolute inset-0 p-8 flex flex-col justify-end">
          <div className="flex items-end justify-between w-full h-48 relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-b border-brand-border-light w-full" />
              <div className="border-b border-brand-border-light w-full" />
              <div className="border-b border-brand-border-light w-full" />
              <div className="border-b border-brand-border-light w-full" />
            </div>

            {/* Chart SVG */}
            <svg
              className="absolute inset-0 w-full h-full text-primary"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <defs>
                <linearGradient id="trendGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="currentColor"
                    stopOpacity="0.2"
                  />
                  <stop
                    offset="100%"
                    stopColor="currentColor"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
              {areaPath && <path d={areaPath} fill="url(#trendGrad)" />}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>

            {/* Hit areas for hover */}
            {points.map((point, index) => {
              const isHovered = hoveredPoint?.date === point.date;
              return (
                <div
                  key={point.date}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                  }}
                  onMouseEnter={() => setHoveredPoint(point)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Invisible hit area */}
                  <div
                    className={`w-8 h-8 -m-4 rounded-full cursor-pointer transition-opacity ${
                      isHovered ? 'bg-primary/20' : 'hover:bg-primary/10'
                    }`}
                  />
                  {/* Visible dot when hovered or has data */}
                  {(isHovered || point.count > 0) && (
                    <div
                      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary transition-transform ${
                        isHovered ? 'scale-150' : 'scale-100'
                      }`}
                    />
                  )}
                  {/* Tooltip */}
                  {isHovered && point.count > 0 && <Tooltip point={point} />}
                </div>
              );
            })}

            {maxCount === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-slate-500">
                  No applications in the last 30 days
                </p>
              </div>
            )}

            {/* X-axis labels */}
            <div className="absolute bottom-[-32px] left-0 right-0 flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              {dateLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}