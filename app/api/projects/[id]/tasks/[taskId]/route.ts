import { NextResponse } from "next/server";

import { isUuid, notFound, validationError } from "@/lib/projects/http";
import { tasks } from "@/lib/tasks/repository";

type Params = { params: Promise<{ id: string; taskId: string }> };

async function ids({ params }: Params) {
  const { id: projectId, taskId } = await params;
  if (!isUuid(projectId) || !isUuid(taskId)) return null;
  return { projectId, taskId };
}

export async function GET(_req: Request, ctx: Params) {
  const idPair = await ids(ctx);
  if (!idPair) return notFound();
  const found = await tasks.getById(idPair.projectId, idPair.taskId);
  if (!found) return notFound();
  return NextResponse.json(found);
}

export async function PATCH(req: Request, ctx: Params) {
  const idPair = await ids(ctx);
  if (!idPair) return notFound();
  try {
    const updated = await tasks.update(
      idPair.projectId,
      idPair.taskId,
      await req.json(),
    );
    if (!updated) return notFound();
    return NextResponse.json(updated);
  } catch (err) {
    return validationError(err);
  }
}

export async function DELETE(_req: Request, ctx: Params) {
  const idPair = await ids(ctx);
  if (!idPair) return notFound();
  const removed = await tasks.remove(idPair.projectId, idPair.taskId);
  if (!removed) return notFound();
  return NextResponse.json(removed);
}
