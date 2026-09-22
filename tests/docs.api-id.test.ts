import { describe, expect, it } from "vitest";

import {
  DELETE as deleteDoc,
  GET as getDoc,
  PATCH as patchDoc,
} from "@/app/api/projects/[id]/docs/[docId]/route";
import {
  GET as listDocs,
  POST as createDoc,
} from "@/app/api/projects/[id]/docs/route";

const BAD = "not-a-uuid";

describe("documentation api id handling", () => {
  it("returns 404 for malformed project ids without touching the database", async () => {
    const ctx = { params: Promise.resolve({ id: BAD }) };
    expect((await listDocs(new Request("http://x"), ctx)).status).toBe(404);
    expect(
      (
        await createDoc(
          new Request("http://x", {
            method: "POST",
            body: JSON.stringify({ title: "T", body: "B" }),
          }),
          ctx,
        )
      ).status,
    ).toBe(404);
  });

  it("returns 404 for malformed document ids without touching the database", async () => {
    const req = new Request("http://x");
    const ctx = { params: Promise.resolve({ id: BAD, docId: BAD }) };
    expect((await getDoc(req, ctx)).status).toBe(404);
    expect(
      (
        await patchDoc(
          new Request("http://x", {
            method: "PATCH",
            body: JSON.stringify({ title: "T2" }),
          }),
          ctx,
        )
      ).status,
    ).toBe(404);
    expect((await deleteDoc(req, ctx)).status).toBe(404);
  });
});
