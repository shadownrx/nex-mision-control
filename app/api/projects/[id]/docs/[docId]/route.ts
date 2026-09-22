import { NextResponse } from "next/server";

import { isUuid, notFound, validationError } from "@/lib/projects/http";
import { docs } from "@/lib/docs/repository";

type Params = { params: Promise<{ id: string; docId: string }> };

async function ids({ params }: Params) {
  const { id: projectId, docId } = await params;
  if (!isUuid(projectId) || !isUuid(docId)) return null;
  return { projectId, docId };
}

export async function GET(_req: Request, ctx: Params) {
  const idPair = await ids(ctx);
  if (!idPair) return notFound();
  const found = await docs.getById(idPair.projectId, idPair.docId);
  if (!found) return notFound();
  return NextResponse.json(found);
}

export async function PATCH(req: Request, ctx: Params) {
  const idPair = await ids(ctx);
  if (!idPair) return notFound();
  try {
    const updated = await docs.update(
      idPair.projectId,
      idPair.docId,
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
  const removed = await docs.remove(idPair.projectId, idPair.docId);
  if (!removed) return notFound();
  return NextResponse.json(removed);
}
