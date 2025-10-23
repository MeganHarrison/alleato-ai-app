# Alleato AI Agents

Alleato AI Mastery is a production-ready AI agent system with a microservices architecture:
- **Frontend**: Next.js 14 with React 18, TypeScript, Tailwind CSS
- **Agent API**: FastAPI with Pydantic AI, multi-LLM support, streaming responses
- **RAG Pipeline**: Document processing with vector embeddings and insights generation

## Project Structure

```
Alleato AI Mastery/
│
├── 📄 Root Configuration
│   ├── CLAUDE.md                    # AI assistant guidance
│   ├── README.md                    # This file
│   ├── docker-compose.yml           # Docker compose configuration
│   ├── render.yaml                  # Render deployment config
│   └── package.json                 # Root package configuration
│
├── 📁 frontend/                     # Next.js 14 Frontend
│   ├── src/
│   │   ├── app/                     # App Router pages
│   │   │   ├── (tables)/           # Table management pages
│   │   │   ├── api/                # API routes
│   │   │   ├── auth/               # Authentication
│   │   │   ├── chatkit/            # Chat interface
│   │   │   └── dashboard/          # Dashboard
│   │   ├── components/             # React components
│   │   │   ├── ui/                 # UI component library
│   │   │   ├── tables/             # Table components
│   │   │   ├── chat/               # Chat components
│   │   │   └── sidebar/            # Navigation
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Utilities
│   │   │   └── supabase/           # Supabase client
│   │   └── types/                  # TypeScript types
│   ├── public/                     # Static assets
│   ├── tests/                      # Playwright tests
│   └── package.json               # Frontend dependencies
│
├── 📁 backend_agent_api/           # FastAPI Agent Backend
│   ├── agent_api.py               # Main API application
│   ├── agent.py                   # Agent implementation
│   ├── chatkit_backend.py         # ChatKit integration
│   ├── tools.py                   # Agent tools
│   ├── requirements.txt           # Python dependencies
│   └── tests/                     # Backend tests
│
├── 📁 backend_rag_pipeline/        # RAG Processing Pipeline
│   ├── docker_entrypoint.py       # Docker entry point
│   ├── generate_insights.py       # Insights generation
│   ├── process_all_docs.py        # Document processing
│   ├── Watchers/                  # File monitoring
│   │   ├── Google_Drive/
│   │   ├── Local_Files/
│   │   └── Supabase_Storage/
│   └── scripts/                   # Utility scripts
│
├── 📁 sql/                        # Database Schema
│   ├── 0-all-tables.sql          # Complete schema
│   ├── 1-16-*.sql                # Migration scripts
│   └── SCHEMA_MIGRATION_GUIDE.md  # Migration guide
│
└── 📁 docs/                       # Documentation
    ├── CHATKIT_INTEGRATION.md     # ChatKit guide
    └── deployment guides/         # Platform guides
```

### Key Directories

- **`frontend/`**: Next.js application with TypeScript, Tailwind CSS, and Supabase integration
- **`backend_agent_api/`**: FastAPI server handling AI agent interactions and tool execution
- **`backend_rag_pipeline/`**: Document processing pipeline with vector embeddings and insights
- **`sql/`**: PostgreSQL schema definitions and migration scripts
- **`docs/`**: Comprehensive documentation for setup and deployment