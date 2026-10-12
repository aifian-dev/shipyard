# Shipyard

This repository is a starter scaffold for an AI-assisted backend interview. It provides a prepared TypeScript and Fastify service running on Node 22.22.0 or newer with pnpm 12.11.2. You do not need Docker or an external database to run this workspace.

The repository includes a baseline HTTP health server, type checking, HTTP tests, and a SQLite connection helper at `src/database.ts`. The helper uses Node’s built-in SQLite module and defaults to `.data/app.sqlite` (override with `DATABASE_PATH`); the exercise schema is yours to implement. SQLite tests create disposable local databases. Node may print an SQLite experimental warning; that warning alone is not a test failure. The interview problem is provided separately by your interviewer.

## Setup and Preflight Verification

Clone the repository locally before your interview starts:

```bash
git clone https://github.com/aifian-dev/shipyard.git
cd shipyard
```

Complete these preflight checks before your scheduled interview clock starts. If pnpm is unavailable or its Corepack shim fails, use `npx --yes pnpm@12.11.2` in place of `pnpm` in each command below. The repository pins this pnpm version and includes its lockfile. npm is also supported through `npm ci`, `npm run check`, `npm test`, `npm start`, and `npm run handoff`.

1. Install dependencies:
   ```bash
   pnpm install --frozen-lockfile
   ```
2. Check TypeScript types:
   ```bash
   pnpm check
   ```
3. Run the automated test suite:
   ```bash
   pnpm test
   ```
4. Start the service:
   ```bash
   pnpm start
   ```
   The service listens on loopback `127.0.0.1:3000`. You can override the port by setting the `PORT` environment variable.
5. In another terminal, verify the server responds:
   ```bash
   curl http://127.0.0.1:3000/health
   ```
6. Stop the server with `Ctrl+C`. During development, you can use `pnpm dev` if you prefer automatic reloads.

## Interview Workflow

You may use your preferred AI coding tool.

### Candidate Setup

1. Open a fresh coding agent with this repository as your working directory.
2. Send the agent this exact prompt:
   ```
   Read SESSION_PROMPT.md and follow it for this interview. Initialize the evidence file, then wait for the problem.
   ```
   *(If your agent cannot read workspace files directly, paste the full contents of `SESSION_PROMPT.md` instead.)*
3. The agent will read the protocol, initialize the evidence file, and wait for the problem.
4. Once ready, provide the interviewer's private question either by pasting it into chat or saving it to `.interview/question.md`. Never edit `SESSION_PROMPT.md` to insert the question.

Keep all work local. Do not create public forks, open public pull requests, or push solutions or logs to public repositories. Your assistant records checkpoints in `INTERVIEW_EVIDENCE.md` on a best-effort basis through normal tool calls; there is no independent background watcher.

When finished, send `INTERVIEW COMPLETE` to the assistant.

## Finalization and Packaging

When you declare completion:

1. Your assistant stops code changes, runs final verification checks and a live demonstration, writes `HANDOFF.md`, and finalizes `INTERVIEW_EVIDENCE.md`.
2. The assistant runs the packaging script:
   ```bash
   pnpm handoff
   ```
   This command creates an uncommitted output directory under `.interview/handoff-<unique>/submission/` containing your runnable code, tests, configuration, `INTERVIEW_EVIDENCE.md`, and `HANDOFF.md`. If system `tar` is available, it also creates `submission.tar.gz` beside the folder.
3. The packager includes tracked files and nonignored untracked files from your current working tree (including uncommitted changes), but excludes `.git`, `node_modules`, build artifacts, coverage reports, `.interview`, `.env*`, `.npmrc`, secrets, credentials, private keys, database files, runtime data, transcripts, and symlinks.
4. Explicitly unignore any solution source required to run your work before packaging. A generated `MANIFEST.json` records every included file path and SHA256 checksum, along with your base git commit and working tree dirty state.
5. If the script reports missing or blank documentation files, update the required document and run `pnpm handoff` again.
6. Inspect `MANIFEST.json` and the packaged contents before handing them off. Automated filename filters cannot catch credentials embedded inside regular source files, so confirm your package contains all files required to run your solution and no private keys or tokens.

## Submission and Evaluation

Deliver `submission.tar.gz` (or the `submission/` folder if tar was not available) through the private channel approved by your interviewer. Do not push your code, evidence logs, or handoff documents to any public repository.

Interviewers evaluate four transparent capability groups:

- **Delivery**: runnable code, test coverage, setup instructions, and solution completeness.
- **Backend reasoning**: architecture, modularity, data handling, and error handling.
- **AI direction and verification**: task framing, tool steering, validation rigor, and repair oversight.
- **Ownership**: trade-off awareness, edge-case coverage, and operational clarity.

Your coding assistant records factual evidence only. All evaluation, scoring, and hiring decisions are performed separately by your interviewer.

**Last updated:** 2026-10-12
