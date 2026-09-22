import { describe, expect, it } from "vitest";

import type { ActivityItem } from "@/lib/activity/derive";
import type { Decision } from "@/lib/decisions/validation";
import type { Documentation } from "@/lib/docs/validation";
import { deriveOverview, reviveOverviewInput } from "@/lib/overview/derive";
import type { Task } from "@/lib/tasks/validation";

// S2-01: pure derivation, fixtures only, no database. Every expectation pins
// the approved spec; the derivation must never reinterpret what the existing
// Activity derivation emits (e.g. reopen arrives as "updated" — that is what
// the episode must carry).

const DAY = 24 * 60 * 60 * 1000;
const T0 = new Date("2026-01-01T00:00:00Z").getTime();
const at = (days: number) => new Date(T0 + days * DAY);

function task(partial: Partial<Task> & { id: string }): Task {
  return {
    projectId: "p1",
    title: "T",
    status: "open",
    createdAt: at(0),
    updatedAt: at(0),
    ...partial,
  };
}

function decision(partial: Partial<Decision> & { id: string }): Decision {
  return {
    projectId: "p1",
    title: "D",
    context: "C",
    alternatives: "A",
    rationale: "R",
    status: "active",
    supersededBy: null,
    createdAt: at(0),
    updatedAt: at(0),
    ...partial,
  };
}

function doc(partial: Partial<Documentation> & { id: string }): Documentation {
  return {
    projectId: "p1",
    title: "Doc",
    body: "B",
    createdAt: at(0),
    updatedAt: at(0),
    ...partial,
  };
}

function item(partial: Partial<ActivityItem> & { id: string }): ActivityItem {
  return {
    kind: "task",
    projectId: "p1",
    title: "T",
    event: "created",
    occurredAt: at(0),
    ...partial,
  };
}

const EMPTY = { tasks: [], decisions: [], documents: [], activity: [] };

describe("overview signals", () => {
  it("counts tasks, decisions, and documents by status", () => {
    const overview = deriveOverview({
      tasks: [
        task({ id: "t1", status: "open" }),
        task({ id: "t2", status: "open" }),
        task({ id: "t3", status: "done" }),
      ],
      decisions: [
        decision({ id: "d1", status: "active" }),
        decision({ id: "d2", status: "superseded", supersededBy: "d3" }),
        decision({ id: "d3", status: "active" }),
      ],
      documents: [doc({ id: "doc1" }), doc({ id: "doc2" })],
      activity: [],
    });
    expect(overview.signals).toEqual({
      openTasks: 2,
      closedTasks: 1,
      activeDecisions: 2,
      supersededDecisions: 1,
      documents: 2,
      lastActivity: null,
    });
  });

  it("reports lastActivity as the feed maximum, null when the feed is empty", () => {
    const withFeed = deriveOverview({
      ...EMPTY,
      activity: [
        item({ id: "t1", occurredAt: at(2) }),
        item({ id: "t2", occurredAt: at(5) }),
        item({ id: "t3", occurredAt: at(3) }),
      ],
    });
    expect(withFeed.signals.lastActivity).toEqual(at(5));

    const empty = deriveOverview(EMPTY);
    expect(empty.signals.lastActivity).toBeNull();
    expect(empty.direction).toEqual([]);
    expect(empty.evolution).toEqual([]);
    expect(empty.supersessions).toEqual([]);
  });
});

describe("overview direction", () => {
  it("lists only active decisions, most recently updated first", () => {
    const overview = deriveOverview({
      ...EMPTY,
      decisions: [
        decision({ id: "old", status: "active", title: "Old", updatedAt: at(1) }),
        decision({ id: "new", status: "active", title: "New", updatedAt: at(4) }),
        decision({
          id: "gone",
          status: "superseded",
          title: "Gone",
          supersededBy: "new",
          updatedAt: at(9),
        }),
      ],
    });
    expect(overview.direction.map((d) => d.id)).toEqual(["new", "old"]);
    expect(overview.direction[0]).toEqual({
      id: "new",
      title: "New",
      updatedAt: at(4),
    });
  });

  it("caps direction at 5 and reports none active as empty", () => {
    const many = Array.from({ length: 7 }, (_, i) =>
      decision({ id: `d${i}`, title: `D${i}`, updatedAt: at(i) }),
    );
    const capped = deriveOverview({ ...EMPTY, decisions: many });
    expect(capped.direction.map((d) => d.id)).toEqual([
      "d6",
      "d5",
      "d4",
      "d3",
      "d2",
    ]);

    const noneActive = deriveOverview({
      ...EMPTY,
      decisions: [
        decision({ id: "a", status: "superseded", supersededBy: "b" }),
        decision({ id: "b", status: "active", updatedAt: at(1) }),
      ],
    });
    expect(noneActive.direction.map((d) => d.id)).toEqual(["b"]);

    const zeroActive = deriveOverview({
      ...EMPTY,
      decisions: [decision({ id: "a", status: "superseded", supersededBy: "b" })],
    });
    expect(zeroActive.direction).toEqual([]);
  });
});

describe("overview evolution", () => {
  it("groups one record's events into a single episode", () => {
    const overview = deriveOverview({
      ...EMPTY,
      activity: [
        item({ id: "t1", title: "Live", event: "updated", occurredAt: at(3) }),
        item({ id: "t1", title: "Live", event: "created", occurredAt: at(1) }),
        item({ id: "t2", title: "Other", event: "created", occurredAt: at(2) }),
      ],
    });
    expect(overview.evolution).toEqual([
      {
        kind: "task",
        id: "t1",
        title: "Live",
        createdAt: at(1),
        latestEvent: "updated",
        latestAt: at(3),
      },
      {
        kind: "task",
        id: "t2",
        title: "Other",
        createdAt: at(2),
        latestEvent: "created",
        latestAt: at(2),
      },
    ]);
  });

  it("carries a reopen exactly as the existing derivation emits it", () => {
    // The current derivation emits "updated" (not "status-changed") for a
    // task whose status is open — e.g. after done -> open. The episode must
    // preserve that event verbatim, never reinterpret it as "reopened".
    const overview = deriveOverview({
      ...EMPTY,
      activity: [
        item({ id: "t1", event: "updated", occurredAt: at(4) }),
        item({ id: "t1", event: "status-changed", occurredAt: at(2) }),
        item({ id: "t1", event: "created", occurredAt: at(1) }),
      ],
    });
    expect(overview.evolution).toHaveLength(1);
    expect(overview.evolution[0]?.latestEvent).toBe("updated");
    expect(overview.evolution[0]?.latestAt).toEqual(at(4));
    expect(overview.evolution[0]?.createdAt).toEqual(at(1));
  });

  it("caps evolution at 20, most recently changed first", () => {
    const activity = Array.from({ length: 25 }, (_, i) =>
      item({ id: `t${i}`, title: `T${i}`, occurredAt: at(i) }),
    );
    const overview = deriveOverview({ ...EMPTY, activity });
    expect(overview.evolution).toHaveLength(20);
    expect(overview.evolution[0]?.id).toBe("t24");
    expect(overview.evolution[19]?.id).toBe("t5");
  });
});

describe("overview supersession", () => {
  it("represents a simple supersession as old -> new", () => {
    const overview = deriveOverview({
      ...EMPTY,
      decisions: [
        decision({ id: "a", title: "Old", status: "superseded", supersededBy: "b" }),
        decision({ id: "b", title: "New", status: "active", updatedAt: at(2) }),
      ],
    });
    expect(overview.supersessions).toEqual([
      { fromId: "a", fromTitle: "Old", toId: "b", toTitle: "New" },
    ]);
    expect(overview.direction.map((d) => d.id)).toEqual(["b"]);
  });

  it("skips pairs whose replacement is absent from the input", () => {
    const overview = deriveOverview({
      ...EMPTY,
      decisions: [
        decision({ id: "a", title: "Old", status: "superseded", supersededBy: "b" }),
      ],
    });
    expect(overview.supersessions).toEqual([]);
  });

  it("expands a chain A -> B -> C into two pairs, direction shows only C", () => {
    const overview = deriveOverview({
      ...EMPTY,
      decisions: [
        decision({ id: "a", title: "A", status: "superseded", supersededBy: "b" }),
        decision({ id: "b", title: "B", status: "superseded", supersededBy: "c" }),
        decision({ id: "c", title: "C", status: "active", updatedAt: at(3) }),
      ],
    });
    expect(overview.supersessions).toEqual([
      { fromId: "a", fromTitle: "A", toId: "b", toTitle: "B" },
      { fromId: "b", fromTitle: "B", toId: "c", toTitle: "C" },
    ]);
    expect(overview.direction.map((d) => d.id)).toEqual(["c"]);
  });
});

describe("home signals share overview semantics", () => {
  // S2-04: the home computes per-project signals through the same
  // deriveOverview with empty decisions/documents (those fields do not feed
  // openTasks/lastActivity). These tests lock that the partial-input path
  // yields exactly the full-overview values — one semantics, no fork.
  const full = {
    tasks: [
      task({ id: "t1", status: "open" }),
      task({ id: "t2", status: "done" }),
    ],
    decisions: [decision({ id: "d1", status: "active", updatedAt: at(4) })],
    documents: [doc({ id: "doc1" })],
    activity: [
      item({ id: "t1", occurredAt: at(2) }),
      item({ id: "d1", kind: "decision" as const, occurredAt: at(5) }),
    ],
  };

  it("reports the correct open-task count through the home path", () => {
    const home = deriveOverview({ ...full, decisions: [], documents: [] });
    expect(home.signals.openTasks).toBe(1);
    expect(home.signals.openTasks).toBe(
      deriveOverview(full).signals.openTasks,
    );
  });

  it("reports zero when nothing is open", () => {
    const home = deriveOverview({
      ...EMPTY,
      tasks: [task({ id: "t1", status: "done" })],
    });
    expect(home.signals.openTasks).toBe(0);
  });

  it("reports the derived lastActivity through the home path", () => {
    const home = deriveOverview({ ...full, decisions: [], documents: [] });
    expect(home.signals.lastActivity).toEqual(at(5));
    expect(home.signals.lastActivity).toEqual(
      deriveOverview(full).signals.lastActivity,
    );
  });

  it("reports null (absence) when there is no derivable activity", () => {
    const home = deriveOverview({ ...EMPTY });
    expect(home.signals.lastActivity).toBeNull();
  });
});

describe("overview edge cases", () => {
  it("renders a brand-new project as an honest zero shape", () => {
    expect(deriveOverview(EMPTY)).toEqual({
      signals: {
        openTasks: 0,
        closedTasks: 0,
        activeDecisions: 0,
        supersededDecisions: 0,
        documents: 0,
        lastActivity: null,
      },
      direction: [],
      evolution: [],
      supersessions: [],
    });
  });

  it("keeps counts with null lastActivity when children exist but no activity", () => {
    const overview = deriveOverview({
      tasks: [task({ id: "t1", status: "open" })],
      decisions: [decision({ id: "d1", status: "active" })],
      documents: [doc({ id: "doc1" })],
      activity: [],
    });
    expect(overview.signals.openTasks).toBe(1);
    expect(overview.signals.activeDecisions).toBe(1);
    expect(overview.signals.documents).toBe(1);
    expect(overview.signals.lastActivity).toBeNull();
    expect(overview.evolution).toEqual([]);
  });

  it("converges deleted records to the new-project shape, preserving nothing", () => {
    // Whatever the history was, empty reads yield the zero shape: no pairs,
    // no episodes, no residual counts. Deletion leaves no trace by design.
    expect(deriveOverview(EMPTY)).toEqual(deriveOverview({ ...EMPTY }));
    expect(deriveOverview(EMPTY).supersessions).toEqual([]);
  });

  it("shows empty direction with visible pairs when no decision is active", () => {
    // A complete set always carries a live head by repository invariant, so
    // this pins totality over partial/legacy reads: no actives in input,
    // yet the resolvable pair stays visible and nothing crashes.
    const overview = deriveOverview({
      ...EMPTY,
      decisions: [
        decision({ id: "a", title: "Old", status: "superseded", supersededBy: "b" }),
        decision({ id: "b", title: "New", status: "superseded", supersededBy: "c" }),
      ],
    });
    expect(overview.direction).toEqual([]);
    expect(overview.signals.activeDecisions).toBe(0);
    expect(overview.signals.supersededDecisions).toBe(2);
    expect(overview.supersessions.map((p) => [p.fromId, p.toId])).toEqual([
      ["a", "b"],
    ]);
  });

  it("caps direction while the count proves the rest still exist", () => {
    const decisions = Array.from({ length: 6 }, (_, i) =>
      decision({ id: `d${i}`, title: `D${i}`, updatedAt: at(i) }),
    );
    const overview = deriveOverview({ ...EMPTY, decisions });
    expect(overview.direction).toHaveLength(5);
    expect(overview.signals.activeDecisions).toBe(6);
  });
});

describe("overview wire input", () => {
  it("revives wire dates so API JSON feeds the derivation", () => {
    // API responses serialize dates as ISO strings; the derivation contract
    // is Date-based, so the page revives exactly the consumed fields.
    const wire = {
      tasks: [task({ id: "t1", status: "open" })],
      decisions: [
        {
          ...decision({ id: "d1", title: "New", updatedAt: at(4) }),
          updatedAt: at(4).toISOString() as unknown as Date,
        },
      ],
      documents: [],
      activity: [
        {
          ...item({ id: "t1", occurredAt: at(3) }),
          occurredAt: at(3).toISOString() as unknown as Date,
        },
      ],
    };
    const overview = deriveOverview(reviveOverviewInput(wire));
    expect(overview.signals.openTasks).toBe(1);
    expect(overview.signals.lastActivity).toEqual(at(3));
    expect(overview.direction.map((d) => d.id)).toEqual(["d1"]);
    expect(overview.evolution[0]?.latestAt).toEqual(at(3));
  });

  it("passes Date instances through untouched", () => {
    const input = {
      ...EMPTY,
      decisions: [decision({ id: "d1", updatedAt: at(2) })],
      activity: [item({ id: "d1", kind: "decision" as const, occurredAt: at(2) })],
    };
    const overview = deriveOverview(reviveOverviewInput(input));
    expect(overview.signals.lastActivity).toEqual(at(2));
    expect(overview.direction[0]?.updatedAt).toEqual(at(2));
  });
});
