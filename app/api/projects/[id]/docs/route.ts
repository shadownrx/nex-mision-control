import { NextResponse } from "next/server";

import { projects } from "@/lib/projects/repository";
import { isUuid, notFound, validationError } from "@/lib/projects/http";
import { docs } from "@/lib/docs/repository";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id: projectId } = await params;
  if (!isUuid(projectId)) return notFound();
  if (!(await projects.getById(projectId))) return notFound();
  return NextResponse.json(await docs.listByProject(projectId));
}

export async function POST(req: Request, { params }: Params) {
  const { id: projectId } = await params;
  if (!isUuid(projectId)) return notFound();
  try {
    const created = await docs.create(projectId, await req.json());
    if (!created) return notFound();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return validationError(err);
  }
}
