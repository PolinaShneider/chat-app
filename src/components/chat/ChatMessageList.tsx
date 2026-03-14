"use client";

import type { Message } from "@/types/chat";
import { MarkdownMessage } from "./MarkdownMessage";

type Props = {
  messages: Message[];
  streamingContent?: string;
};

/** M1: Renders message list. M3: can use RedactedText for assistant content. */
export function ChatMessageList({ messages, streamingContent = "" }: Props) {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
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
            <MarkdownMessage content={m.content} />
          ) : (
            typeof m.content === "string" ? m.content : ""
          )}
        </div>
      ))}
      {streamingContent ? (
        <div className="max-w-[85%] rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-900">
          <MarkdownMessage content={streamingContent} />
        </div>
      ) : null}
    </div>
  );
}
