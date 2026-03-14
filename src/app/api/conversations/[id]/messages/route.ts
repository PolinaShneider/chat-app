/**
 * M2: Get messages for a conversation.
 * M3: Returns content (full unredacted text) + redactions (spans to blur). Client uses both for reveal-on-click.
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
    const messages = rows.map((r) => {
      const redactions =
        r.redaction_spans != null && r.redaction_spans.length > 0 ? r.redaction_spans : undefined;
      return {
        id: r.id,
        role: r.role,
        content: r.content,
        ...(redactions != null && { redactions }),
      };
    });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Get messages failed", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 }
    );
  }
}
