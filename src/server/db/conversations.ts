/**
 * Persistence for conversations and messages (M2).
 * Uses Neon Postgres via getSql().
 */

import { getSql } from "@/server/db";

/** M2: schema types for Neon tables */
export type ConversationRow = {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: Date;
};

/** M2: list conversations, most recently updated first. */
export async function listConversations(): Promise<ConversationRow[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, title, created_at, updated_at
    FROM conversations
    ORDER BY updated_at DESC
  `;
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

/** M2: get messages for a conversation. */
export async function getMessagesByConversationId(conversationId: string): Promise<MessageRow[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, conversation_id, role, content, created_at
    FROM messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
  `;
  return rows.map((r) => ({
    id: r.id,
    conversation_id: r.conversation_id,
    role: r.role,
    content: r.content,
    created_at: r.created_at,
  }));
}

/** M2: create conversation; returns new id. */
export async function createConversation(title?: string): Promise<string> {
  const sql = getSql();
  const defaultTitle = "New chat";
  const rows = await sql`
    INSERT INTO conversations (title)
    VALUES (${title ?? defaultTitle})
    RETURNING id
  `;
  const id = rows[0]?.id;
  if (!id) throw new Error("Failed to create conversation");
  return String(id);
}

/** M2: append message; returns new message id. */
export async function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<string> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO messages (conversation_id, role, content)
    VALUES (${conversationId}, ${role}, ${content})
    RETURNING id
  `;
  const id = rows[0]?.id;
  if (!id) throw new Error("Failed to add message");
  return String(id);
}

/** M2: update conversation title and/or updated_at. */
export async function updateConversation(
  conversationId: string,
  updates: { title?: string; updated_at?: Date }
): Promise<void> {
  const sql = getSql();
  if (updates.title !== undefined) {
    await sql`
      UPDATE conversations SET title = ${updates.title}, updated_at = now()
      WHERE id = ${conversationId}
    `;
  } else if (updates.updated_at !== undefined) {
    await sql`
      UPDATE conversations SET updated_at = ${updates.updated_at}
      WHERE id = ${conversationId}
    `;
  } else {
    await sql`
      UPDATE conversations SET updated_at = now()
      WHERE id = ${conversationId}
    `;
  }
}
