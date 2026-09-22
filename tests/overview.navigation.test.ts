import { describe, expect, it } from "vitest";

import { entityAnchor } from "@/lib/overview/navigation";

// S2-03: cross-navigation targets fragments on the existing project route.
// No new routes, no persisted relations: kind + id already identify every
// entity rendered on the page.
describe("entity anchors", () => {
  it("points a task episode at its rendered item", () => {
    expect(entityAnchor("task", "t1")).toBe("#task-t1");
  });

  it("points a decision episode at its rendered item", () => {
    expect(entityAnchor("decision", "d1")).toBe("#decision-d1");
  });

  it("points a documentation episode at its rendered item", () => {
    expect(entityAnchor("documentation", "doc1")).toBe("#doc-doc1");
  });

  it("points a project episode at the project header", () => {
    expect(entityAnchor("project", "p1")).toBe("#project");
  });
});
