import { NextResponse } from "next/server";

import { projects } from "@/lib/projects/repository";
import { validationError } from "@/lib/projects/http";

export async function GET() {
  return NextResponse.json(await projects.list());
}

export async function POST(req: Request) {
  try {
    const created = await projects.create(await req.json());
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return validationError(err);
  }
}
