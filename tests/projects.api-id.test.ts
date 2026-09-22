import { describe, expect, it } from "vitest";

import {
  DELETE,
  GET,
  PATCH,
} from "@/app/api/projects/[id]/route";

const params = (id: string) =>
  ({ params: Promise.resolve({ id }) }) as unknown as Parameters<
    typeof GET
  >[1];

describe("project detail api id handling", () => {
  it("returns 404 for a malformed id without touching the database", async () => {
    const req = new Request("http://localhost/api/projects/not-a-uuid");
    expect((await GET(req, params("not-a-uuid"))).status).toBe(404);
    expect(
      (
        await PATCH(
          new Request("http://localhost/api/projects/not-a-uuid", {
            method: "PATCH",
            body: JSON.stringify({ name: "x" }),
          }),
          params("not-a-uuid"),
        )
      ).status,
    ).toBe(404);
    expect((await DELETE(req, params("not-a-uuid"))).status).toBe(404);
  });
});
