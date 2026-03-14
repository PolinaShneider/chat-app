"use client";

/**
 * M2: TanStack Query hook for conversation list (sidebar).
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { deleteConversation as deleteConversationApi, getConversations } from "@/lib/api/chat";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteConversationApi,
    onSuccess: (_data, conversationId) => {
      queryClient.removeQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
