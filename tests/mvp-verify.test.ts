import { beforeEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { db } from "@/db";
import {
  decisions as decisionsTable,
  documentation as docsTable,
  projects as projectsTable,
  tasks as tasksTable,
} from "@/db/schema";
import { getProjectActivity } from "@/lib/activity/derive";
import {
  DecisionImmutableError,
  decisions,
} from "@/lib/decisions/repository";
import { docs } from "@/lib/docs/repository";
import { projects } from "@/lib/projects/repository";
import { tasks } from "@/lib/tasks/repository";

// Ticket 08: full MVP journey in one place — create → use → feed → delete
// without orphans. Locks the integration of Tickets 01–07 at the repository
// + activity-derivation seam (UI/API reach the same seam; api-id edge cases
// are covered per-entity without a DB).
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const COMPLETE_DECISION = {
  title: "Use Drizzle",
  context: "Need typed SQL without an ORM black box.",
  alternatives: "Prisma, raw pg.",
  rationale: "Drizzle keeps SQL visible and migrations explicit.",
};

beforeEach(async () => {
  await db.delete(tasksTable);
  await db.delete(decisionsTable);
  await db.delete(docsTable);
  await db.delete(projectsTable);
});

describe("MVP end-to-end (Ticket 08)", () => {
  it("journeys from project creation to cascade delete with a derived feed", async () => {
    // 1. Create Project.
    const project = await projects.create({
      name: "Journey",
      description: "Full MVP walk.",
    });
    expect(project.name).toBe("Journey");

    // 2. View the Project (detail read), list it, rename it.
    expect((await projects.getById(project.id))?.id).toBe(project.id);
    expect((await projects.list()).map((p) => p.id)).toContain(project.id);
    expect(
      (await projects.update(project.id, { name: "Journey v2" }))?.name,
    ).toBe("Journey v2");

    // 3. Create Task under the Project; invalid input never persists.
    const task = await tasks.create(project.id, { title: "First task" });
    if (!task) throw new Error("setup: task create returned null");
    expect(task.status).toBe("open");
    await expect(tasks.create(project.id, { title: "" })).rejects.toBeInstanceOf(
      ZodError,
    );

    // 4. Move Task open -> done -> open.
    expect(
      (await tasks.update(project.id, task.id, { status: "done" }))?.status,
    ).toBe("done");
    expect(
      (await tasks.update(project.id, task.id, { status: "open" }))?.status,
    ).toBe("open");

    // 5. Edit + delete Task.
    expect(
      (await tasks.update(project.id, task.id, { title: "Renamed" }))?.title,
    ).toBe("Renamed");
    expect(await tasks.remove(project.id, task.id)).not.toBeNull();
    expect(await tasks.getById(project.id, task.id)).toBeNull();

    // 6. Create a complete Technical Decision.
    const first = await decisions.create(project.id, COMPLETE_DECISION);
    if (!first) throw new Error("setup: decision create returned null");
    expect(first.status).toBe("active");

    // 7. An incomplete decision is rejected before persistence.
    await expect(
      decisions.create(project.id, { title: "Half-baked" }),
    ).rejects.toBeInstanceOf(ZodError);
    expect(await decisions.listByProject(project.id)).toHaveLength(1);

    // 8. Edit an active decision.
    await sleep(15);
    expect(
      (await decisions.update(project.id, first.id, { title: "Use Drizzle ORM" }))
        ?.title,
    ).toBe("Use Drizzle ORM");

    // 9. A new decision supersedes the previous one.
    await sleep(15);
    const second = await decisions.create(project.id, {
      ...COMPLETE_DECISION,
      title: "Use raw pg",
      supersedes: first.id,
    });
    if (!second) throw new Error("setup: superseding create returned null");

    // 10. The superseded decision is immutable.
    const superseded = await decisions.getById(project.id, first.id);
    expect(superseded?.status).toBe("superseded");
    await expect(
      decisions.update(project.id, first.id, { title: "Rewrite history" }),
    ).rejects.toBeInstanceOf(DecisionImmutableError);
    await expect(decisions.remove(project.id, first.id)).rejects.toBeInstanceOf(
      DecisionImmutableError,
    );

    // 11. Relations between decisions are visible.
    expect(superseded?.supersededBy).toBe(second.id);

    // 12. Create Documentation under the Project.
    const doc = await docs.create(project.id, {
      title: "Notes",
      body: "Why things are the way they are.",
    });
    if (!doc) throw new Error("setup: doc create returned null");
    // A second document survives until the cascade, so the feed can show it.
    const keeper = await docs.create(project.id, {
      title: "Keeper",
      body: "Still here.",
    });
    if (!keeper) throw new Error("setup: doc create returned null");

    // 13. Edit + delete Documentation.
    expect(
      (await docs.update(project.id, doc.id, { body: "Updated notes." }))?.body,
    ).toBe("Updated notes.");
    expect(await docs.remove(project.id, doc.id)).not.toBeNull();

    // 14. Activity is a derived view of everything above.
    const feed = await getProjectActivity(project.id);
    const kinds = new Set(feed.map((item) => `${item.kind}:${item.event}`));
    expect(kinds.has("project:created")).toBe(true);
    expect(kinds.has("decision:created")).toBe(true);
    expect(kinds.has("decision:superseded")).toBe(true);
    expect(kinds.has("documentation:created")).toBe(true);
    // Reverse-chronological order.
    const times = feed.map((item) => item.occurredAt.getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);

    // 15. Activity is read-only: no write path exists. Locked statically by
    // tests/activity.nostorage.test.ts (no activity table; the derive module
    // exposes only getProjectActivity); here the feed is only ever read.

    // 16. Entity changes surface in the derived feed.
    await sleep(15);
    const liveTask = await tasks.create(project.id, { title: "Live" });
    if (!liveTask) throw new Error("setup: task create returned null");
    await sleep(15);
    await tasks.update(project.id, liveTask.id, { title: "Live v2" });
    const refreshed = await getProjectActivity(project.id);
    const liveEvents = new Set(
      refreshed
        .filter((item) => item.kind === "task" && item.id === liveTask.id)
        .map((item) => item.event),
    );
    expect(liveEvents.has("created")).toBe(true);
    expect(liveEvents.has("updated")).toBe(true);

    // 17. Delete the Project.
    expect(await projects.remove(project.id)).not.toBeNull();

    // 18. Tasks, Decisions, and Documentation go with it (cascade).
    expect(await projects.getById(project.id)).toBeNull();
    expect(await tasks.getById(project.id, liveTask.id)).toBeNull();
    expect(await decisions.getById(project.id, second.id)).toBeNull();
    expect(await docs.listByProject(project.id)).toEqual([]);

    // 19. No orphans remain in any child table.
    expect(await db.select().from(tasksTable)).toEqual([]);
    expect(await db.select().from(decisionsTable)).toEqual([]);
    expect(await db.select().from(docsTable)).toEqual([]);

    // 20. Activity vanishes with the project (nothing left to derive from).
    expect(await getProjectActivity(project.id)).toEqual([]);
  });
});
