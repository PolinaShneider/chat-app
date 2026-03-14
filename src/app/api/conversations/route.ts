/**
 * M2: List conversations. Stub until persistence is implemented.
 */

import { NextResponse } from "next/server";
import { listConversations } from "@/server/db/conversations";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await listConversations();
    const conversations = rows.map((r) => ({
      id: r.id,
      title: r.title,
      updatedAt: r.updated_at.toISOString(),
    }));
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("List conversations failed", error);
    return NextResponse.json(
      { error: "Failed to list conversations" },
      { status: 500 }
    );
  }
}
