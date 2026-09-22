import type { ActivityKind } from "@/lib/activity/derive";

// S2-03: every entity lives rendered on the existing project route, so
// cross-navigation targets in-page fragments derived from data that already
// exists (kind + id). No new routes, no persisted relations.
export function entityAnchor(kind: ActivityKind, id: string): string {
  if (kind === "project") return "#project";
  if (kind === "task") return `#task-${id}`;
  if (kind === "decision") return `#decision-${id}`;
  return `#doc-${id}`;
}
