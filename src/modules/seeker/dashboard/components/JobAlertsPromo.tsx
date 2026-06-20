"use client";

import React from "react";
import { Mail, TrendingUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { SkillGapSummary } from "../types/dashboard.types";

interface JobAlertsPromoProps {
  digestEnabled: boolean;
  skillGap: SkillGapSummary;
  onToggleDigest: (enabled: boolean) => void;
  isTogglingDigest: boolean;
}

export function JobAlertsPromo({
  digestEnabled,
  skillGap,
  onToggleDigest,
  isTogglingDigest,
}: JobAlertsPromoProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-brand-border space-y-5">
      {/* Weekly digest toggle */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-primary" />
          <h4 className="font-bold text-slate-900 text-sm">Weekly Digest</h4>
        </div>
        <p className="text-xs text-slate-500 mb-3 leading-loose">
          Get your top matched jobs delivered every Monday morning.
        </p>
        <div className="flex items-center gap-3">
          <Switch
            id="digest-toggle"
            checked={digestEnabled}
            onCheckedChange={onToggleDigest}
            disabled={isTogglingDigest}
            aria-label="Toggle weekly digest emails"
          />
          <Label
            htmlFor="digest-toggle"
            className="text-sm font-medium text-slate-700 cursor-pointer"
          >
            {digestEnabled ? "Enabled" : "Disabled"}
          </Label>
        </div>
      </div>

      {/* Skill gap tracker */}
      {skillGap.items.length > 0 && (
        <div className="border-t border-brand-border-light pt-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <h4 className="font-bold text-slate-900 text-sm">Skill Gap</h4>
          </div>
          <p className="text-xs text-slate-500 mb-3 leading-loose">
            Top skills missing from jobs in your feed:
          </p>
          <ul className="space-y-1">
            {skillGap.items.map((item) => (
              <li
                key={item.skillName}
                className="flex items-center justify-between"
              >
                <span className="text-xs font-medium text-slate-700">
                  {item.skillName}
                </span>
                <span className="text-xs text-slate-400">
                  {item.frequency} {item.frequency === 1 ? "job" : "jobs"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
