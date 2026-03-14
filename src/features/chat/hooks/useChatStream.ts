"use client";

/**
 * M1: Streaming chat state. Holds messages, streaming content, send action.
 */

import { useState, useCallback } from "react";
import type { Message } from "@/types/chat";
import { postChatStream } from "@/lib/api/chat";

export function useChatStream() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userText.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setStreamingContent("");
    setIsStreaming(true);
    setError(null);

    try {
      const response = await postChatStream({
        messages: [...messages, userMessage].map((m) => ({
          role: m.role,
          content: typeof m.content === "string" ? m.content : "",
        })),
      });

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

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: full,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming]);

  return {
    messages,
    streamingContent,
    isStreaming,
    error,
    sendMessage,
  };
}
