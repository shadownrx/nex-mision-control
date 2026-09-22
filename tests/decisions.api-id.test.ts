import { describe, expect, it } from "vitest";

import {
  DELETE as deleteDecision,
  GET as getDecision,
  PATCH as patchDecision,
} from "@/app/api/projects/[id]/decisions/[decisionId]/route";
import {
  GET as listDecisions,
  POST as createDecision,
} from "@/app/api/projects/[id]/decisions/route";

const BAD = "not-a-uuid";

describe("decisions api id handling", () => {
  it("returns 404 for malformed project ids without touching the database", async () => {
    const ctx = { params: Promise.resolve({ id: BAD }) };
    expect((await listDecisions(new Request("http://x"), ctx)).status).toBe(
      404,
    );
    expect(
      (
        await createDecision(
          new Request("http://x", {
            method: "POST",
            body: JSON.stringify({
              title: "T",
              context: "C",
              alternatives: "A",
              rationale: "R",
            }),
          }),
          ctx,
        )
      ).status,
    ).toBe(404);
  });

  it("returns 404 for malformed decision ids without touching the database", async () => {
    const req = new Request("http://x");
    const ctx = { params: Promise.resolve({ id: BAD, decisionId: BAD }) };
    expect((await getDecision(req, ctx)).status).toBe(404);
    expect(
      (
        await patchDecision(
          new Request("http://x", {
            method: "PATCH",
            body: JSON.stringify({ title: "T2" }),
          }),
          ctx,
        )
      ).status,
    ).toBe(404);
    expect((await deleteDecision(req, ctx)).status).toBe(404);
  });
});
