/**
 * M2: Delete a conversation. Messages are removed by DB ON DELETE CASCADE.
 */

import { NextResponse } from "next/server";
import { deleteConversation } from "@/server/db/conversations";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  try {
    await deleteConversation(conversationId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete conversation failed", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
