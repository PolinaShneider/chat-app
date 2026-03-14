"use client";

/**
 * M1/M2: Streaming chat state. Holds pending user message and streaming content;
 * message list comes from useMessages(conversationId). Callbacks for new conversation and stream complete.
 */

import { useState, useCallback, useEffect } from "react";
import type { Message } from "@/types/chat";
import { postChatStream } from "@/lib/api/chat";

export type UseChatStreamOptions = {
  conversationId: string | null;
  messages: Message[];
  onConversationCreated?: (conversationId: string) => void;
  onStreamComplete?: (conversationId: string) => void;
};

export function useChatStream({
  conversationId,
  messages,
  onConversationCreated,
  onStreamComplete,
}: UseChatStreamOptions) {
  const [pendingUserMessage, setPendingUserMessage] = useState<Message | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPendingUserMessage(null);
    setStreamingContent("");
    setError(null);
  }, [conversationId]);

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

        let full = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          setStreamingContent(full);
        }

        const finalConversationId = responseConversationId ?? conversationId;
        if (finalConversationId) {
          onStreamComplete?.(finalConversationId);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Send failed");
      } finally {
        setPendingUserMessage(null);
        setStreamingContent("");
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
    isStreaming,
    error,
    sendMessage,
  };
}
