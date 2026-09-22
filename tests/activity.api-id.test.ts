import { describe, expect, it } from "vitest";

import { GET as getActivity } from "@/app/api/projects/[id]/activity/route";

describe("activity api", () => {
  it("returns 404 for a malformed project id without touching the database", async () => {
    const res = await getActivity(new Request("http://x"), {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });
    expect(res.status).toBe(404);
  });
});
