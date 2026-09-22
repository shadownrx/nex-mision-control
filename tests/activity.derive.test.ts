import { beforeEach, describe, expect, it } from "vitest";

import { db } from "@/db";
import {
  decisions as decisionsTable,
  documentation as docsTable,
  projects as projectsTable,
  tasks as tasksTable,
} from "@/db/schema";
import { getProjectActivity } from "@/lib/activity/derive";
import { decisions } from "@/lib/decisions/repository";
import { docs } from "@/lib/docs/repository";
import { projects } from "@/lib/projects/repository";
import { tasks } from "@/lib/tasks/repository";

const COMPLETE_DECISION = {
  title: "Use PG",
  context: "Need relations.",
  alternatives: "SQLite.",
  rationale: "Fits local-first.",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

beforeEach(async () => {
  await db.delete(tasksTable);
  await db.delete(decisionsTable);
  await db.delete(docsTable);
  await db.delete(projectsTable);
});

describe("derived activity", () => {
  it("shows creations in reverse-chronological order", async () => {
    const project = await projects.create({ name: "P", description: "" });
    await sleep(15);
    await tasks.create(project.id, { title: "T" });
    await sleep(15);
    await docs.create(project.id, { title: "Doc", body: "B" });

    const feed = await getProjectActivity(project.id);
    expect(feed.map((i) => i.event)).toEqual([
      "created",
      "created",
      "created",
    ]);
    expect(feed.map((i) => i.kind)).toEqual([
      "documentation",
      "task",
      "project",
    ]);
    const times = feed.map((i) => i.occurredAt.getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  it("shows updates, state changes, and supersessions", async () => {
    const project = await projects.create({ name: "P", description: "" });
    const task = await tasks.create(project.id, { title: "T" });
    const decision = await decisions.create(project.id, COMPLETE_DECISION);
    if (!task || !decision) throw new Error("setup failed");
    await sleep(15);
    await tasks.update(project.id, task.id, { status: "done" });
    await decisions.create(project.id, {
      ...COMPLETE_DECISION,
      title: "V2",
      supersedes: decision.id,
    });

    const feed = await getProjectActivity(project.id);
    const byKindEvent = feed.map((i) => `${i.kind}:${i.event}`);
    expect(byKindEvent).toContain("task:status-changed");
    expect(byKindEvent).toContain("decision:superseded");
    expect(byKindEvent).toContain("decision:created");
    // The superseding decision links back to the one it replaced.
    const replacement = feed.find(
      (i) => i.kind === "decision" && i.event === "created" && i.title === "V2",
    );
    expect(replacement).toBeDefined();
  });

  it("drops deleted items with no trace and no infrastructure", async () => {
    const project = await projects.create({ name: "P", description: "" });
    const task = await tasks.create(project.id, { title: "T" });
    if (!task) throw new Error("setup failed");
    expect(
      (await getProjectActivity(project.id)).some((i) => i.id === task.id),
    ).toBe(true);

    await tasks.remove(project.id, task.id);
    expect(
      (await getProjectActivity(project.id)).some((i) => i.id === task.id),
    ).toBe(false);
  });

  it("returns an empty feed for a deleted project (Ticket 06 assertion)", async () => {
    const project = await projects.create({ name: "P", description: "" });
    await tasks.create(project.id, { title: "T" });
    await decisions.create(project.id, COMPLETE_DECISION);
    await docs.create(project.id, { title: "Doc", body: "B" });
    expect((await getProjectActivity(project.id)).length).toBeGreaterThan(0);

    await projects.remove(project.id);
    expect(await getProjectActivity(project.id)).toEqual([]);
  });

  it("returns an empty feed for an unknown project", async () => {
    expect(
      await getProjectActivity("00000000-0000-0000-0000-000000000000"),
    ).toEqual([]);
  });
});
