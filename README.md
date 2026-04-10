# Chat App

A full-stack chat application with streaming LLM responses, conversation persistence, and **PII detection and redaction** in assistant replies. Built with Next.js, Neon Postgres, and OpenAI.

**Live demo:** [https://chat-rmz4zdu7k-polinashneiders-projects.vercel.app/](https://chat-rmz4zdu7k-polinashneiders-projects.vercel.app/)

![Chat app screenshot](./assets/Screenshot%202026-03-14%20at%2014.19.05.png)

---

## Features

- **Streaming chat** – Real-time token streaming from OpenAI with a typing-style UI.
- **Conversations** – Multiple chats persisted in Neon Postgres; sidebar lists conversations and supports “New chat.”
- **PII redaction** – Assistant messages are scanned for names, emails, and phone numbers. Detected PII is blurred by default; users can click to reveal/hide (session-only, not persisted).
- **Chat management** – Delete a conversation (and all its messages) via a three-dots menu on each chat in the sidebar (ChatGPT-style).
- **Empty state** – Short description of the app plus example prompts (some designed to trigger PII in the reply, others generic); one click sends the prompt.
- **Markdown & line breaks** – Assistant replies render as markdown (GFM, sanitized) with preserved line breaks and relaxed spacing.
- **BFF pattern** – Frontend talks only to Next.js API routes; secrets stay server-side.

---

## Tech stack

| Layer        | Technology |
|-------------|------------|
| Framework   | Next.js 16 (App Router), React 19 |
| Language   | TypeScript |
| Database   | Neon Postgres (`postgres` client) |
| LLM        | OpenAI (chat completions, streaming) |
| Data fetching | TanStack Query |
| Styling    | Tailwind CSS v4 |
| Markdown   | react-markdown, remark-gfm, rehype-sanitize |

---

## Prerequisites

- **Node.js** 18+
- **Yarn**
- **Neon Postgres** – [neon.tech](https://neon.tech) (or any Postgres with a connection string)
- **OpenAI API key**

---

## Running locally

### 1. Clone and install

```bash
git clone <your-repo-url>
cd chat-app
yarn install
```

### 2. Environment variables

Copy the example env file and set your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

| Variable        | Description |
|----------------|-------------|
| `DATABASE_URL` | Neon Postgres connection string (pooled recommended) |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `LLM_MODEL`    | Optional; defaults to `gpt-4.1-mini` |

### 3. Database schema

Run the schema in the Neon SQL Editor (or your Postgres client). Schema is in `src/server/db/schema.sql`:

- **conversations** – `id`, `title`, `created_at`, `updated_at`
- **messages** – `id`, `conversation_id` (FK with `ON DELETE CASCADE`), `role`, `content`, `redaction_spans` (JSONB), `created_at`

### 4. Start the dev server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000). Use the sidebar to start or switch conversations, send messages, and try the example prompts to see PII redaction.

---

## API overview (BFF)

| Method | Route | Description |
|--------|--------|-------------|
| `GET`  | `/api/health` | Health check; runs `SELECT 1` against the DB. |
| `GET`  | `/api/conversations` | List conversations (sidebar). |
| `DELETE` | `/api/conversations/[id]` | Delete a conversation (messages removed via cascade). |
| `GET`  | `/api/conversations/[id]/messages` | Get messages for a conversation. |
| `POST` | `/api/chat/stream` | Streaming chat: sends user message + history, optional `conversationId`; creates conversation if needed; persists user + assistant messages; runs PII detection on assistant text and streams content with redaction metadata. |
| `POST` | `/api/chat` | Non-streaming chat (legacy/simple prompt → response). |
| `GET`  | `/api/examples` | Example items from server-only module (demo). |

---

## Project structure (high level)

```
src/
├── app/
│   ├── api/           # BFF routes (chat, conversations, health, examples)
│   ├── page.tsx       # Chat UI (sidebar + messages + input)
│   └── layout.tsx
├── components/chat/   # ChatSidebar, ChatMessageList, ChatInput, MarkdownMessage, RedactedText
├── features/chat/     # useChatStream, useConversations, useMessages, useDeleteConversation
├── lib/api/           # postChatStream, getConversations, getMessages, deleteConversation
├── server/
│   ├── db/            # getSql, schema; conversations.ts (CRUD + messages)
│   ├── env.ts         # Zod-validated env (DATABASE_URL, OPENAI_API_KEY, LLM_MODEL)
│   ├── llm/           # streamChat, detectPII
│   └── bff/           # example server-only module
└── types/chat.ts      # Message, RedactionSpan, etc.
```

---

## Deployment (Vercel)

1. Push the project to GitHub (or GitLab/Bitbucket).
2. In [Vercel](https://vercel.com), import the repository.
3. In **Project Settings → Environment Variables**, add for Production (and Preview if needed):
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `LLM_MODEL` (optional)
4. Deploy. Vercel will use the default Next.js build (`yarn build`).

Ensure the database schema has been applied to the Neon project linked by `DATABASE_URL`.

---

## Deployment (Netlify)

The repo includes `netlify.toml` with [`@netlify/plugin-nextjs`](https://github.com/netlify/netlify-plugin-nextjs) so Next.js runs on Netlify’s runtime.

1. In [Netlify](https://www.netlify.com), connect the repository (build command and publish directory are set in `netlify.toml`).
2. Add the same environment variables as for Vercel: `DATABASE_URL`, `OPENAI_API_KEY`, and optional `LLM_MODEL`.
3. Deploy.

---

## License

Private / as specified by the repository owner.
