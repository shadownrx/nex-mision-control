import type {
  ActivityItem,
} from "@/lib/activity/derive";
import type { Decision } from "@/lib/decisions/validation";
import type { Documentation } from "@/lib/docs/validation";
import type { Task } from "@/lib/tasks/validation";

// S2-01: Project Overview is a derived read model, not a persisted entity.
// It is computed per request from existing reads (Project, Tasks, Technical
// Decisions, Documentation, Activity) and owns no storage: no table, no
// migration, no cache row. An Episode groups the currently derivable events
// of one record for presentation; it is never that record's complete history.
export interface OverviewSignals {
  openTasks: number;
  closedTasks: number;
  activeDecisions: number;
  supersededDecisions: number;
  documents: number;
  lastActivity: Date | null;
}

export interface DirectionEntry {
  id: string;
  title: string;
  updatedAt: Date;
}

export interface Episode {
  kind: ActivityItem["kind"];
  id: string;
  title: string;
  createdAt: Date;
  latestEvent: ActivityItem["event"];
  latestAt: Date;
}

export interface SupersessionPair {
  fromId: string;
  fromTitle: string;
  toId: string;
  toTitle: string;
}

export interface ProjectOverview {
  signals: OverviewSignals;
  direction: DirectionEntry[];
  evolution: Episode[];
  supersessions: SupersessionPair[];
}

export interface OverviewInput {
  tasks: Task[];
  decisions: Decision[];
  documents: Documentation[];
  activity: ActivityItem[];
}

// Presentation caps: changing them never touches the domain.
export const DIRECTION_LIMIT = 5;
export const EVOLUTION_LIMIT = 20;

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

// API responses serialize dates as ISO strings while the derivation contract
// is Date-based. The page revives exactly the consumed fields
// (decisions.updatedAt, activity.occurredAt); every other field passes
// through untouched.
export function reviveOverviewInput(input: OverviewInput): OverviewInput {
  return {
    tasks: input.tasks,
    decisions: input.decisions.map((d) => ({
      ...d,
      updatedAt: asDate(d.updatedAt),
    })),
    documents: input.documents,
    activity: input.activity.map((a) => ({
      ...a,
      occurredAt: asDate(a.occurredAt),
    })),
  };
}

function deriveSignals(input: OverviewInput): OverviewSignals {
  let lastActivity: Date | null = null;
  for (const item of input.activity) {
    if (lastActivity === null || item.occurredAt > lastActivity) {
      lastActivity = item.occurredAt;
    }
  }
  return {
    openTasks: input.tasks.filter((t) => t.status === "open").length,
    closedTasks: input.tasks.filter((t) => t.status === "done").length,
    activeDecisions: input.decisions.filter((d) => d.status === "active")
      .length,
    supersededDecisions: input.decisions.filter(
      (d) => d.status === "superseded",
    ).length,
    documents: input.documents.length,
    lastActivity,
  };
}

function deriveDirection(decisions: Decision[]): DirectionEntry[] {
  return decisions
    .filter((d) => d.status === "active")
    .sort(
      (a, b) =>
        b.updatedAt.getTime() - a.updatedAt.getTime() ||
        a.id.localeCompare(b.id),
    )
    .slice(0, DIRECTION_LIMIT)
    .map((d) => ({ id: d.id, title: d.title, updatedAt: d.updatedAt }));
}

function deriveEvolution(activity: ActivityItem[]): Episode[] {
  // Grouped by record identity; the "created" item carries the record's
  // origin and the max timestamp its latest derivable change. Events pass
  // through verbatim — never reinterpreted (a reopen arrives as "updated"
  // from the Activity derivation and stays "updated" here).
  const byRecord = new Map<string, Episode>();
  for (const item of activity) {
    const key = `${item.kind}:${item.id}`;
    const episode = byRecord.get(key);
    if (!episode) {
      byRecord.set(key, {
        kind: item.kind,
        id: item.id,
        title: item.title,
        createdAt: item.occurredAt,
        latestEvent: item.event,
        latestAt: item.occurredAt,
      });
    } else {
      if (item.event === "created") episode.createdAt = item.occurredAt;
      if (item.occurredAt > episode.latestAt) {
        episode.latestEvent = item.event;
        episode.latestAt = item.occurredAt;
        episode.title = item.title;
      }
    }
  }
  // Stable sort keeps feed order on ties, matching the Activity derivation.
  return [...byRecord.values()]
    .sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime())
    .slice(0, EVOLUTION_LIMIT);
}

function deriveSupersessions(decisions: Decision[]): SupersessionPair[] {
  // Pairs resolve through the existing link alone: the repository guarantees
  // the target exists (linked decisions cannot be removed, cascade removes
  // the whole history at once), so no dangling reference can reach here.
  const byId = new Map(decisions.map((d) => [d.id, d]));
  const pairs: SupersessionPair[] = [];
  for (const old of decisions) {
    if (old.supersededBy === null) continue;
    const replacement = byId.get(old.supersededBy);
    if (!replacement) continue;
    pairs.push({
      fromId: old.id,
      fromTitle: old.title,
      toId: replacement.id,
      toTitle: replacement.title,
    });
  }
  return pairs;
}

export function deriveOverview(input: OverviewInput): ProjectOverview {
  return {
    signals: deriveSignals(input),
    direction: deriveDirection(input.decisions),
    evolution: deriveEvolution(input.activity),
    supersessions: deriveSupersessions(input.decisions),
  };
}
