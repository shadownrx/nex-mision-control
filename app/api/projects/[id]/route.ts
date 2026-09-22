import { NextResponse } from "next/server";

import { projects } from "@/lib/projects/repository";
import { isUuid, notFound, validationError } from "@/lib/projects/http";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  const found = await projects.getById(id);
  if (!found) return notFound();
  return NextResponse.json(found);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  try {
    const updated = await projects.update(id, await req.json());
    if (!updated) return notFound();
    return NextResponse.json(updated);
  } catch (err) {
    return validationError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  const removed = await projects.remove(id);
  if (!removed) return notFound();
  return NextResponse.json(removed);
}
