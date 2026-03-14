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
  /** M3: assistant messages only; server-generated ids */
  redactions?: RedactionSpan[];
};

/** M2: conversation for sidebar and history */
export type Conversation = {
  id: string;
  title: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

/** M3: span to blur/redact in assistant text; id generated on server */
export type RedactionSpan = {
  id: string;
  start: number;
  end: number;
  type: string;
};

/** M3: message content with optional redaction metadata */
export type MessageContentWithRedactions = {
  text: string;
  redactionSpans?: RedactionSpan[];
};
