import { describe, expect, it } from "vitest";

import * as schema from "@/db/schema";
import * as derive from "@/lib/activity/derive";

// Seam 3 invariant: Activity owns no storage and exposes no write path.
// These tests need no database.
describe("activity has no storage", () => {
  it("defines no activity, event, audit, or queue table", () => {
    const tables = Object.keys(schema);
    for (const forbidden of [
      "activities",
      "activity",
      "events",
      "event",
      "event_log",
      "audit",
      "audit_log",
      "activity_log",
      "queues",
    ]) {
      expect(tables).not.toContain(forbidden);
    }
  });

  it("exposes only the derivation function", () => {
    expect(Object.keys(derive)).toEqual(["getProjectActivity"]);
  });
});
