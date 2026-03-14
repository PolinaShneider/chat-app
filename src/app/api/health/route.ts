import { NextResponse } from "next/server";
import { getSql } from "@/server/db";

export const runtime = "nodejs";

export async function GET() {
  const sql = getSql();

  try {
    const [row] = await sql<{ ok: number }[]>`select 1 as ok`;
    const isOk = row?.ok === 1;
    return NextResponse.json({ ok: isOk });
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json(
      { ok: false, error: "Database health check failed" },
      { status: 500 },
    );
  }
}

