
# AI Agent Mastery - Next.js Frontend

This is the Next.js frontend application for the AI Agent Mastery course.

## Features

- **Documents Page**: View and manage meeting documents and transcripts
  - Table view with sorting and filtering
  - Inline editing capabilities
  - Split-screen detail view
  - Automatic filtering of SOPs and documents
  - Integration with Fireflies for meeting recordings

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account with database setup

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Setup

Ensure your Supabase database has the `document_metadata` table with the following columns:
- id (uuid, primary key)
- title (text)
- type (text)
- project (text)
- date (text)
- summary (text)
- fireflies_link (text)
- speakers (text[])
- transcript (text)
- created_at (timestamp)
- updated_at (timestamp)

## Available Scripts

- `npm run dev` - Run development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Database and real-time subscriptions
- **Radix UI** - Headless UI components
- **Lucide Icons** - Icon library
- **date-fns** - Date formatting

## Project Structure

```
src/
├── app/
│   ├── documents/
│   │   └── page.tsx      # Documents page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   └── ui/                # Reusable UI components
├── hooks/
│   └── use-toast.ts       # Toast notifications hook
└── lib/
    ├── supabase.ts        # Supabase client
    └── utils.ts           # Utility functions
```
