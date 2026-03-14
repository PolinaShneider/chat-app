"use client";

import type { Message } from "@/types/chat";
import { MarkdownMessage } from "./MarkdownMessage";
import { RedactedText } from "./RedactedText";

type Props = {
  messages: Message[];
  getRevealed: (messageId: string) => Set<string>;
  onToggleReveal: (messageId: string, spanId: string) => void;
};

/** M1: Renders message list. M3: RedactedText for assistant when redactions present. */
export function ChatMessageList({ messages, getRevealed, onToggleReveal }: Props) {
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center text-zinc-500">
          <p className="text-sm">Start a conversation or select one from the sidebar.</p>
          <p className="mt-1 text-xs">Type a message below to get started.</p>
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
            m.id === "streaming" && !m.content.trim() ? (
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
            )
          ) : (
            typeof m.content === "string" ? m.content : ""
          )}
        </div>
      ))}
    </div>
  );
}
