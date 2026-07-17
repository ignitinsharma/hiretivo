import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import { TrackerCard } from "./TrackerCard";

interface Application {
  id: string;
  company: string;
  role: string;
  logo?: string;
  date: string;
}

interface KanbanColumnProps {
  title: string;
  count: number;
  color: string;
  applications: Application[];
}

export function KanbanColumn({ title, count, color, applications }: KanbanColumnProps) {
  return (
    <div className="shrink-0 w-[220px] flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-1 h-6 rounded-pill ${color}`} />
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-pill px-2 py-0.5">
          {count}
        </span>
      </div>
      <Droppable droppableId={title}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-2 min-h-[300px] transition-colors rounded-lg ${
              snapshot.isDraggingOver ? "bg-brand-primary/5" : ""
            }`}
          >
            {applications.map((app, index) => (
              <TrackerCard key={app.id} {...app} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
