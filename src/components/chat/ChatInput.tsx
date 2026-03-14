"use client";

import { useState, useCallback } from "react";

type Props = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

/** Chat input + send. Replace with shadcn Input/Button when implementing. */
export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(() => {
    const t = value.trim();
    if (!t || disabled) return;
    onSend(t);
    setValue("");
  }, [value, disabled, onSend]);

  return (
    <div className="flex gap-2 border-t border-zinc-200 bg-white p-4">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Type a message..."
        rows={2}
        className="flex-1 resize-none rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:bg-zinc-300"
      >
        Send
      </button>
    </div>
  );
}
