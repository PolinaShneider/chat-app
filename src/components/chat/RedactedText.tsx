"use client";

import React from "react";
import type { RedactionSpan } from "@/types/chat";
import { MarkdownMessage } from "./MarkdownMessage";

type Props = {
  text: string;
  redactionSpans?: RedactionSpan[];
  revealed?: Set<string>;
  onToggleReveal?: (spanId: string) => void;
};

type Segment =
  | { kind: "normal"; start: number; end: number }
  | { kind: "redacted"; start: number; end: number; span: RedactionSpan };

/** Merge overlapping or adjacent spans so each character is in at most one redacted segment. */
function mergeSpans(spans: RedactionSpan[], textLength: number): RedactionSpan[] {
  if (spans.length === 0) return [];
  if (spans.length === 1) {
    const s = spans[0];
    const start = Math.max(0, s.start);
    const end = Math.min(textLength, s.end);
    return start < end ? [{ ...s, start, end }] : [];
  }
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const merged: RedactionSpan[] = [];
  let current = { ...sorted[0], end: Math.min(textLength, sorted[0].end) };
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    const nextEnd = Math.min(textLength, next.end);
    if (next.start <= current.end) {
      current.end = Math.max(current.end, nextEnd);
    } else {
      merged.push(current);
      current = { ...next, end: nextEnd };
    }
  }
  merged.push(current);
  return merged;
}

function buildSegments(text: string, spans: RedactionSpan[]): Segment[] {
  if (spans.length === 0) return [{ kind: "normal", start: 0, end: text.length }];
  const merged = mergeSpans(spans, text.length);
  const out: Segment[] = [];
  let pos = 0;
  for (const span of merged) {
    if (span.start > pos) {
      out.push({ kind: "normal", start: pos, end: span.start });
    }
    out.push({ kind: "redacted", start: span.start, end: span.end, span });
    pos = Math.max(pos, span.end);
  }
  if (pos < text.length) {
    out.push({ kind: "normal", start: pos, end: text.length });
  }
  return out;
}

/**
 * M3: Renders text with blurred PII spans. Normal segments as plain text; redacted as blur, click to reveal/hide.
 */
export function RedactedText({
  text,
  redactionSpans = [],
  revealed = new Set(),
  onToggleReveal,
}: Props) {
  if (redactionSpans.length === 0) {
    return (
      <div className="prose prose-sm max-w-none font-sans text-zinc-900 [&_*]:break-words">
        <MarkdownMessage content={text} />
      </div>
    );
  }

  const segments = buildSegments(text, redactionSpans);

  return (
    <div className="prose prose-sm max-w-none font-sans text-zinc-900 [&_*]:break-words whitespace-pre-wrap">
      <span className="inline">
        {segments.map((seg, i) => {
          const segmentText = text.slice(seg.start, seg.end);
          if (seg.kind === "normal") {
            return (
              <span key={i} className="inline">
                {segmentText}
              </span>
            );
          }
          const isRevealed = revealed.has(seg.span.id);
          return (
            <span
              key={seg.span.id}
              role="button"
              tabIndex={0}
              className={
                isRevealed
                  ? "cursor-pointer select-none rounded px-0.5 inline"
                  : "cursor-pointer select-none rounded px-0.5 blur-sm hover:blur-[2px] inline"
              }
              onClick={() => onToggleReveal?.(seg.span.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggleReveal?.(seg.span.id);
                }
              }}
            >
              {segmentText}
            </span>
          );
        })}
      </span>
    </div>
  );
}
