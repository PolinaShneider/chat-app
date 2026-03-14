/**
 * M1: Streaming chat endpoint. M2: optional conversationId, persist messages, set title.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { streamChat } from "@/server/llm/streamChat";
import {
  createConversation,
  addMessage,
  updateConversation,
} from "@/server/db/conversations";

export const runtime = "nodejs";

const TITLE_MAX_LENGTH = 50;

const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  conversationId: z.string().uuid().optional().nullable(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { messages, conversationId: requestConversationId } = parsed.data;
  if (messages.length === 0) {
    return NextResponse.json(
      { error: "At least one message required" },
      { status: 400 }
    );
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") {
    return NextResponse.json(
      { error: "Last message must be from user" },
      { status: 400 }
    );
  }

  let conversationId: string;
  let createdInRequest = false;
  if (requestConversationId) {
    conversationId = requestConversationId;
  } else {
    conversationId = await createConversation("New chat");
    createdInRequest = true;
  }

  try {
    await addMessage(conversationId, "user", lastMessage.content);
    if (createdInRequest) {
      const title =
        lastMessage.content.length > TITLE_MAX_LENGTH
          ? lastMessage.content.slice(0, TITLE_MAX_LENGTH).trim() + "…"
          : lastMessage.content.trim() || "New chat";
      await updateConversation(conversationId, { title });
    }
  } catch (dbError) {
    console.error("DB error persisting user message", dbError);
    return NextResponse.json(
      { error: "Failed to save message" },
      { status: 500 }
    );
  }

  try {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullContent = "";
        try {
          for await (const chunk of streamChat(messages)) {
            if (chunk) {
              fullContent += chunk;
              controller.enqueue(encoder.encode(chunk));
            }
          }
          await addMessage(conversationId, "assistant", fullContent);
          await updateConversation(conversationId, {});
        } catch (err) {
          console.error("Stream or persist error", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Conversation-Id": conversationId,
      },
    });
  } catch (error) {
    console.error("Stream error", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
