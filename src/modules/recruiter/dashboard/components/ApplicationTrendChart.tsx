export function ApplicationTrendChart() {
  return (
    <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-200">
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
              <div className="border-b border-slate-100 w-full" />
              <div className="border-b border-slate-100 w-full" />
              <div className="border-b border-slate-100 w-full" />
              <div className="border-b border-slate-100 w-full" />
            </div>

            {/* Chart SVG */}
            <svg
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <defs>
                <linearGradient id="trendGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(239 84% 67%)"
                    stopOpacity="0.2"
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(239 84% 67%)"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
              <path
                d="M0,80 Q10,75 20,85 T40,60 T60,50 T80,45 T100,20 L100,100 L0,100 Z"
                fill="url(#trendGrad)"
              />
              <path
                d="M0,80 Q10,75 20,85 T40,60 T60,50 T80,45 T100,20"
                fill="none"
                stroke="hsl(239 84% 67%)"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* X-axis labels */}
            <div className="absolute bottom-[-32px] left-0 right-0 flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <span>1 May</span>
              <span>8 May</span>
              <span>15 May</span>
              <span>22 May</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
