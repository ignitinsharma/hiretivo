import { TrackerKanbanBoard } from "@/modules/seeker/tracker/components/TrackerKanbanBoard";

/*
 * TrackerPage
 * Server shell for the application tracker kanban (Section F, canonical
 * /dashboard/tracker route). All data-fetching + drag/drop lives client-side
 * in TrackerKanbanBoard (own header row, so this shell has no page title).
 */
export default function TrackerPage() {
  return <TrackerKanbanBoard />;
}
