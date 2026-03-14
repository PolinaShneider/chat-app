"use client";

import type { RedactionSpan } from "@/types/chat";

/**
 * M3: Renders text with optional blurred/redacted spans. Click to reveal.
 * Stub: renders plain text for now.
 */

type Props = {
  text: string;
  redactionSpans?: RedactionSpan[];
  revealed?: Set<number>; // index into redactionSpans
  onToggleReveal?: (spanIndex: number) => void;
};

export function RedactedText({
  text,
  redactionSpans = [],
  revealed = new Set(),
  onToggleReveal,
}: Props) {
  if (redactionSpans.length === 0) {
    return <span>{text}</span>;
  }

  // TODO M3: split text by spans, render blurred segments with click handler
  return <span>{text}</span>;
}
