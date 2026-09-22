import { describe, expect, it } from "vitest";

import {
  createDecisionSchema,
  updateDecisionSchema,
} from "@/lib/decisions/validation";

const COMPLETE = {
  title: "Use PostgreSQL",
  context: "Need relational data for projects and children.",
  alternatives: "SQLite, MySQL.",
  rationale: "Postgres fits Docker local-first and Drizzle.",
};

describe("decision validation boundary", () => {
  it("accepts a complete record", () => {
    expect(createDecisionSchema.parse(COMPLETE)).toEqual(COMPLETE);
  });

  it("accepts a create that supersedes an earlier decision", () => {
    const id = "123e4567-e89b-12d3-a456-426614174000";
    expect(
      createDecisionSchema.parse({ ...COMPLETE, supersedes: id }),
    ).toEqual({ ...COMPLETE, supersedes: id });
  });

  it("rejects an incomplete record", () => {
    expect(() =>
      createDecisionSchema.parse({ title: "T", context: "C" }),
    ).toThrow();
    expect(() =>
      createDecisionSchema.parse({
        title: "T",
        context: "C",
        alternatives: "A",
        rationale: "   ",
      }),
    ).toThrow();
  });

  it("rejects blank or overlong fields", () => {
    expect(() =>
      createDecisionSchema.parse({ ...COMPLETE, title: "" }),
    ).toThrow();
    expect(() =>
      createDecisionSchema.parse({ ...COMPLETE, title: "t".repeat(201) }),
    ).toThrow();
    expect(() =>
      createDecisionSchema.parse({ ...COMPLETE, context: "c".repeat(5001) }),
    ).toThrow();
  });

  it("rejects a status on create (records start active)", () => {
    expect(() =>
      createDecisionSchema.parse({ ...COMPLETE, status: "done" }),
    ).toThrow();
  });

  it("rejects a malformed supersedes id", () => {
    expect(() =>
      createDecisionSchema.parse({ ...COMPLETE, supersedes: "nope" }),
    ).toThrow();
  });

  it("accepts a partial update with at least one field", () => {
    expect(updateDecisionSchema.parse({ rationale: "New reasoning" })).toEqual(
      { rationale: "New reasoning" },
    );
  });

  it("rejects an empty update, unknown keys, and status edits", () => {
    expect(() => updateDecisionSchema.parse({})).toThrow();
    expect(() =>
      updateDecisionSchema.parse({ title: "T", status: "active" }),
    ).toThrow();
    expect(() =>
      updateDecisionSchema.parse({ title: "T", supersedes: "x" }),
    ).toThrow();
  });
});
