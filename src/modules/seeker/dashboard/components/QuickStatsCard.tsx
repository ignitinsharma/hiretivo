import React from 'react';
import { QUICK_STATS } from '../data/mock-dashboard-data';
import { Send, Eye, MessageSquare } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  send: <Send className="w-5 h-5" />,
  visibility: <Eye className="w-5 h-5" />,
  chat_bubble: <MessageSquare className="w-5 h-5" />,
};

export function QuickStatsCard() {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="font-bold text-slate-900 mb-6">Quick Stats</h3>
      <div className="space-y-4">
        {QUICK_STATS.map((stat) => (
          <div key={stat.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.colorClass}`}
              >
                {ICON_MAP[stat.icon]}
              </div>
              <span className="text-sm font-medium text-slate-600">
                {stat.label}
              </span>
            </div>
            <span className="text-lg font-bold text-slate-900">
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}