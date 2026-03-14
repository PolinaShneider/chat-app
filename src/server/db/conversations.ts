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

/** M2: list conversations (stub). TODO: SELECT from conversations table. */
export async function listConversations(): Promise<ConversationRow[]> {
  void getSql();
  return [];
}

/** M2: get messages for a conversation (stub). TODO: SELECT from messages table. */
export async function getMessagesByConversationId(_conversationId: string): Promise<MessageRow[]> {
  void getSql();
  return [];
}

/** M2: create conversation (stub). TODO: INSERT, return id. */
export async function createConversation(_title?: string): Promise<string> {
  void getSql();
  return "stub-id";
}

/** M2: append message (stub). TODO: INSERT into messages. */
export async function addMessage(
  _conversationId: string,
  _role: "user" | "assistant",
  _content: string
): Promise<string> {
  void getSql();
  return "stub-msg-id";
}
