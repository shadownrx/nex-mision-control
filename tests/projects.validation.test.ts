import { describe, expect, it } from "vitest";

import {
  createProjectSchema,
  updateProjectSchema,
} from "@/lib/projects/validation";

describe("project validation boundary", () => {
  it("accepts a valid create payload", () => {
    expect(
      createProjectSchema.parse({ name: "NEX", description: "Mission ctrl" }),
    ).toEqual({ name: "NEX", description: "Mission ctrl" });
  });

  it("defaults a missing description to empty string", () => {
    expect(createProjectSchema.parse({ name: "NEX" })).toEqual({
      name: "NEX",
      description: "",
    });
  });

  it("rejects an empty or blank name", () => {
    expect(() =>
      createProjectSchema.parse({ name: "" }),
    ).toThrow();
    expect(() =>
      createProjectSchema.parse({ name: "   " }),
    ).toThrow();
  });

  it("rejects a missing name", () => {
    expect(() => createProjectSchema.parse({ description: "x" })).toThrow();
  });

  it("rejects an overlong name or description", () => {
    expect(() =>
      createProjectSchema.parse({ name: "n".repeat(201) }),
    ).toThrow();
    expect(() =>
      createProjectSchema.parse({
        name: "NEX",
        description: "d".repeat(2001),
      }),
    ).toThrow();
  });

  it("rejects non-string input", () => {
    expect(() =>
      createProjectSchema.parse({ name: 42, description: null }),
    ).toThrow();
  });

  it("accepts a partial update with at least one field", () => {
    expect(updateProjectSchema.parse({ name: "Renamed" })).toEqual({
      name: "Renamed",
    });
  });

  it("rejects an empty update", () => {
    expect(() => updateProjectSchema.parse({})).toThrow();
  });

  it("rejects invalid fields on update", () => {
    expect(() => updateProjectSchema.parse({ name: "" })).toThrow();
    expect(() =>
      updateProjectSchema.parse({ description: "d".repeat(2001) }),
    ).toThrow();
  });
});
