/**
 * M1: Streaming chat endpoint. M2: optional conversationId, persist messages, set title.
 * M3: Spoiler mode – buffer chunks, run PII, flush content in segments so redacted parts
 *     are sent only when known and already marked (blurred on first paint).
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { streamChat } from "@/server/llm/streamChat";
import { detectPII } from "@/server/llm/detectPII";
import type { RedactionSpan } from "@/types/chat";
import {
  createConversation,
  addMessage,
  updateConversation,
} from "@/server/db/conversations";

export const runtime = "nodejs";

const TITLE_MAX_LENGTH = 50;
/** When no newline yet, flush after this many chars so long lines still stream. */
const PII_MAX_CHARS_WITHOUT_NEWLINE = 120;

const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    })
  ),
  conversationId: z.string().uuid().optional().nullable(),
});

function enqueueLine(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  obj: { type: string; [k: string]: unknown }
) {
  controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
}

/** Normalize multiple newlines to a single newline. */
function normalizeNewlines(s: string): string {
  return s.replace(/\n\n+/g, "\n");
}

/** Build segments [start, end) in range [from, to) split by redaction spans (sorted). */
function buildFlushSegments(
  buffer: string,
  spans: RedactionSpan[],
  from: number,
  to: number
): { kind: "plain" | "redacted"; start: number; end: number; span?: RedactionSpan }[] {
  const segments: { kind: "plain" | "redacted"; start: number; end: number; span?: RedactionSpan }[] = [];
  const relevant = spans.filter((s) => s.end > from && s.start < to).sort((a, b) => a.start - b.start);
  let pos = from;
  for (const span of relevant) {
    const segStart = Math.max(span.start, from);
    const segEnd = Math.min(span.end, to);
    if (segStart > pos) {
      segments.push({ kind: "plain", start: pos, end: segStart });
    }
    segments.push({ kind: "redacted", start: segStart, end: segEnd, span });
    pos = segEnd;
  }
  if (pos < to) {
    segments.push({ kind: "plain", start: pos, end: to });
  }
  return segments;
}

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
    const encoder = new TextEncoder();
    let buffer = "";
    let lastFlushedEnd = 0;
    let piiInFlight = false;
    let resolvePIIInFlight: () => void;
    let piiSettled: Promise<void> = Promise.resolve();

    const stream = new ReadableStream({
      async start(controller) {
        let messageId = "";
        try {
          for await (const chunk of streamChat(messages)) {
            if (!chunk) continue;
            buffer += chunk;

            const normalized = normalizeNewlines(buffer);
            const pending = normalized.length - lastFlushedEnd;
            const nextNewline = normalized.indexOf("\n", lastFlushedEnd);
            const shouldFlush =
              pending > 0 &&
              (nextNewline !== -1 || pending >= PII_MAX_CHARS_WITHOUT_NEWLINE);
            const snapshotEnd =
              nextNewline !== -1
                ? nextNewline + 1
                : Math.min(normalized.length, lastFlushedEnd + PII_MAX_CHARS_WITHOUT_NEWLINE);

            if (!piiInFlight && shouldFlush) {
              piiInFlight = true;
              piiSettled = new Promise<void>((r) => {
                resolvePIIInFlight = r;
              });
              const flushEnd = snapshotEnd;
              detectPII(normalized.slice(0, flushEnd)).then((spans: RedactionSpan[]) => {
                const segments = buildFlushSegments(normalized, spans, lastFlushedEnd, flushEnd);
                for (const seg of segments) {
                  const text = normalized.slice(seg.start, seg.end);
                  if (!text) continue;
                  if (seg.kind === "redacted" && seg.span) {
                    enqueueLine(controller, encoder, {
                      type: "chunk",
                      text,
                      redactSpan: { id: seg.span.id, type: seg.span.type },
                    });
                  } else {
                    enqueueLine(controller, encoder, { type: "chunk", text });
                  }
                }
                lastFlushedEnd = flushEnd;
                piiInFlight = false;
                resolvePIIInFlight();
              });
            }
          }

          await piiSettled;

          const normalizedBuffer = normalizeNewlines(buffer);
          const finalSpans = await Promise.race([
            detectPII(normalizedBuffer),
            new Promise<RedactionSpan[]>((_, reject) =>
              setTimeout(() => reject(new Error("PII detection timeout")), 15_000)
            ),
          ]).catch(() => [] as RedactionSpan[]);

          const tailSegments = buildFlushSegments(
            normalizedBuffer,
            finalSpans,
            lastFlushedEnd,
            normalizedBuffer.length
          );
          for (const seg of tailSegments) {
            const text = normalizedBuffer.slice(seg.start, seg.end);
            if (!text) continue;
            if (seg.kind === "redacted" && seg.span) {
              enqueueLine(controller, encoder, {
                type: "chunk",
                text,
                redactSpan: { id: seg.span.id, type: seg.span.type },
              });
            } else {
              enqueueLine(controller, encoder, { type: "chunk", text });
            }
          }

          messageId = await addMessage(
            conversationId,
            "assistant",
            normalizedBuffer,
            finalSpans.length ? finalSpans : undefined
          );
          await updateConversation(conversationId, {});
        } catch (err) {
          console.error("Stream or persist error", err);
        } finally {
          enqueueLine(controller, encoder, { type: "done", messageId });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
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
