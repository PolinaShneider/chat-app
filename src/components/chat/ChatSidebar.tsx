"use client";

/**
 * M2: Sidebar with conversation list. Stub until useConversations is wired.
 */

type ConversationItem = {
  id: string;
  title: string;
  updatedAt: string;
};

type Props = {
  conversations?: ConversationItem[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onNewChat?: () => void;
  isLoading?: boolean;
};

export function ChatSidebar({
  conversations = [],
  selectedId = null,
  onSelect,
  onNewChat,
  isLoading = false,
}: Props) {
  return (
    <aside className="flex w-56 flex-col border-r border-zinc-200 bg-zinc-50 p-3">
      {onNewChat && (
        <button
          type="button"
          onClick={onNewChat}
          className="mb-3 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
        >
          New chat
        </button>
      )}
      {isLoading ? (
        <p className="text-xs text-zinc-500">Loading...</p>
      ) : (
        <ul className="space-y-1">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect?.(c.id)}
                className={`w-full rounded px-2 py-1.5 text-left text-sm ${
                  selectedId === c.id ? "bg-zinc-200 font-medium" : "hover:bg-zinc-100"
                }`}
              >
                {c.title || "Untitled"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
