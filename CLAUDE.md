## Git Commit Rules

- Always use the commit message: `update`
- Never use any other commit message.
- Never include "Claude", "Claude Code", or any AI assistant name as the commit author or committer.
- Use the currently configured Git user.name and user.email, or require them to be configured before committing.
- Before committing, verify the author is not set to Claude or any AI-related identity.

## Port 3001 is reserved for this project's frontend

- This project's frontend (`frontend/package.json` `dev` script) always runs on `http://localhost:3001`. The backend's `WEB_ORIGIN` (`backend/.env`) is set to match for CORS.
- MCP servers, browser automation tools (e.g. Playwright), test runners, or any other tool/process must never start a server on port 3001 for other purposes — it must stay free for this project's frontend.
- If some other tool or MCP server needs a throwaway local server during a task, use a different port. If it must temporarily use 3001 for some unavoidable reason, kill that process immediately after the task completes so port 3001 is freed for this project again.
- The backend is likewise locked to port 4000 (`backend/src/config/env.ts`).
- `scripts/ensure-port.cjs` runs as `predev`/`prestart` in both packages: if the port is taken it alerts, kills the squatting process, and refuses to start if it can't free the port.
- Before starting the frontend dev server, check that port 3001 is free (and free it if something else is squatting on it) rather than falling back to a different port — this project must always be reachable at `localhost:3001`.
