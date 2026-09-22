import { NextResponse } from "next/server";

import { isUuid, notFound, validationError } from "@/lib/projects/http";
import {
  DecisionImmutableError,
  decisions,
} from "@/lib/decisions/repository";

type Params = { params: Promise<{ id: string; decisionId: string }> };

async function ids({ params }: Params) {
  const { id: projectId, decisionId } = await params;
  if (!isUuid(projectId) || !isUuid(decisionId)) return null;
  return { projectId, decisionId };
}

// History violations are conflicts, not missing resources.
function historyError(err: unknown): NextResponse {
  if (err instanceof DecisionImmutableError) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
  return validationError(err);
}

export async function GET(_req: Request, ctx: Params) {
  const idPair = await ids(ctx);
  if (!idPair) return notFound();
  const found = await decisions.getById(idPair.projectId, idPair.decisionId);
  if (!found) return notFound();
  return NextResponse.json(found);
}

export async function PATCH(req: Request, ctx: Params) {
  const idPair = await ids(ctx);
  if (!idPair) return notFound();
  try {
    const updated = await decisions.update(
      idPair.projectId,
      idPair.decisionId,
      await req.json(),
    );
    if (!updated) return notFound();
    return NextResponse.json(updated);
  } catch (err) {
    return historyError(err);
  }
}

export async function DELETE(_req: Request, ctx: Params) {
  const idPair = await ids(ctx);
  if (!idPair) return notFound();
  try {
    const removed = await decisions.remove(
      idPair.projectId,
      idPair.decisionId,
    );
    if (!removed) return notFound();
    return NextResponse.json(removed);
  } catch (err) {
    return historyError(err);
  }
}
