"use client";

import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { useChatStream } from "@/features/chat/hooks/useChatStream";
import { useConversations } from "@/features/chat/hooks/useConversations";
import { useState } from "react";

/**
 * Chat page. M1: single-thread stream. M2: sidebar + conversation selection.
 */
export default function ChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const { data: conversations = [], isLoading: conversationsLoading } = useConversations();
  const {
    messages,
    streamingContent,
    isStreaming,
    error,
    sendMessage,
  } = useChatStream();

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
          isLoading={conversationsLoading}
        />

        <main className="flex flex-1 flex-col overflow-hidden">
          <ChatMessageList
            messages={messages}
            streamingContent={streamingContent}
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
