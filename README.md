This is a small boilerplate for take‑home assignments built with the Next.js App Router, a simple BFF layer, Neon Postgres, and an OpenAI-backed chat endpoint.

The app uses:

- Next.js App Router (TypeScript, `src/` layout, `@/*` alias)
- BFF pattern via route handlers under `app/api`
- Neon Postgres through a lightweight `postgres` client (via `DATABASE_URL`)
- OpenAI chat completions via a server-only `/api/chat` route
- Environment variable validation with `zod`
- A tiny server-only example "model" under `src/server/bff` exposed via `/api/examples`

## Running locally

From the repository root:

```bash
yarn install
cp .env.example .env.local
```

Then edit `.env.local` to set:

- `DATABASE_URL` – your Neon Postgres connection string (pooled)
- `OPENAI_API_KEY` – your OpenAI API key
- `LLM_MODEL` – optional, defaults to `gpt-4.1-mini`

Finally, start the dev server:

```bash
yarn dev
```

Open `http://localhost:3000` to view the app. The home page is a demo harness only (no app-specific logic) and includes:

- A **Database health** panel that calls `GET /api/health` and runs a `select 1 as ok` query via the shared Neon `sql` helper.
- An **LLM chat** panel that calls `POST /api/chat` with `{ prompt }` and displays the model response.

All secrets remain server-side; the browser never sees `DATABASE_URL` or `OPENAI_API_KEY`.

## API overview (BFF pattern)

This project follows a Backend‑for‑Frontend (BFF) pattern: the frontend only talks to Next.js route handlers under `app/api`, and those handlers in turn talk to external services or server-only modules.

- `GET /api/health` – checks database connectivity using the shared Neon `sql` client.
- `POST /api/chat` – validates `{ prompt: string }` with `zod`, calls OpenAI's chat completions API using `env.OPENAI_API_KEY` and `env.LLM_MODEL`, and returns `{ content }` or `{ error, details }`. It uses the Node.js runtime and an `AbortController` with a 20s timeout.
- `GET /api/examples` – returns items from a simple in-memory model defined in `src/server/bff/example.ts`, demonstrating how to keep domain logic in server-only modules and expose them via the BFF.

## Deployment on Vercel

To deploy:

1. Push this project to a GitHub (or GitLab/Bitbucket) repository.
2. In the Vercel dashboard, import the repo.
3. In the project settings, add the following Environment Variables for the Production (and Preview) environments:
   - `DATABASE_URL`
   - `OPENAI_API_KEY`
   - `LLM_MODEL` (optional, e.g. `gpt-4.1-mini`)
4. Trigger a deployment. Vercel will detect the Next.js app and use the default build and dev commands (`yarn build`, `yarn dev`).

The route handlers are configured to run with the default Node.js runtime, which works well with the Neon `postgres` client and serverless environments.
