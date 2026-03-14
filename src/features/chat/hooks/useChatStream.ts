"use client";

/**
 * M1/M2: Streaming chat state. M3: NDJSON parse, streamingRedactions, onStreamComplete(conversationId, messageId).
 * Server sends line-based chunks so we just append as received (no typing effect).
 */

import { useState, useCallback, useEffect } from "react";
import type { Message, RedactionSpan } from "@/types/chat";
import { postChatStream } from "@/lib/api/chat";

export type UseChatStreamOptions = {
  conversationId: string | null;
  messages: Message[];
  onConversationCreated?: (conversationId: string) => void;
  /** Called when stream ends; await this so refetch completes before we clear streaming state. */
  onStreamComplete?: (conversationId: string, messageId?: string) => void | Promise<void>;
};

type StreamEvent =
  | { type: "chunk"; text: string; redactSpan?: { id: string; type: string } }
  | { type: "done"; messageId: string };

export function useChatStream({
  conversationId,
  messages,
  onConversationCreated,
  onStreamComplete,
}: UseChatStreamOptions) {
  const [pendingUserMessage, setPendingUserMessage] = useState<Message | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingRedactions, setStreamingRedactions] = useState<RedactionSpan[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isStreaming) return;
    setPendingUserMessage(null);
    setStreamingContent("");
    setStreamingRedactions([]);
    setError(null);
  }, [conversationId, isStreaming]);

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isStreaming) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: userText.trim(),
      };
      setPendingUserMessage(userMessage);
      setStreamingContent("");
      setStreamingRedactions([]);
      setIsStreaming(true);
      setError(null);

      try {
        const { response, conversationId: responseConversationId } = await postChatStream({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: typeof m.content === "string" ? m.content : "",
          })),
          conversationId: conversationId ?? undefined,
        });

        if (conversationId == null && responseConversationId) {
          onConversationCreated?.(responseConversationId);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) {
          setError("No response body");
          return;
        }

        let lineBuffer = "";
        let full = "";
        const handleEvent = async (event: StreamEvent) => {
          if (event.type === "chunk" && typeof event.text === "string") {
            const start = full.length;
            full += event.text;
            setStreamingContent(full);
            if (event.redactSpan) {
              setStreamingRedactions((prev) => [
                ...prev,
                { id: event.redactSpan!.id, start, end: full.length, type: event.redactSpan!.type },
              ]);
            }
          } else if (event.type === "done" && typeof event.messageId === "string") {
            const finalConversationId = responseConversationId ?? conversationId;
            if (finalConversationId) await onStreamComplete?.(finalConversationId, event.messageId);
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          lineBuffer += decoder.decode(value, { stream: true });
          const lines = lineBuffer.split("\n");
          lineBuffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              await handleEvent(JSON.parse(line) as StreamEvent);
            } catch {
              // ignore malformed lines
            }
          }
        }
        if (lineBuffer.trim()) {
          try {
            await handleEvent(JSON.parse(lineBuffer) as StreamEvent);
          } catch {
            // ignore
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Send failed");
      } finally {
        setPendingUserMessage(null);
        setStreamingContent("");
        setStreamingRedactions([]);
        setIsStreaming(false);
      }
    },
    [
      conversationId,
      messages,
      isStreaming,
      onConversationCreated,
      onStreamComplete,
    ]
  );

  return {
    pendingUserMessage,
    streamingContent,
    streamingRedactions,
    isStreaming,
    error,
    sendMessage,
  };
}
