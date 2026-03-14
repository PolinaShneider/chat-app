/**
 * M2: Get messages for a conversation. Stub until persistence is implemented.
 */

import { NextResponse } from "next/server";
import { getMessagesByConversationId } from "@/server/db/conversations";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  try {
    const rows = await getMessagesByConversationId(conversationId);
    const messages = rows.map((r) => ({
      id: r.id,
      role: r.role,
      content: r.content,
    }));
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Get messages failed", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 }
    );
  }
}
