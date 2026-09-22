import { NextResponse } from "next/server";

import { projects } from "@/lib/projects/repository";
import { isUuid, notFound, validationError } from "@/lib/projects/http";
import { decisions } from "@/lib/decisions/repository";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id: projectId } = await params;
  if (!isUuid(projectId)) return notFound();
  if (!(await projects.getById(projectId))) return notFound();
  return NextResponse.json(await decisions.listByProject(projectId));
}

export async function POST(req: Request, { params }: Params) {
  const { id: projectId } = await params;
  if (!isUuid(projectId)) return notFound();
  if (!(await projects.getById(projectId))) return notFound();
  try {
    const created = await decisions.create(projectId, await req.json());
    // The project exists, so null means an invalid supersedes target.
    if (!created) {
      return NextResponse.json(
        { error: "Invalid supersedes target" },
        { status: 400 },
      );
    }
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return validationError(err);
  }
}
