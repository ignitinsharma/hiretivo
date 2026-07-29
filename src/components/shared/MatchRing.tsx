import React from "react";
import { cn } from "@/lib/utils";

interface MatchRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function MatchRing({ score, size = 48, strokeWidth = 3, className }: MatchRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return "#16a34a";
    if (score >= 60) return "#0d9488";
    if (score >= 40) return "#d97706";
    return "#dc2626";
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color: getColor() }}>
        {score}%
      </span>
    </div>
  );
}
