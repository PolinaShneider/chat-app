/**
 * Data-access layer for chat. Used by hooks; no raw fetch in UI.
 * M1: postChatStream. M2: getConversations, getMessages.
 */

import type { Message } from "@/types/chat";

export type SendMessageInput = {
  messages: Array<{ role: Message["role"]; content: string }>;
};

/** M1: stream LLM response. Returns response with readable body. */
export async function postChatStream(_input: SendMessageInput): Promise<Response> {
  const res = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(_input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err?.error ?? `HTTP ${res.status}`);
  }
  return res;
}

/** M2: list conversations for sidebar */
export async function getConversations(): Promise<{ id: string; title: string; updatedAt: string }[]> {
  const res = await fetch("/api/conversations");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { conversations?: { id: string; title: string; updatedAt: string }[] };
  return data.conversations ?? [];
}

/** M2: load messages for a conversation */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const res = await fetch(`/api/conversations/${conversationId}/messages`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { messages?: Message[] };
  return data.messages ?? [];
}
