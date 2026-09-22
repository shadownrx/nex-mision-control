import { decisions } from "@/lib/decisions/repository";
import { docs } from "@/lib/docs/repository";
import { projects } from "@/lib/projects/repository";
import { tasks } from "@/lib/tasks/repository";

// Seam 3: Activity is a read model derived live from the stored entities. It
// reads through the repositories and owns no storage — there is no write
// path, no table, no log. Deleted content simply stops appearing.
export type ActivityEvent =
  | "created"
  | "updated"
  | "status-changed"
  | "superseded";

export type ActivityKind =
  | "project"
  | "task"
  | "decision"
  | "documentation";

export interface ActivityItem {
  kind: ActivityKind;
  id: string;
  projectId: string;
  title: string;
  event: ActivityEvent;
  occurredAt: Date;
}

function touched(createdAt: Date, updatedAt: Date): boolean {
  return updatedAt.getTime() > createdAt.getTime();
}

type RecordBase = Omit<ActivityItem, "event" | "occurredAt">;

// Every stored record contributes its creation plus at most one later event:
// only the current state is derivable, never intermediate history.
function pushRecord(
  items: ActivityItem[],
  base: RecordBase,
  createdAt: Date,
  updatedAt: Date,
  changedEvent: ActivityEvent,
) {
  items.push({ ...base, event: "created", occurredAt: createdAt });
  if (touched(createdAt, updatedAt)) {
    items.push({ ...base, event: changedEvent, occurredAt: updatedAt });
  }
}

export async function getProjectActivity(
  projectId: string,
): Promise<ActivityItem[]> {
  const project = await projects.getById(projectId);
  if (!project) return [];

  const [projectTasks, projectDecisions, projectDocs] = await Promise.all([
    tasks.listByProject(projectId),
    decisions.listByProject(projectId),
    docs.listByProject(projectId),
  ]);

  const items: ActivityItem[] = [];
  pushRecord(
    items,
    { kind: "project", id: project.id, projectId, title: project.name },
    project.createdAt,
    project.updatedAt,
    "updated",
  );

  for (const task of projectTasks) {
    pushRecord(
      items,
      { kind: "task", id: task.id, projectId, title: task.title },
      task.createdAt,
      task.updatedAt,
      task.status === "done" ? "status-changed" : "updated",
    );
  }

  for (const decision of projectDecisions) {
    pushRecord(
      items,
      {
        kind: "decision",
        id: decision.id,
        projectId,
        title: decision.title,
      },
      decision.createdAt,
      decision.updatedAt,
      decision.status === "superseded" ? "superseded" : "updated",
    );
  }

  for (const doc of projectDocs) {
    pushRecord(
      items,
      {
        kind: "documentation",
        id: doc.id,
        projectId,
        title: doc.title,
      },
      doc.createdAt,
      doc.updatedAt,
      "updated",
    );
  }

  // Reverse-chronological; id breaks ties deterministically.
  items.sort(
    (a, b) =>
      b.occurredAt.getTime() - a.occurredAt.getTime() ||
      a.id.localeCompare(b.id),
  );
  return items;
}
