"use client";

/**
 * M2: TanStack Query hook for messages in a conversation.
 */

import { useQuery } from "@tanstack/react-query";
import { getMessages } from "@/lib/api/chat";

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getMessages(conversationId!),
    enabled: !!conversationId,
  });
}
