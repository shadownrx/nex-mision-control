import { describe, expect, it } from "vitest";

import { GET as getActivity } from "@/app/api/projects/[id]/activity/route";

// Needs a live database (checks project existence first).
describe("activity api with database", () => {
  it("returns 404 for an unknown project", async () => {
    const res = await getActivity(new Request("http://x"), {
      params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }),
    });
    expect(res.status).toBe(404);
  });
});
