"use client";

/**
 * M2: Sidebar with conversation list. ChatGPT-style three-dots menu.
 */

import { useEffect, useRef, useState } from "react";

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
  onDelete?: (id: string) => void;
  isDeletingId?: string | null;
  isLoading?: boolean;
};

export function ChatSidebar({
  conversations = [],
  selectedId = null,
  onSelect,
  onNewChat,
  onDelete,
  isDeletingId = null,
  isLoading = false,
}: Props) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openMenuId === null) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setOpenMenuId(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

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
            <li key={c.id} className="relative">
              <div
                className={`group/row flex items-center gap-0 rounded-md px-2 py-1.5 ${
                  selectedId === c.id ? "bg-zinc-200" : "hover:bg-zinc-100"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect?.(c.id)}
                  className={`min-w-0 flex-1 truncate text-left text-sm ${
                    selectedId === c.id ? "font-medium" : ""
                  }`}
                >
                  {c.title || "Untitled"}
                </button>
                {onDelete && (
                  <div
                    className="relative flex h-8 w-8 shrink-0 items-center justify-center"
                    ref={openMenuId === c.id ? menuRef : undefined}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId((prev) => (prev === c.id ? null : c.id));
                      }}
                      disabled={isDeletingId === c.id}
                      className={`rounded p-1 text-zinc-500 hover:text-zinc-700 disabled:opacity-50 ${
                        openMenuId === c.id ? "opacity-100" : "opacity-0 group-hover/row:opacity-100 hover:opacity-100"
                      }`}
                      title="Chat options"
                      aria-label="Chat options"
                      aria-expanded={openMenuId === c.id}
                    >
                      <EllipsisIcon className="h-5 w-5" />
                    </button>
                    {openMenuId === c.id && (
                      <div
                        className="absolute right-0 top-full z-10 mt-0.5 min-w-[180px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
                        role="menu"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(c.id);
                            setOpenMenuId(null);
                          }}
                          disabled={isDeletingId === c.id}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-zinc-100 disabled:opacity-50"
                        >
                          <TrashIcon className="h-4 w-4 shrink-0 text-red-600" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function EllipsisIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
