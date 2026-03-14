/**
 * Shared chat types. Extensible for M2 (conversations) and M3 (redaction spans).
 */

export type MessageRole = "user" | "assistant";

/** M1: content is string. M3: can extend to { text, redactionSpans } */
export type MessageContent = string;

export type Message = {
  id: string;
  role: MessageRole;
  content: MessageContent;
};

/** M2: conversation for sidebar and history */
export type Conversation = {
  id: string;
  title: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

/** M3: span to blur/redact in assistant text */
export type RedactionSpan = {
  start: number;
  end: number;
};

/** M3: message content with optional redaction metadata */
export type MessageContentWithRedactions = {
  text: string;
  redactionSpans?: RedactionSpan[];
};
