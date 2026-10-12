# Backend AI Interview Workspace

This repository is a starting scaffold for an AI-assisted backend interview. It provides a minimal TypeScript service running on Node 22.22.0 or newer with npm. The scaffold requires no Docker or external database.

The repository includes a baseline health server. The actual interview problem is provided separately by your interviewer.

## Setup and Verification

Clone the repository locally:

```bash
git clone https://github.com/aifian-dev/backend-ai-interview.git
cd backend-ai-interview
```

Complete preflight checks before your scheduled interview clock starts:

1. Run `npm ci` to install dependencies.
2. Run `npm run check` to verify TypeScript types.
3. Run `npm test` to run the automated test suite.
4. Run `npm start` to run the server via `tsx` on loopback `127.0.0.1:3000`. You can override the port by setting `PORT`.
5. Confirm server health in another terminal using `curl http://127.0.0.1:3000/health`.
6. Stop `npm start` with Ctrl+C before running `npm run dev` if you prefer automatic reload during development.

## Interview Workflow

Work in a fresh session with your preferred coding agent inside this repository.

1. Open `SESSION_PROMPT.md`, copy its entire content, and paste it into your agent session.
2. Append the private interview question to the designated section of the pasted prompt or provide it in your next message. Keep question text in the session context or a local untracked file. Never publish it.
3. Keep all work local. Do not create public forks, open public pull requests, or push solutions or logs to public repositories.
4. Your agent performs best-effort logging in a local file named `INTERVIEW_EVIDENCE.md`. Logging happens through normal agent turns and tool calls, not an independent background watcher, so occasional missing entries can occur.
5. When finished, send `INTERVIEW COMPLETE` to finalize the evidence log.

## Submission and Evaluation

Interviewers evaluate four transparent capability groups: delivery, backend reasoning, AI direction and verification, and ownership. Grading is performed separately by your interviewer after submission.

The `INTERVIEW_EVIDENCE.md` file is gitignored. When handing off your work, explicitly include it in your private submission along with your runnable source code, lockfile, tests, and start instructions. Exclude `node_modules`, secrets, and unrelated session history. Your interviewer will specify whether to deliver a private archive or a private link. You may also include an optional session transcript export for corroboration after inspecting it.

**Last updated:** 2026-10-12
