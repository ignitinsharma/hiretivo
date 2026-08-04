"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { applicationService } from "@/services/application.service";
import { AutomationStatus, PipelineStage } from "@/constants/enums";
import type { SeekerApplicationItem } from "@/modules/seeker/applications/types/application.types";

export function useKanbanDrag(applications: SeekerApplicationItem[]) {
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const cardId = active.id as string;
      const targetColumn = over.id as string;

      const app = applications.find((a) => a.id === cardId);
      if (!app) return;

      const sourceColumn = app.pipelineStage ?? PipelineStage.NOT_APPLIED;

      if (sourceColumn === targetColumn) return;

      // Edge case 2: Block drag from NOT_APPLIED to advanced columns if resume not ready
      if (sourceColumn === PipelineStage.NOT_APPLIED && targetColumn !== PipelineStage.NOT_APPLIED) {
        if (app.automationStatus === AutomationStatus.GENERATING) {
          toast.error("Resume isn't ready yet — wait for generation to finish");
          return;
        }
        if (app.automationStatus === AutomationStatus.FAILED) {
          toast.error("Resume generation failed — retry before applying");
          return;
        }
      }

      // Optimistic update
      const previous = queryClient.getQueryData<SeekerApplicationItem[]>([
        "applications",
      ]);

      queryClient.setQueryData<SeekerApplicationItem[]>(
        ["applications"],
        (old) =>
          old?.map((a) =>
            a.id === cardId
              ? { ...a, pipelineStage: targetColumn as PipelineStage }
              : a,
          ),
      );

      const rollback = () => {
        queryClient.setQueryData<SeekerApplicationItem[]>(
          ["applications"],
          previous ?? [],
        );
        toast.error("Failed to update — changes reverted");
      };

      // Choose the correct API endpoint
      let mutation: Promise<void>;

      if (
        sourceColumn === PipelineStage.NOT_APPLIED &&
        targetColumn === PipelineStage.APPLIED
      ) {
        // Edge case 1: Same as "I've Applied" button
        mutation = applicationService.markApplied(cardId);
      } else if (targetColumn === PipelineStage.NOT_APPLIED) {
        // Edge case 3: Revert to not-applied
        mutation = applicationService.revertToNotApplied(cardId);
      } else {
        // Edge case 4: Free movement between later stages
        mutation = applicationService.updatePipelineStage(
          cardId,
          targetColumn,
        );
      }

      mutation
        .catch(rollback)
        .finally(() => {
          queryClient.invalidateQueries({ queryKey: ["applications"] });
        });
    },
    [applications, queryClient],
  );

  return { sensors, handleDragEnd };
}
