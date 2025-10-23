# Alleato AI Codebase Audit

_Audit date: 2025-03-06_

## Architecture overview
- The repository is organised as a microservice-style workspace with a Next.js 14 frontend (`frontend/`), a FastAPI-based agent gateway (`backend_agent_api/`), and a Python RAG/insights pipeline (`backend_rag_pipeline/`).
- Shared SQL schema files live under `sql/`, and deployment helpers (Docker Compose, Render configs, Caddy) are kept at the repository root.

## Backend agent API
- Global singletons for the Supabase client, HTTP client, and embeddings are created in the FastAPI lifespan hook and reused across requests (`backend_agent_api/agent_api.py`). This improves start-up cost but complicates testability and error handling when initialisation fails.
- The service validates user tokens by calling Supabase with the **service role key** (`SUPABASE_SERVICE_KEY`), exposing high-privilege credentials to the runtime and logging layer (`backend_agent_api/agent_api.py`).
- Memory persistence via `mem0` is currently stubbed (`mem0_client = None`), and the optional insights worker is fully disabled, so conversation history beyond Supabase storage is inactive (`backend_agent_api/agent_api.py`).
- The agent layer defaults to an undefined `gpt-5` model and re-imports `web_search_tool` twice, signalling configuration debt and dead code (`backend_agent_api/agent.py`).
- Several tools assume configuration is present; for example `web_search_tool` falls back to SearXNG without checking whether a base URL is configured, which will raise at runtime when both Brave and SearXNG credentials are missing (`backend_agent_api/tools.py`).

## RAG & insights pipeline
- Batch scripts such as `process_all_docs.py` and `quick_insights.py` import `core.database` and `core.utils`, but that module tree is absent from the repository, so the scripts cannot run without additional, undocumented dependencies (`backend_rag_pipeline/process_all_docs.py`).
- The enhanced business insights engine expects OpenAI credentials at runtime and directly instantiates an async client, making offline or mock testing difficult (`backend_rag_pipeline/insights/enhanced/business_insights_engine.py`).

## Frontend
- The ChatKit hybrid wrapper ignores its `useRealChatKit` flag and always renders the custom chat component, so the documented fallback never triggers (`frontend/src/components/ChatKitHybrid.tsx`).
- `AgentBuilderChat` hard-codes a workflow ID and will send `Bearer test-session` headers whenever session bootstrap fails, which masks errors and opens the door to unauthorised backend access during failures (`frontend/src/components/AgentBuilderChat.tsx`).
- Build tooling disables Next.js linting during production builds (`DISABLE_ESLINT_PLUGIN=true`), reducing static analysis coverage (`frontend/package.json`).

## Infrastructure & developer experience
- The top-level `.gitignore` only excludes `CLAUDE.md`, leaving `node_modules/`, virtual environments, and other artefacts unignored. Large directories are already present in the working tree as untracked files.
- Multiple service directories include generated files (`logs/`, `venv/`, `node_modules/`) that should be excluded from version control to keep diffs manageable.

## Testing landscape
- Unit tests exist for backend clients, tools, and parts of the RAG pipeline, but there are no integration or end-to-end tests covering the FastAPI streaming endpoints or the ChatKit UI flows.
- The frontend relies entirely on Playwright scripts; linting is optional because it is disabled in the production build command.

## Recommendations summary
1. Harden authentication by avoiding direct use of the Supabase service role key for token verification and by tightening CORS defaults in `agent_api.py`.
2. Restore runtime memory support or remove the unused `mem0` scaffolding; re-enable or document the insights worker status.
3. Guard third-party tool integrations against missing configuration (Brave/SearXNG keys) to prevent runtime failures in `web_search_tool`.
4. Provide or vendor the missing `core` utilities used by the RAG scripts so the batch jobs can execute out of the box.
5. Respect the `useRealChatKit` flag and replace the `test-session` fallback with explicit error handling to keep the ChatKit integration secure.
6. Reinstate linting during builds and expand the automated test suite to include backend integration coverage.
7. Expand `.gitignore` to exclude build artefacts (`node_modules/`, `venv/`, logs) and clean the repository state.
