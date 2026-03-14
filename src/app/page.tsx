 "use client";

import { useState } from "react";

type ChatResponse = {
  content?: string;
  error?: string;
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [chatResult, setChatResult] = useState<ChatResponse | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<"unknown" | "ok" | "error">("unknown");
  const [dbError, setDbError] = useState<string | null>(null);

  async function checkHealth() {
    setDbError(null);
    try {
      const res = await fetch("/api/health");
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (data.ok) {
        setDbStatus("ok");
      } else {
        setDbStatus("error");
        setDbError(data.error ?? "Unknown error");
      }
    } catch (error) {
      setDbStatus("error");
      setDbError(error instanceof Error ? error.message : "Unknown error");
    }
  }

  async function sendPrompt() {
    if (!prompt.trim()) return;
    setChatLoading(true);
    setChatResult(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = (await res.json()) as ChatResponse & { details?: unknown };
      setChatResult({ content: data.content, error: data.error });
    } catch (error) {
      setChatResult({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-12 font-sans text-zinc-900">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Take‑Home Boilerplate: Next.js + Neon + LLM
          </h1>
          <p className="text-sm text-zinc-600">
            This page exercises the BFF layer by calling a database-backed health
            check and an LLM-powered chat endpoint.
          </p>
        </header>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium text-zinc-900">Database health</h2>
              <p className="text-xs text-zinc-600">
                Checks connectivity to the Neon Postgres database via a simple{" "}
                <code className="rounded bg-zinc-100 px-1 py-0.5 text-[0.7rem]">
                  select 1
                </code>{" "}
                query.
              </p>
            </div>
            <button
              type="button"
              onClick={checkHealth}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800"
            >
              Run health check
            </button>
          </div>
          <div className="mt-3 text-xs text-zinc-700">
            <span className="font-medium">Status:</span>{" "}
            {dbStatus === "unknown" && <span className="text-zinc-500">not checked</span>}
            {dbStatus === "ok" && <span className="text-emerald-600">ok</span>}
            {dbStatus === "error" && <span className="text-red-600">error</span>}
            {dbError && (
              <div className="mt-1 text-[0.7rem] text-red-600">
                {dbError}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-medium text-zinc-900">LLM chat</h2>
          <p className="mt-1 text-xs text-zinc-600">
            Sends your prompt to the server‑side{" "}
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-[0.7rem]">
              /api/chat
            </code>{" "}
            endpoint, which forwards it to the configured OpenAI model.
          </p>
          <div className="mt-3 space-y-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none ring-0 focus:border-zinc-400"
              placeholder="Ask the model something..."
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={sendPrompt}
                disabled={chatLoading || !prompt.trim()}
                className="rounded-md bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                {chatLoading ? "Sending..." : "Send to LLM"}
              </button>
              <span className="text-[0.7rem] text-zinc-500">
                Uses server-only OpenAI API key
              </span>
            </div>
          </div>

          {chatResult && (
            <div className="mt-4 rounded-md border border-zinc-100 bg-zinc-50 p-3 text-sm">
              {chatResult.error ? (
                <p className="text-red-600">
                  <span className="font-medium">Error:</span> {chatResult.error}
                </p>
              ) : (
                <p className="whitespace-pre-wrap text-zinc-800">
                  {chatResult.content || "(empty response)"}
                </p>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
