"use client";

/**
 * M2: TanStack Query hook for conversation list (sidebar).
 */

import { useQuery } from "@tanstack/react-query";
import { getConversations } from "@/lib/api/chat";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });
}
