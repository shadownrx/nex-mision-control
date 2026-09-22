import { beforeEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { db } from "@/db";
import { projects as projectsTable } from "@/db/schema";
import { projects } from "@/lib/projects/repository";

beforeEach(async () => {
  await db.delete(projectsTable);
});

describe("project repository", () => {
  it("creates and reads back a project", async () => {
    const created = await projects.create({
      name: "NEX",
      description: "Mission ctrl",
    });
    expect(created.id).toBeTypeOf("string");
    expect(created.name).toBe("NEX");

    const found = await projects.getById(created.id);
    expect(found).toMatchObject({ id: created.id, name: "NEX" });
  });

  it("lists created projects", async () => {
    await projects.create({ name: "A", description: "" });
    await projects.create({ name: "B", description: "" });
    const all = await projects.list();
    expect(all.map((p) => p.name).sort()).toEqual(["A", "B"]);
  });

  it("updates name and description", async () => {
    const created = await projects.create({ name: "Old", description: "" });
    const updated = await projects.update(created.id, {
      name: "New",
      description: "Docs",
    });
    expect(updated).toMatchObject({ id: created.id, name: "New" });
    expect(await projects.getById(created.id)).toMatchObject({ name: "New" });
  });

  it("removes a project", async () => {
    const created = await projects.create({ name: "Gone", description: "" });
    await projects.remove(created.id);
    expect(await projects.getById(created.id)).toBeNull();
  });

  it("returns null for unknown ids", async () => {
    const missing = "00000000-0000-0000-0000-000000000000";
    expect(await projects.getById(missing)).toBeNull();
    expect(await projects.update(missing, { name: "x" })).toBeNull();
    expect(await projects.remove(missing)).toBeNull();
  });

  it("rejects invalid input before touching persistence", async () => {
    const before = await projects.list();
    await expect(projects.create({ name: "   " })).rejects.toBeInstanceOf(
      ZodError,
    );
    await expect(projects.create({ name: 42 })).rejects.toBeInstanceOf(
      ZodError,
    );
    expect(await projects.list()).toHaveLength(before.length);
  });

  it("rejects invalid input on update", async () => {
    const created = await projects.create({ name: "Keep", description: "" });
    await expect(projects.update(created.id, { name: "" })).rejects.toBeInstanceOf(
      ZodError,
    );
    expect(await projects.getById(created.id)).toMatchObject({ name: "Keep" });
  });
});
