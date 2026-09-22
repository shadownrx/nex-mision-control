import { NextResponse } from "next/server";

import { checkDb } from "@/db";

export async function GET() {
  const up = await checkDb();
  if (!up) {
    return NextResponse.json(
      { status: "ok", database: "down" },
      { status: 503 },
    );
  }
  return NextResponse.json({ status: "ok", database: "up" });
}
