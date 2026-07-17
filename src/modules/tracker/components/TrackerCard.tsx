import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { ExternalLink, FileText, Eye, MoreHorizontal } from "lucide-react";

interface TrackerCardProps {
  id: string;
  company: string;
  role: string;
  logo?: string;
  date: string;
  index: number;
}

export function TrackerCard({ id, company, role, logo, date, index }: TrackerCardProps) {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg border border-brand-border px-3 py-2.5 shadow-sm transition-shadow cursor-grab active:cursor-grabbing ${
            snapshot.isDragging
              ? "shadow-card-hover ring-2 ring-brand-primary/30 rotate-[2deg] scale-[1.02]"
              : "hover:shadow-card-hover"
          }`}
        >
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-pill bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0 mt-0.5">
            {logo ?? company[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{company}</p>
            <p className="text-xs text-gray-500 truncate">{role}</p>
            <div className="flex items-center gap-2 mt-2">
              <button className="w-6 h-6 rounded-pill flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label="Open external link">
                <ExternalLink className="w-3 h-3" />
              </button>
              <button className="w-6 h-6 rounded-pill flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label="View notes">
                <FileText className="w-3 h-3" />
              </button>
              <button className="w-6 h-6 rounded-pill flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label="View details">
                <Eye className="w-3 h-3" />
              </button>
              <button className="w-6 h-6 rounded-pill flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label="More options">
                <MoreHorizontal className="w-3 h-3" />
              </button>
            </div>
          </div>
          <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">{date}</span>
        </div>
      </div>
      )}
    </Draggable>
  );
}
