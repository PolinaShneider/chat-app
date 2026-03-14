"use client";

import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useChatStream } from "@/features/chat/hooks/useChatStream";
import { useConversations, useDeleteConversation } from "@/features/chat/hooks/useConversations";
import { useMessages } from "@/features/chat/hooks/useMessages";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { Message } from "@/types/chat";

/**
 * Home: chat UI. M1 streaming, M2 sidebar + conversation persistence, M3 redactions.
 * Revealed state is session-only (not persisted); after refresh all PII is blurred again.
 */
export default function Home() {
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, Set<string>>>({});
  const hasAutoSelectedRef = useRef(false);
  const { data: conversations = [], isLoading: conversationsLoading } = useConversations();
  const { data: baseMessages = [] } = useMessages(selectedConversationId);
  const deleteConversationMutation = useDeleteConversation();

  useEffect(() => {
    if (selectedConversationId !== null) hasAutoSelectedRef.current = true;
    else if (
      !conversationsLoading &&
      conversations.length > 0 &&
      !hasAutoSelectedRef.current
    ) {
      setSelectedConversationId(conversations[0].id);
      hasAutoSelectedRef.current = true;
    }
  }, [conversationsLoading, conversations, selectedConversationId]);

  const {
    pendingUserMessage,
    streamingContent,
    streamingRedactions,
    isStreaming,
    error,
    sendMessage,
  } = useChatStream({
    conversationId: selectedConversationId,
    messages: baseMessages,
    onConversationCreated: setSelectedConversationId,
    onStreamComplete: useCallback(
      async (conversationId: string) => {
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ["messages", conversationId] }),
          queryClient.refetchQueries({ queryKey: ["conversations"] }),
        ]);
      },
      [queryClient]
    ),
  });

  const getRevealed = useCallback((messageId: string): Set<string> => {
    return revealedIds[messageId] ?? new Set();
  }, [revealedIds]);

  const onDeleteConversation = useCallback(
    (id: string) => {
      deleteConversationMutation.mutate(id, {
        onSuccess: () => {
          if (selectedConversationId === id) setSelectedConversationId(null);
        },
      });
    },
    [deleteConversationMutation, selectedConversationId]
  );

  const onToggleReveal = useCallback((messageId: string, spanId: string) => {
    setRevealedIds((prev) => {
      const set = new Set(prev[messageId] ?? []);
      if (set.has(spanId)) set.delete(spanId);
      else set.add(spanId);
      return { ...prev, [messageId]: set };
    });
  }, []);

  const displayMessages = useMemo((): Message[] => {
    const list: Message[] = [...baseMessages];
    const lastBase = baseMessages[baseMessages.length - 1];
    const pendingAlreadyInBase =
      lastBase?.role === "user" && pendingUserMessage && lastBase.content === pendingUserMessage.content;
    if (pendingUserMessage && !pendingAlreadyInBase) list.push(pendingUserMessage);
    if (isStreaming || streamingContent) {
      list.push({
        id: "streaming",
        role: "assistant",
        content: streamingContent,
        redactions: streamingRedactions.length ? streamingRedactions : undefined,
      });
    }
    return list;
  }, [baseMessages, pendingUserMessage, isStreaming, streamingContent, streamingRedactions]);

  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 text-zinc-900">
      <div className="flex h-screen w-full max-w-6xl flex-col shadow-sm">
        <header className="shrink-0 border-b border-zinc-200 bg-white px-4 py-2">
          <h1 className="text-lg font-semibold">Chat</h1>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <ChatSidebar
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelect={setSelectedConversationId}
            onNewChat={() => setSelectedConversationId(null)}
            onDelete={onDeleteConversation}
            isDeletingId={deleteConversationMutation.isPending ? deleteConversationMutation.variables : null}
            isLoading={conversationsLoading}
          />

          <main className="flex flex-1 flex-col overflow-hidden">
            <ChatMessageList
              messages={displayMessages}
              getRevealed={getRevealed}
              onToggleReveal={onToggleReveal}
            />
            {error && (
              <p className="px-4 py-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <ChatInput onSend={sendMessage} disabled={isStreaming} />
          </main>
        </div>
      </div>
    </div>
  );
}
