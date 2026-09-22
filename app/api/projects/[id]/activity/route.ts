import { NextResponse } from "next/server";

import { projects } from "@/lib/projects/repository";
import { isUuid, notFound } from "@/lib/projects/http";
import { getProjectActivity } from "@/lib/activity/derive";

type Params = { params: Promise<{ id: string }> };

// Read-only feed: no POST, PATCH, or DELETE exists on this route.
export async function GET(_req: Request, { params }: Params) {
  const { id: projectId } = await params;
  if (!isUuid(projectId)) return notFound();
  if (!(await projects.getById(projectId))) return notFound();
  return NextResponse.json(await getProjectActivity(projectId));
}
