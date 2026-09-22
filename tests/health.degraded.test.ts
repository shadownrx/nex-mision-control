import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
  checkDb: vi.fn().mockResolvedValue(false),
}));

import { GET } from "@/app/api/health/route";

describe("foundation degraded", () => {
  it("health endpoint reports 503 with database down when DB is unreachable", async () => {
    const res = await GET();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: "ok", database: "down" });
  });
});
