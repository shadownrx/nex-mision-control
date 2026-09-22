import { beforeEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { db } from "@/db";
import {
  decisions as decisionsTable,
  projects as projectsTable,
} from "@/db/schema";
import { DecisionImmutableError, decisions } from "@/lib/decisions/repository";
import { projects } from "@/lib/projects/repository";

const MISSING = "00000000-0000-0000-0000-000000000000";

const COMPLETE = {
  title: "Use PostgreSQL",
  context: "Need relational data.",
  alternatives: "SQLite, MySQL.",
  rationale: "Fits Docker local-first.",
};

let projectId: string;

async function mustCreate(projectId: string, input: unknown) {
  const created = await decisions.create(projectId, input);
  if (!created) throw new Error("setup: decision create returned null");
  return created;
}

beforeEach(async () => {
  await db.delete(decisionsTable);
  await db.delete(projectsTable);
  projectId = (await projects.create({ name: "P", description: "" })).id;
});

describe("decision repository", () => {
  it("records and reads back a complete active decision", async () => {
    const created = await mustCreate(projectId, COMPLETE);
    expect(created).toMatchObject({
      projectId,
      ...COMPLETE,
      status: "active",
      supersededBy: null,
    });
    expect(await decisions.getById(projectId, created.id)).toMatchObject({
      id: created.id,
      title: COMPLETE.title,
    });
  });

  it("lists decisions scoped to their project", async () => {
    const other = (await projects.create({ name: "Q", description: "" })).id;
    await mustCreate(projectId, COMPLETE);
    await mustCreate(other, { ...COMPLETE, title: "Other" });
    expect(
      (await decisions.listByProject(projectId)).map((d) => d.title),
    ).toEqual(["Use PostgreSQL"]);
  });

  it("supersedes an active decision with a link to the replacement", async () => {
    const old = await mustCreate(projectId, COMPLETE);
    const replacement = await mustCreate(projectId, {
      ...COMPLETE,
      title: "Use SQLite",
      supersedes: old.id,
    });
    expect(replacement.status).toBe("active");
    expect(await decisions.getById(projectId, old.id)).toMatchObject({
      status: "superseded",
      supersededBy: replacement.id,
    });
  });

  it("refuses to supersede a missing, foreign, or already-superseded decision", async () => {
    const other = (await projects.create({ name: "Q", description: "" })).id;
    const foreign = await mustCreate(other, COMPLETE);
    const old = await mustCreate(projectId, COMPLETE);
    await mustCreate(projectId, {
      ...COMPLETE,
      title: "V2",
      supersedes: old.id,
    });

    await expect(
      decisions.create(projectId, { ...COMPLETE, supersedes: MISSING }),
    ).resolves.toBeNull();
    await expect(
      decisions.create(projectId, { ...COMPLETE, supersedes: foreign.id }),
    ).resolves.toBeNull();
    await expect(
      decisions.create(projectId, { ...COMPLETE, supersedes: old.id }),
    ).resolves.toBeNull();
    expect(await decisions.listByProject(projectId)).toHaveLength(2);
  });

  it("edits an active decision", async () => {
    const created = await mustCreate(projectId, COMPLETE);
    expect(
      (await decisions.update(projectId, created.id, {
        rationale: "New reasoning",
      }))?.rationale,
    ).toBe("New reasoning");
  });

  it("keeps a superseded decision immutable", async () => {
    const old = await mustCreate(projectId, COMPLETE);
    await mustCreate(projectId, {
      ...COMPLETE,
      title: "V2",
      supersedes: old.id,
    });
    await expect(
      decisions.update(projectId, old.id, { title: "Rewrite" }),
    ).rejects.toBeInstanceOf(DecisionImmutableError);
    await expect(
      decisions.remove(projectId, old.id),
    ).rejects.toBeInstanceOf(DecisionImmutableError);
    expect(await decisions.getById(projectId, old.id)).toMatchObject({
      title: "Use PostgreSQL",
      status: "superseded",
    });
  });

  it("refuses to delete a decision linked by another", async () => {
    const old = await mustCreate(projectId, COMPLETE);
    const replacement = await mustCreate(projectId, {
      ...COMPLETE,
      title: "V2",
      supersedes: old.id,
    });
    await expect(
      decisions.remove(projectId, replacement.id),
    ).rejects.toBeInstanceOf(DecisionImmutableError);
  });

  it("deletes an unlinked active decision", async () => {
    const created = await mustCreate(projectId, COMPLETE);
    await decisions.remove(projectId, created.id);
    expect(await decisions.getById(projectId, created.id)).toBeNull();
  });

  it("rejects a decision without a project: nothing is stored", async () => {
    await expect(decisions.create(MISSING, COMPLETE)).resolves.toBeNull();
    expect(await decisions.listByProject(MISSING)).toEqual([]);
  });

  it("rejects incomplete input before touching persistence", async () => {
    await expect(
      decisions.create(projectId, { title: "Only a title" }),
    ).rejects.toBeInstanceOf(ZodError);
    expect(await decisions.listByProject(projectId)).toEqual([]);
  });

  it("keeps decisions inside their own project", async () => {
    const other = (await projects.create({ name: "Q", description: "" })).id;
    const created = await mustCreate(projectId, COMPLETE);
    expect(await decisions.getById(other, created.id)).toBeNull();
    expect(
      await decisions.update(other, created.id, { title: "Hijack" }),
    ).toBeNull();
    expect(await decisions.remove(other, created.id)).toBeNull();
  });

  it("returns null for unknown decision ids", async () => {
    expect(await decisions.getById(projectId, MISSING)).toBeNull();
    expect(await decisions.update(projectId, MISSING, { title: "x" })).toBeNull();
    expect(await decisions.remove(projectId, MISSING)).toBeNull();
  });
});
