import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/health/route";
import { checkDb } from "@/db";

describe("foundation smoke", () => {
  it("connects to PostgreSQL", async () => {
    await expect(checkDb()).resolves.toBe(true);
  });

  it("health endpoint reports ok with database up", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok", database: "up" });
  });
});
