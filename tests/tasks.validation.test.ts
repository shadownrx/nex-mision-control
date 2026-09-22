import { describe, expect, it } from "vitest";

import {
  createTaskSchema,
  updateTaskSchema,
} from "@/lib/tasks/validation";

describe("task validation boundary", () => {
  it("accepts a valid create payload", () => {
    expect(createTaskSchema.parse({ title: "Write tests" })).toEqual({
      title: "Write tests",
    });
  });

  it("rejects an empty or blank title", () => {
    expect(() => createTaskSchema.parse({ title: "" })).toThrow();
    expect(() => createTaskSchema.parse({ title: "   " })).toThrow();
  });

  it("rejects a missing title", () => {
    expect(() => createTaskSchema.parse({})).toThrow();
  });

  it("rejects an overlong title", () => {
    expect(() =>
      createTaskSchema.parse({ title: "t".repeat(201) }),
    ).toThrow();
  });

  it("rejects a status on create (new tasks are always open)", () => {
    expect(() =>
      createTaskSchema.parse({ title: "T", status: "done" }),
    ).toThrow();
  });

  it("rejects non-string input", () => {
    expect(() => createTaskSchema.parse({ title: 42 })).toThrow();
  });

  it("accepts a title update", () => {
    expect(updateTaskSchema.parse({ title: "Renamed" })).toEqual({
      title: "Renamed",
    });
  });

  it("accepts a status transition in either direction", () => {
    expect(updateTaskSchema.parse({ status: "done" })).toEqual({
      status: "done",
    });
    expect(updateTaskSchema.parse({ status: "open" })).toEqual({
      status: "open",
    });
  });

  it("rejects an empty update", () => {
    expect(() => updateTaskSchema.parse({})).toThrow();
  });

  it("rejects an invalid status", () => {
    expect(() => updateTaskSchema.parse({ status: "wip" })).toThrow();
    expect(() => updateTaskSchema.parse({ title: "" })).toThrow();
  });

  it("rejects unknown keys on update, like on create", () => {
    expect(() =>
      updateTaskSchema.parse({ title: "T", projectId: "x" }),
    ).toThrow();
  });
});
