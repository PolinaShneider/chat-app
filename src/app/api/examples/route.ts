import { NextResponse } from "next/server";
import { listExamples } from "@/server/bff/example";

export const runtime = "nodejs";

export async function GET() {
  const items = listExamples();
  return NextResponse.json({ items });
}

