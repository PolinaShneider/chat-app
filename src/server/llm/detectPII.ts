/**
 * M3: Lightweight LLM call to detect PII. Option A: LLM returns exact PII strings;
 * we find all occurrences in the text and build spans. Word boundaries are accurate by construction.
 */

import OpenAI from "openai";
import { getEnv } from "@/server/env";
import type { RedactionSpan } from "@/types/chat";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (openaiClient) return openaiClient;
  const env = getEnv();
  openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return openaiClient;
}

/** Max length for a single PII phrase (reject oversized from LLM). */
const MAX_PII_PHRASE_LENGTH = 200;

/** Regex fallback when LLM fails; exact boundaries. */
function detectPIIRegex(text: string): RedactionSpan[] {
  const spans: RedactionSpan[] = [];
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  let m: RegExpExecArray | null;
  while ((m = emailRegex.exec(text)) !== null) {
    spans.push({ id: crypto.randomUUID(), start: m.index, end: m.index + m[0].length, type: "email" });
  }
  while ((m = phoneRegex.exec(text)) !== null) {
    spans.push({ id: crypto.randomUUID(), start: m.index, end: m.index + m[0].length, type: "phone" });
  }
  return spans;
}

/** Words we never treat as PII (case-insensitive). */
const NON_PII_WORDS = new Set(
  [
    "appointment", "appointments", "upcoming", "reschedule", "friendly", "please", "call", "questions",
    "reminder", "reminders", "dental", "office", "hello", "dear", "regards", "best", "thank", "looking",
    "forward", "seeing", "soon", "need", "have", "any", "us", "at", "your", "about", "from", "this",
    "that", "with", "for", "the", "and", "you", "we", "our", "to", "or", "if", "can", "just",
    "bright", "smiles", "time", "date", "place", "location", "information", "details",
  ].map((w) => w.toLowerCase())
);

function isBlocklisted(phrase: string): boolean {
  const t = phrase.trim().toLowerCase();
  if (!t || t.length <= 2) return true;
  if (NON_PII_WORDS.has(t)) return true;
  return false;
}

/** Find all occurrences of phrase in text; returns [start, end] pairs (end exclusive). */
function findAllOccurrences(text: string, phrase: string): { start: number; end: number }[] {
  if (!phrase) return [];
  const out: { start: number; end: number }[] = [];
  let pos = 0;
  while (pos < text.length) {
    const i = text.indexOf(phrase, pos);
    if (i === -1) break;
    out.push({ start: i, end: i + phrase.length });
    pos = i + 1;
  }
  return out;
}

/** Merge overlapping or adjacent spans; keep one span per contiguous redacted region. */
function mergeSpans(spans: RedactionSpan[]): RedactionSpan[] {
  if (spans.length <= 1) return spans;
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const merged: RedactionSpan[] = [];
  let current = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i]!;
    if (next.start <= current.end) {
      current.end = Math.max(current.end, next.end);
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);
  return merged;
}

type RawPIIItem = { value?: string; text?: string; type?: string };

/**
 * Option A: LLM returns exact PII strings; we find all occurrences and build spans.
 * On failure falls back to regex (email/phone only). Blocklist filters non-PII phrases.
 */
export async function detectPII(text: string): Promise<RedactionSpan[]> {
  if (!text.trim()) return [];

  const env = getEnv();
  const client = getOpenAIClient();

  const prompt = `You are a PII detector. Identify ONLY these PII types in the text: email addresses, phone numbers, and full person names (e.g. "Dr. Sarah Chen" or "John Smith"). Do NOT include generic words like "appointment", "upcoming", "reminder", "friendly", "please", "call", or business names like "Dental Office".
For each PII item, return the EXACT substring as it appears in the text (character-for-character, so we can find it).
Return ONLY a JSON array of objects: [{"value": "exact PII string from text", "type": "email"|"phone"|"name"}, ...].
If there is no PII, return [].
Text:
${text.slice(0, 8000)}`;

  try {
    const completion = await client.chat.completions.create({
      model: env.LLM_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return detectPIIRegex(text);

    const spans: RedactionSpan[] = [];
    for (const item of parsed as RawPIIItem[]) {
      const phrase = (item?.value ?? item?.text ?? "").trim();
      if (!phrase || phrase.length > MAX_PII_PHRASE_LENGTH) continue;
      if (isBlocklisted(phrase)) continue;

      const type = typeof item?.type === "string" ? item.type : "pii";
      const occurrences = findAllOccurrences(text, phrase);
      for (const { start, end } of occurrences) {
        spans.push({
          id: crypto.randomUUID(),
          start,
          end,
          type,
        });
      }
    }

    return mergeSpans(spans);
  } catch (err) {
    console.error("PII detection failed", err);
    return detectPIIRegex(text);
  }
}
