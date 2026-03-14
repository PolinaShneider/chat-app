"use client";

import type { Message } from "@/types/chat";
import { MarkdownMessage } from "./MarkdownMessage";
import { RedactedText } from "./RedactedText";

/** Examples: first two elicit PII in the reply (names/emails/phones → redacted); last is generic. */
const EXAMPLE_MESSAGES = [
  "Send a meeting invite to Dr. James Wilson at james.wilson@clinic.org for next Tuesday at 2pm.",
  "Write a reminder for Sarah Kim: call her at 555-123-4567 about the appointment.",
  "What are three tips for better time management?",
];

type Props = {
  messages: Message[];
  getRevealed: (messageId: string) => Set<string>;
  onToggleReveal: (messageId: string, spanId: string) => void;
  onExampleClick?: (text: string) => void;
};

/** M1: Renders message list. M3: RedactedText for assistant when redactions present. */
export function ChatMessageList({ messages, getRevealed, onToggleReveal, onExampleClick }: Props) {
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 [overflow-anchor:auto]">
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-zinc-500">Start a conversation or select one from the sidebar.</p>
          {onExampleClick && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-zinc-500">Or try one of these:</p>
              {EXAMPLE_MESSAGES.map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => onExampleClick(text)}
                  className="max-w-md rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-100"
                >
                  {text}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
      {messages.map((m) => (
        <div
          key={m.id}
          className={
            m.role === "user"
              ? "ml-auto max-w-[85%] rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white"
              : "max-w-[85%] rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-900"
          }
        >
          {m.role === "assistant" && typeof m.content === "string" ? (
            <div className="min-h-[1.5rem]">
              {m.id === "streaming" && !m.content.trim() ? (
                <span className="inline-flex gap-0.5 text-zinc-500" aria-hidden>
                  <span className="animate-typing-dot size-1.5 rounded-full bg-current [animation-delay:0ms]" />
                  <span className="animate-typing-dot size-1.5 rounded-full bg-current [animation-delay:160ms]" />
                  <span className="animate-typing-dot size-1.5 rounded-full bg-current [animation-delay:320ms]" />
                </span>
              ) : Array.isArray(m.redactions) && m.redactions.length > 0 ? (
                <RedactedText
                  text={m.content}
                  redactionSpans={m.redactions}
                  revealed={getRevealed(m.id)}
                  onToggleReveal={(spanId) => onToggleReveal(m.id, spanId)}
                />
              ) : (
                <MarkdownMessage content={m.content} />
              )}
            </div>
          ) : (
            typeof m.content === "string" ? m.content : ""
          )}
        </div>
      ))}
    </div>
  );
}
