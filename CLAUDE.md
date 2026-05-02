# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev     # next dev (http://localhost:3000)
npm run build   # next build
npm start       # next start
npm run lint    # next lint (ESLint with next/core-web-vitals)
```

There is no test suite configured.

The Python service in `server/` is a separate Flask app, run independently:

```bash
python server/server.py   # binds 127.0.0.1:5000
```

## Architecture

AutoLMS is a Next.js 14 App Router app that turns lecture videos into educational resources (quiz, assignment, notes, project idea, exam paper, summary). TypeScript with `@/*` aliased to `src/*`.

### Generation pipeline

Single end-to-end flow used by `src/app/create/page.tsx`:

- User drops video files into `MultiFileDropzone` → a naming `Dialog` opens → uploaded to **EdgeStore** (`src/app/api/edgestore/[...edgestore]/route.ts`, mkv/mp4 only).
- Stored URLs are POSTed to `/api/video-audio`, which is now a **passthrough** that returns the original video URL (AssemblyAI accepts video URLs directly — the previous ApyHub video→audio step has been removed because its sync URL endpoint truncates long videos and no async/job variant exists).
- The video URL is POSTed to `/api/audio-text` → **AssemblyAI** transcription. The route retries up to 3× on transient `fetch failed` / `ECONNRESET` / etc. and uses an explicit 10-min poll timeout for long lectures.
- Transcript + per-resource prompts are POSTed in parallel to `/api/chatgpt` → **Vercel AI SDK** `generateText` against **Google Gemini** (`gemini-flash-latest` via `@ai-sdk/google`, free tier, no card). A strict system prompt forbids preambles and source-text references. Each selected built-in type (quiz/asgn/notes/proj/paper/summary) plus each non-empty custom prompt is one call.
- Custom resources include a self-validating instruction: the model must reply with literal `INVALID_RESOURCE` if the requested name isn't a real educational resource format; the frontend filters those out and surfaces them as a rejection message.
- Final resources are saved via the `createProject` server action.

### Auth + user sync

- **Clerk** is the identity provider. `src/middleware.ts` uses `authMiddleware` and lists public routes (`/`, `/community`, webhook endpoints, `/api/convert`, `/api/audio-text`).
- Clerk users are mirrored into MongoDB via the webhook at `src/app/api/webhook/clerk/route.ts`. It verifies Svix signatures and dispatches `user.created` / `user.updated` / `user.deleted` to server actions in `src/actions/user.action.ts`. After creating a Mongo user it writes the Mongo `_id` back into Clerk public metadata.
- Server code that needs the current user calls `getClerkUserId()` (which redirects to `/sign-in` if unauthenticated) and then `getUserById(clerkId)` to look up the Mongo document. Most foreign keys in `Project` reference the **Mongo** `_id`, not the Clerk id.

### Data layer

- **MongoDB via Mongoose**. `src/lib/mongoose.ts` caches the connection on `global.mongoose` to survive Next.js HMR — always go through `connectToDatabase()` rather than calling `mongoose.connect` directly.
- Models: `src/database/user.model.ts` and `src/database/projects.model.ts`. Both use the `models.X || model("X", schema)` pattern to avoid OverwriteModelError on hot reload.
- `Project.author` is a `Schema.Types.ObjectId` ref → `User`. When fetching projects, populate `author` and select only `_id username picture clerkId`.
- All server actions in `src/actions/` are `"use server"`, return `JSON.parse(JSON.stringify(...))` to strip Mongoose internals before sending to client components, and call `revalidatePath` when mutating.
- `@vercel/postgres` is in `package.json` but **not used** — Mongo is the only live database.

### File storage

- **EdgeStore** for video uploads. The router in `src/app/api/edgestore/[...edgestore]/route.ts` defines a single `publicFiles` bucket scoped by Clerk `userId`, restricted to `video/mkv` and `video/mp4`. The client provider is wired in `src/app/layout.tsx` and exposed via `useEdgeStore()` from `src/lib/edgestore.ts`.

### UI

- **shadcn/ui** with Tailwind. Config in `components.json` (style: default, base color: slate, css vars enabled). Generated primitives live in `src/components/ui/`; bespoke components in `src/components/`.
- Theming via `next-themes` (`Theme-provider.tsx`) with `class` attribute strategy.
- Toasts use the shadcn `useToast` hook + `<Toaster />` mounted in the root layout.

## Things to know before changing code

- `.env.local` is checked in and contains live-looking secrets (Clerk, OpenAI, AssemblyAI keys are also hard-coded inside `src/app/api/audio-text/route.ts` and `src/app/api/video-audio/route.ts`, and the Python server). Treat anything you find in this file as a credential to avoid logging/echoing, and prefer `process.env.*` over inlining when adding new code.
- `src/app/create/page.tsx` uses browser globals (`document.getElementById`, direct DOM mutation) alongside React state — the existing pattern is intentional but fragile. Prefer state-driven updates for new code, and don't assume refs exist.
- Server actions return `undefined` on error (errors are caught and `console.log`'d). Callers in pages/components rarely null-check; if you depend on a return value, check it.
- The `(auth)` route group holds Clerk's catch-all sign-in/sign-up pages at `[[...sign-in]]` / `[[...sign-up]]`.
