import { beforeEach, describe, expect, it } from "vitest";

import { db } from "@/db";
import {
  decisions as decisionsTable,
  documentation as docsTable,
  projects as projectsTable,
  tasks as tasksTable,
} from "@/db/schema";
import { decisions } from "@/lib/decisions/repository";
import { docs } from "@/lib/docs/repository";
import { projects } from "@/lib/projects/repository";
import { tasks } from "@/lib/tasks/repository";

async function mustCreateProject() {
  return projects.create({ name: "P", description: "" });
}

beforeEach(async () => {
  await db.delete(tasksTable);
  await db.delete(decisionsTable);
  await db.delete(docsTable);
  await db.delete(projectsTable);
});

describe("project cascade delete", () => {
  it("removes tasks, decisions, and documentation with the project", async () => {
    const project = await mustCreateProject();
    const task = await tasks.create(project.id, { title: "T" });
    const decision = await decisions.create(project.id, {
      title: "D",
      context: "C",
      alternatives: "A",
      rationale: "R",
    });
    const doc = await docs.create(project.id, { title: "Doc", body: "B" });
    if (!task || !decision || !doc) throw new Error("setup failed");

    // Even linked history dies with the project: wholesale delete.
    const replacement = await decisions.create(project.id, {
      title: "D2",
      context: "C",
      alternatives: "A",
      rationale: "R",
      supersedes: decision.id,
    });
    if (!replacement) throw new Error("setup failed");

    await projects.remove(project.id);

    expect(await projects.getById(project.id)).toBeNull();
    expect(await tasks.getById(project.id, task.id)).toBeNull();
    expect(await decisions.getById(project.id, decision.id)).toBeNull();
    expect(await decisions.getById(project.id, replacement.id)).toBeNull();
    expect(await docs.getById(project.id, doc.id)).toBeNull();
  });

  it("leaves zero orphan rows in every child table", async () => {
    const project = await mustCreateProject();
    await tasks.create(project.id, { title: "T" });
    await decisions.create(project.id, {
      title: "D",
      context: "C",
      alternatives: "A",
      rationale: "R",
    });
    await docs.create(project.id, { title: "Doc", body: "B" });

    await projects.remove(project.id);

    // The only project is gone: any remaining child row would be an orphan.
    expect(await db.select().from(tasksTable)).toEqual([]);
    expect(await db.select().from(decisionsTable)).toEqual([]);
    expect(await db.select().from(docsTable)).toEqual([]);
    expect(await db.select().from(projectsTable)).toEqual([]);
  });
});
