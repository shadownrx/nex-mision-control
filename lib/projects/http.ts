import { NextResponse } from "next/server";
import { z, ZodError } from "zod";

const idSchema = z.string().uuid();

// Shared HTTP helpers for the Projects API so error mapping stays in one
// place (single Zod boundary behavior over HTTP).
export function isUuid(id: string): boolean {
  return idSchema.safeParse(id).success;
}

export function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export function validationError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json({ error: err.issues }, { status: 400 });
  }
  throw err;
}
