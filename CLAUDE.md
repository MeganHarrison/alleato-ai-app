# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alleato AI Mastery is a production-ready AI agent system with a microservices architecture:
- **Frontend**: Next.js 14 with React 18, TypeScript, Tailwind CSS
- **Agent API**: FastAPI with Pydantic AI, multi-LLM support, streaming responses
- **RAG Pipeline**: Document processing with vector embeddings and insights generation

## Common Development Commands

### Frontend Development
```bash
cd frontend
npm install                        # Install dependencies
npm run dev                        # Start dev server (http://localhost:3000)
npm run build                      # Build for production
npm run lint                       # Run linting
npm run test                       # Run all Playwright tests
npm run test:chatkit               # Run ChatKit-specific tests
```

### Backend Agent API
```bash
cd backend_agent_api
python -m venv venv                # Create virtual environment
source venv/bin/activate           # Activate (Unix) or venv\Scripts\activate (Windows)
pip install -r requirements.txt    # Install dependencies
./start_server.sh                  # Start the ChatKit backend server
```

### RAG Pipeline
```bash
cd backend_rag_pipeline
pip install -r requirements.txt    # Install dependencies
python docker_entrypoint.py        # Run the pipeline
python check_database_schema.py    # Verify database schema
python migrate_database_schema.py  # Run migrations
```

### Docker Development
```bash
docker-compose up -d               # Start all services
docker-compose logs -f             # View logs
docker-compose down                # Stop all services
docker-compose up -d --build       # Rebuild and start
```

## High-Level Architecture

### Service Communication Flow
```
User → Frontend (3000) → Agent API (8001) → LLM/Tools → Response
                              ↓
                         Memory Systems
                              ↓
                         Supabase DB
```

### Key Integration Points
1. **Supabase**: Authentication, database, real-time, storage
2. **LLM Providers**: OpenAI, OpenRouter, Ollama (configurable)
3. **Memory**: Short-term (in-memory), long-term (mem0), vector (pgvector)
4. **Tools**: RAG queries, web search, image analysis, code execution

### Database Architecture
- PostgreSQL via Supabase with pgvector extension
- Row-level security for multi-tenant isolation
- 16 migration scripts in `sql/` directory
- Vector embeddings support (384/1024/1536 dimensions)

## CRITICAL SUPABASE RULES - ALWAYS FOLLOW

### Before ANY Supabase work:
1. **FIRST UPDATE THE TYPES** - Always run:
   ```bash
   cd frontend
   npx supabase gen types typescript --project-id lgveqfnpkxvzbnnwuled > src/types/database.types.ts
   ```
   This ensures you have the most recent database schema

2. **THEN check `database.types.ts`** to verify:
   - The table exists
   - The exact table name (could be `files`, `file`, `documents`, etc.)
   - The exact column names and types
   - Whether IDs are string or number

3. **NEVER assume table/column names** - always verify in the freshly updated database.types.ts

## Testing Commands

### Run Single Tests
```bash
# Frontend
cd frontend
npm run test -- --grep "test name"

# Backend
cd backend_agent_api
pytest tests/test_specific.py::test_function_name
```

### Verify Functionality
```bash
cd frontend
node verify-env.js                 # Verify environment setup
node verify-tables.js              # Verify table functionality
node test-chatkit.js               # Test ChatKit integration
```

## Key Environment Variables

All services use the single root `.env` file (symlinked from each service directory).

Required in `.env`:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key
- `LLM_API_KEY` - OpenAI or other provider key
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Frontend Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Frontend anon key

Note: Each service directory (frontend, backend_agent_api, backend_rag_pipeline) has its `.env` or `.env.local` file symlinked to the root `.env` file for centralized configuration management.

## Project-Specific Documentation

- [OpenAI Agents Python](https://github.com/openai/openai-agents-python)
- [OpenAI Agents JS](https://openai.github.io/openai-agents-js/)
- [ChatKit Documentation](https://openai.github.io/chatkit-js/)
- [Supabase Table Debugging Guide](./frontend/docs/SUPABASE_TABLE_DEBUGGING.md)
- [Adding New Supabase Tables Guide](./frontend/docs/ADDING_SUPABASE_TABLES.md)

## Quick Scripts

### Create New Table Page
```bash
cd frontend
./scripts/new-table.sh table_name page-name "Page Title"
# Example: ./scripts/new-table.sh submittals submittals "Submittals"
```
This will create all necessary files and update types automatically.

## Important Code Conventions

### Frontend
- Components use TypeScript with strict typing
- Tailwind CSS for styling (avoid inline styles)
- Supabase client initialized in `lib/supabase/client.ts`
- Real-time subscriptions use Supabase channels

### Backend
- FastAPI with Pydantic models for validation
- Async/await for all I/O operations
- Comprehensive error handling with proper status codes
- Streaming responses use Server-Sent Events (SSE)

### Database
- All tables have `created_at` and `updated_at` timestamps
- Use UUIDs for primary keys
- Foreign keys reference `auth.users(id)`
- RLS policies enforce multi-tenant security

## Folder Structure Guidelines

### CRITICAL: Maintain Clean Organization

The codebase must follow these strict organizational rules to prevent the chaos of duplicate files and scattered functionality:

### 1. Standard Directory Structure

```
Alleato AI Mastery/
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js app router pages
│   │   │   ├── (auth)/            # Auth-related pages
│   │   │   ├── (dashboard)/       # Dashboard pages
│   │   │   ├── (tables)/          # All table-based pages
│   │   │   └── api/               # API routes
│   │   ├── components/
│   │   │   ├── ui/                # Reusable UI components
│   │   │   ├── auth/              # Auth-specific components
│   │   │   ├── chatkit/           # All ChatKit variants
│   │   │   ├── tables/            # Table components
│   │   │   └── shared/            # Shared components
│   │   ├── lib/                   # Client libraries (NOT utils)
│   │   │   └── supabase/          # Supabase client only
│   │   ├── types/                 # TypeScript types
│   │   │   └── database.types.ts  # ONLY location for DB types
│   │   └── actions/               # Server actions
│   ├── tests/                     # ALL frontend tests
│   │   ├── e2e/
│   │   ├── integration/
│   │   └── unit/
│   └── config/                    # Frontend configs
├── backend_agent_api/
│   ├── src/                       # Source code
│   ├── tests/                     # ALL backend tests
│   ├── config/                    # Configuration files
│   └── logs/                      # Log files
├── backend_rag_pipeline/
│   ├── src/                       # Source code
│   ├── tests/                     # ALL pipeline tests
│   ├── config/                    # Configuration files
│   └── logs/                      # Log files
├── sql/                          # Database migrations only
├── docs/                         # Project documentation
├── scripts/                      # Build/deployment scripts
└── config/                       # Root configuration
```

### 2. Naming Conventions

**ALWAYS use these patterns:**
- **Files**: `kebab-case.tsx` for React components, `snake_case.py` for Python
- **Directories**: `kebab-case` for all directories
- **Components**: `PascalCase.tsx` for component files
- **Actions**: `{resource}-actions.ts` (e.g., `project-actions.ts`)
- **Types**: `{resource}.types.ts` (e.g., `project.types.ts`)

**NEVER:**
- Use numbered suffixes (e.g., `projects2/`, `data-table2.tsx`)
- Mix test files with source code
- Create duplicate implementations
- Use special characters in names (no `~directory~`)

### 3. Component Organization Rules

**ChatKit Components:**
```
components/
└── chatkit/
    ├── ChatKitBase.tsx           # Base/shared functionality
    ├── ChatKitCustom.tsx         # Custom implementation
    ├── ChatKitDirect.tsx         # Direct implementation
    └── __tests__/                # ChatKit-specific tests
```

**Table Components:**
```
components/
└── tables/
    ├── base/
    │   ├── DataTable.tsx         # Generic table component
    │   └── EditableTable.tsx     # Generic editable table
    ├── project/
    │   └── ProjectTable.tsx      # Project-specific table
    └── __tests__/
```

### 4. Strict Rules for Common Issues

**Database Types:**
- ONLY use `/frontend/src/types/database.types.ts`
- Delete any other database type files immediately
- Always regenerate before Supabase work

**Test Files:**
- NEVER place test files at root level
- NEVER mix test files with source code
- ALL tests go in designated `tests/` directories

**Utilities and Libraries:**
- Use `/frontend/src/lib/` for client libraries
- NO `/frontend/src/utils/` directory
- Consolidate all utilities in `lib/`

**Configuration:**
- Environment files at root level only
- Service-specific configs in `{service}/config/`
- NO configuration files scattered in source directories

### 5. File Placement Decision Tree

When creating or moving a file, ask:
1. **Is it a test?** → Place in appropriate `tests/` directory
2. **Is it a component?** → Place in `components/` with proper subdirectory
3. **Is it a page?** → Place in `app/` following Next.js conventions
4. **Is it a server action?** → Place in `src/actions/`
5. **Is it a type definition?** → Place in `src/types/`
6. **Is it configuration?** → Place in appropriate `config/` directory
7. **Is it documentation?** → Place in `docs/`

### 6. Deduplication Protocol

**Before creating ANY new file:**
1. Search for existing implementations using Grep
2. Check for numbered variants (e.g., `component2.tsx`)
3. Verify no similar functionality exists in different locations
4. If duplicate found, enhance existing instead of creating new

**Common duplicates to watch for:**
- Projects/Projects2/Projects-Dashboard pages
- Multiple ChatKit implementations
- Scattered Supabase utilities
- Database type definitions

### 7. Archive and Cleanup Rules

**When deprecating code:**
1. Move to `/archive/` with date prefix: `2024-01-15-old-component.tsx`
2. Add deprecation notice in original location
3. Update all imports immediately
4. Delete from archive after 30 days

**Regular cleanup tasks:**
- Remove numbered file variants
- Consolidate duplicate implementations
- Move misplaced test files
- Update inconsistent naming