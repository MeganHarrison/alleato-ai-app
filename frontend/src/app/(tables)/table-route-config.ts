export type TableRouteMeta = {
  title: string
  description: string
}

export const TABLE_ROUTE_CONFIG = {
  "/projects": {
    title: "Projects",
    description: "Manage project information, budgets, and progress tracking"
  },
  "/companies": {
    title: "Companies",
    description: "Manage company profiles, contacts, and business relationships"
  },
  "/contacts": {
    title: "Contacts",
    description: "Manage individual contacts and their associated information"
  },
  "/documents": {
    title: "Documents",
    description: "Manage and view all documents in the system"
  },
  "/document-metadata": {
    title: "Document Metadata",
    description: "Review extracted metadata for uploaded project documents"
  },
  "/employees": {
    title: "Employees",
    description: "Manage employee information and organizational structure"
  },
  "/clients": {
    title: "Clients",
    description: "Manage client relationships and project assignments"
  },
  "/prospects": {
    title: "Prospects",
    description: "Track potential clients and sales opportunities"
  },
  "/sales": {
    title: "Sales",
    description: "Monitor sales activities, deals, and revenue tracking"
  },
  "/team": {
    title: "Team",
    description: "Manage team members, roles, and staffing details"
  },
  "/subcontractors": {
    title: "Subcontractors",
    description: "Manage subcontractor relationships and project assignments"
  },
  "/notion-projects": {
    title: "Notion Projects",
    description: "Sync and manage projects from the Notion workspace"
  },
  "/project-tasks": {
    title: "Project Tasks",
    description: "Track and manage individual project tasks and deliverables"
  },
  "/project-insights": {
    title: "Project Insights",
    description: "Analyze insights derived from project meetings and documents"
  },
  "/meetings": {
    title: "Meetings",
    description: "Browse meeting records, summaries, and associated documents"
  },
  "/fm-global-figures": {
    title: "FM Global Figures",
    description: "Review FM Global performance figures and key metrics"
  },
  "/fm-global-tables": {
    title: "FM Global Tables",
    description: "Explore FM Global data tables and benchmarks"
  },
  "/ai-insights": {
    title: "AI Insights",
    description: "AI-generated insights from meeting transcripts and project documents"
  }
} satisfies Record<string, TableRouteMeta>

export type TableRoutePath = keyof typeof TABLE_ROUTE_CONFIG

export function matchTableRoute(pathname: string) {
  return Object.entries(TABLE_ROUTE_CONFIG).find(([route]) =>
    pathname.startsWith(route)
  ) ?? null
}

export function getTableRouteMeta(path: string): TableRouteMeta | null {
  if (path in TABLE_ROUTE_CONFIG) {
    return TABLE_ROUTE_CONFIG[path as TableRoutePath]
  }

  return null
}
