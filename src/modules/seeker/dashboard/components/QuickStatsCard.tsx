import React from "react";
import { Send, Eye, MessageSquare } from "lucide-react";
import type { QuickStatsSummary } from "../types/dashboard.types";

interface QuickStatsCardProps {
  quickStats: QuickStatsSummary;
}

interface StatRow {
  id: keyof QuickStatsSummary;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
}

const STAT_ROWS: StatRow[] = [
  {
    id: "applied",
    label: "Applied",
    icon: <Send className="w-5 h-5" />,
    colorClass: "text-orange-600 bg-orange-100",
  },
  {
    id: "viewed",
    label: "Viewed",
    icon: <Eye className="w-5 h-5" />,
    colorClass: "text-blue-600 bg-blue-100",
  },
  {
    id: "interviews",
    label: "Interviews",
    icon: <MessageSquare className="w-5 h-5" />,
    colorClass: "text-primary bg-primary/10",
  },
];

export function QuickStatsCard({ quickStats }: QuickStatsCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200">
      <h3 className="font-bold text-slate-900 mb-6">Quick Stats</h3>
      <div className="space-y-4">
        {STAT_ROWS.map((stat) => (
          <div key={stat.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.colorClass}`}
              >
                {stat.icon}
              </div>
              <span className="text-sm font-medium text-slate-600">
                {stat.label}
              </span>
            </div>
            <span className="text-lg font-bold text-slate-900">
              {quickStats[stat.id]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
