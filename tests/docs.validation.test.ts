import { describe, expect, it } from "vitest";

import {
  createDocumentationSchema,
  updateDocumentationSchema,
} from "@/lib/docs/validation";

describe("documentation validation boundary", () => {
  it("accepts a valid create payload", () => {
    expect(
      createDocumentationSchema.parse({ title: "Setup", body: "Run compose." }),
    ).toEqual({ title: "Setup", body: "Run compose." });
  });

  it("rejects a missing or blank title or body", () => {
    expect(() =>
      createDocumentationSchema.parse({ body: "Content" }),
    ).toThrow();
    expect(() =>
      createDocumentationSchema.parse({ title: "T" }),
    ).toThrow();
    expect(() =>
      createDocumentationSchema.parse({ title: "  ", body: "Content" }),
    ).toThrow();
    expect(() =>
      createDocumentationSchema.parse({ title: "T", body: "" }),
    ).toThrow();
  });

  it("rejects overlong fields", () => {
    expect(() =>
      createDocumentationSchema.parse({ title: "t".repeat(201), body: "B" }),
    ).toThrow();
    expect(() =>
      createDocumentationSchema.parse({ title: "T", body: "b".repeat(20001) }),
    ).toThrow();
  });

  it("rejects unknown keys on create", () => {
    expect(() =>
      createDocumentationSchema.parse({
        title: "T",
        body: "B",
        status: "x",
      }),
    ).toThrow();
  });

  it("accepts a partial update with at least one field", () => {
    expect(updateDocumentationSchema.parse({ body: "New body" })).toEqual({
      body: "New body",
    });
  });

  it("rejects an empty update, unknown keys, and blank fields", () => {
    expect(() => updateDocumentationSchema.parse({})).toThrow();
    expect(() =>
      updateDocumentationSchema.parse({ title: "T", extra: 1 }),
    ).toThrow();
    expect(() => updateDocumentationSchema.parse({ title: "" })).toThrow();
  });
});
