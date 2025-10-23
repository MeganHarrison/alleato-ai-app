# Alleato AI – Agent Guidelines

## Repository scope
These instructions apply to the entire `alleato-ai-app` repository. Follow them in addition to any nested `AGENTS.md` files that might be introduced later.

## Workflow expectations
- Prefer focused changes and clear commit messages that describe the intent in the imperative mood.
- Keep generated artifacts (`node_modules`, `venv`, build outputs, `.env` files, Playwright traces, etc.) out of commits. If you add tooling that creates new artifacts, update the appropriate `.gitignore` entries.
- When you touch configuration or deployment scripts, document the impact in `docs/` or the relevant README so future changes stay traceable.

## Testing guidance
Run the targeted test suites before completion whenever you modify the corresponding areas:
- **Backend agent API (`backend_agent_api/`)** – `pytest backend_agent_api/tests`.
- **RAG pipeline (`backend_rag_pipeline/`)** – `pytest backend_rag_pipeline/tests`.
- **Frontend (`frontend/`)** – `pnpm install` (if dependencies change) and `pnpm test`.
- Mention any skipped checks in the final summary along with the reason.

## Code style & quality
- Stick with the existing linting/formatting approach for each language (e.g., Ruff/Black conventions for Python if already used, Prettier/ESLint defaults for TypeScript).
- Keep secrets and API keys in environment variables; never hard-code credentials or client secrets in the repo.
- Favor small, composable functions and modules so the services remain easy to audit.

## Documentation
- Update or create docs for new features or noteworthy behaviour changes. Place long-form references in `docs/` and keep READMEs concise with links to deeper material when needed.
