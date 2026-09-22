import { beforeEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { db } from "@/db";
import { documentation as docsTable, projects as projectsTable } from "@/db/schema";
import { docs } from "@/lib/docs/repository";
import { projects } from "@/lib/projects/repository";

const MISSING = "00000000-0000-0000-0000-000000000000";

let projectId: string;

async function mustCreate(projectId: string, input: unknown) {
  const created = await docs.create(projectId, input);
  if (!created) throw new Error("setup: docs create returned null");
  return created;
}

beforeEach(async () => {
  await db.delete(docsTable);
  await db.delete(projectsTable);
  projectId = (await projects.create({ name: "P", description: "" })).id;
});

describe("documentation repository", () => {
  it("creates and reads back a document", async () => {
    const created = await mustCreate(projectId, {
      title: "Setup",
      body: "Run compose.",
    });
    expect(created).toMatchObject({
      projectId,
      title: "Setup",
      body: "Run compose.",
    });
    expect(await docs.getById(projectId, created.id)).toMatchObject({
      id: created.id,
      title: "Setup",
    });
  });

  it("lists documents scoped to their project", async () => {
    const other = (await projects.create({ name: "Q", description: "" })).id;
    await mustCreate(projectId, { title: "Mine", body: "B" });
    await mustCreate(other, { title: "Theirs", body: "B" });
    expect((await docs.listByProject(projectId)).map((d) => d.title)).toEqual([
      "Mine",
    ]);
  });

  it("edits title and body and removes a document", async () => {
    const created = await mustCreate(projectId, {
      title: "Old",
      body: "Old body.",
    });
    expect(
      (await docs.update(projectId, created.id, { title: "New" }))?.title,
    ).toBe("New");
    expect(
      (await docs.update(projectId, created.id, { body: "New body." }))?.body,
    ).toBe("New body.");
    await docs.remove(projectId, created.id);
    expect(await docs.getById(projectId, created.id)).toBeNull();
  });

  it("rejects a document without a project: nothing is stored", async () => {
    await expect(
      docs.create(MISSING, { title: "Orphan", body: "B" }),
    ).resolves.toBeNull();
    expect(await docs.listByProject(MISSING)).toEqual([]);
  });

  it("rejects invalid input before touching persistence", async () => {
    await expect(
      docs.create(projectId, { title: "T" }),
    ).rejects.toBeInstanceOf(ZodError);
    await expect(
      docs.create(projectId, { title: "T", body: "  " }),
    ).rejects.toBeInstanceOf(ZodError);
    expect(await docs.listByProject(projectId)).toEqual([]);
  });

  it("keeps documents inside their own project", async () => {
    const other = (await projects.create({ name: "Q", description: "" })).id;
    const created = await mustCreate(projectId, { title: "Mine", body: "B" });
    expect(await docs.getById(other, created.id)).toBeNull();
    expect(await docs.update(other, created.id, { title: "Hijack" })).toBeNull();
    expect(await docs.remove(other, created.id)).toBeNull();
    expect(await docs.getById(projectId, created.id)).toMatchObject({
      title: "Mine",
    });
  });

  it("returns null for unknown document ids", async () => {
    expect(await docs.getById(projectId, MISSING)).toBeNull();
    expect(await docs.update(projectId, MISSING, { title: "x" })).toBeNull();
    expect(await docs.remove(projectId, MISSING)).toBeNull();
  });
});
