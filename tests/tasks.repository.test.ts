import { beforeEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { db } from "@/db";
import { projects as projectsTable, tasks as tasksTable } from "@/db/schema";
import { projects } from "@/lib/projects/repository";
import { tasks } from "@/lib/tasks/repository";

const MISSING = "00000000-0000-0000-0000-000000000000";

let projectId: string;

async function mustCreate(projectId: string, input: { title: string }) {
  const created = await tasks.create(projectId, input);
  if (!created) throw new Error("setup: task create returned null");
  return created;
}

beforeEach(async () => {
  await db.delete(tasksTable);
  await db.delete(projectsTable);
  projectId = (
    await projects.create({ name: "P", description: "" })
  ).id;
});

describe("task repository", () => {
  it("creates and reads back a task as open", async () => {
    const created = await mustCreate(projectId, { title: "Write tests" });
    expect(created).toMatchObject({
      projectId,
      title: "Write tests",
      status: "open",
    });

    const found = await tasks.getById(projectId, created.id);
    expect(found).toMatchObject({ id: created.id, title: "Write tests" });
  });

  it("lists tasks scoped to their project", async () => {
    const other = (await projects.create({ name: "Q", description: "" })).id;
    await tasks.create(projectId, { title: "Mine" });
    await tasks.create(other, { title: "Theirs" });
    expect((await tasks.listByProject(projectId)).map((t) => t.title)).toEqual([
      "Mine",
    ]);
  });

  it("changes status open/done in either direction", async () => {
    const created = await mustCreate(projectId, { title: "T" });
    expect(
      (await tasks.update(projectId, created.id, { status: "done" }))?.status,
    ).toBe("done");
    expect(
      (await tasks.update(projectId, created.id, { status: "open" }))?.status,
    ).toBe("open");
  });

  it("edits a title and removes a task", async () => {
    const created = await mustCreate(projectId, { title: "Old" });
    expect(
      (await tasks.update(projectId, created.id, { title: "New" }))?.title,
    ).toBe("New");
    await tasks.remove(projectId, created.id);
    expect(await tasks.getById(projectId, created.id)).toBeNull();
  });

  it("rejects a task without a project: nothing is stored", async () => {
    await expect(
      tasks.create(MISSING, { title: "Orphan" }),
    ).resolves.toBeNull();
    expect(await tasks.listByProject(MISSING)).toEqual([]);
  });

  it("rejects invalid input before touching persistence", async () => {
    await expect(tasks.create(projectId, { title: "  " })).rejects.toBeInstanceOf(
      ZodError,
    );
    await expect(
      tasks.create(projectId, { title: "T", status: "done" }),
    ).rejects.toBeInstanceOf(ZodError);
    expect(await tasks.listByProject(projectId)).toEqual([]);
  });

  it("keeps tasks inside their own project", async () => {
    const other = (await projects.create({ name: "Q", description: "" })).id;
    const created = await mustCreate(projectId, { title: "Mine" });
    const taskId = created.id;
    expect(await tasks.getById(other, taskId)).toBeNull();
    expect(
      await tasks.update(other, taskId, { title: "Hijack" }),
    ).toBeNull();
    expect(await tasks.remove(other, taskId)).toBeNull();
    expect(await tasks.getById(projectId, taskId)).toMatchObject({
      title: "Mine",
    });
  });

  it("returns null for unknown task ids", async () => {
    expect(await tasks.getById(projectId, MISSING)).toBeNull();
    expect(await tasks.update(projectId, MISSING, { title: "x" })).toBeNull();
    expect(await tasks.remove(projectId, MISSING)).toBeNull();
  });
});
