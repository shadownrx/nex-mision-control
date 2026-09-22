import { describe, expect, it } from "vitest";

import { GET as listTasks, POST as createTask } from "@/app/api/projects/[id]/tasks/route";
import {
  DELETE as deleteTask,
  GET as getTask,
  PATCH as patchTask,
} from "@/app/api/projects/[id]/tasks/[taskId]/route";

const BAD = "not-a-uuid";

describe("tasks api id handling", () => {
  it("returns 404 for malformed project ids without touching the database", async () => {
    const ctx = { params: Promise.resolve({ id: BAD }) };
    expect((await listTasks(new Request("http://x"), ctx)).status).toBe(404);
    expect(
      (
        await createTask(
          new Request("http://x", {
            method: "POST",
            body: JSON.stringify({ title: "T" }),
          }),
          ctx,
        )
      ).status,
    ).toBe(404);
  });

  it("returns 404 for malformed task ids without touching the database", async () => {
    const req = new Request("http://x");
    const ctx = { params: Promise.resolve({ id: BAD, taskId: BAD }) };
    expect((await getTask(req, ctx)).status).toBe(404);
    expect(
      (
        await patchTask(
          new Request("http://x", {
            method: "PATCH",
            body: JSON.stringify({ status: "done" }),
          }),
          ctx,
        )
      ).status,
    ).toBe(404);
    expect((await deleteTask(req, ctx)).status).toBe(404);
  });
});
