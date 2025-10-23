import type { ReactElement } from "react";
import { fetchNotionProjects } from "@/app/actions/notion-projects-actions";
import { NotionProjectsTable } from "@/components/tables/notion-projects-table";
import { PageHeader } from "@/components/page-header";
import { RefreshButton } from "@/components/notion-projects/refresh-button";

export const dynamic = "force-dynamic";

/**
 * Page component to display Notion projects in a table format
 * 
 * Fetches projects from Notion database and displays them with proper error handling
 */
export default async function NotionProjectsPage(): Promise<ReactElement> {
  const { projects, error } = await fetchNotionProjects();

  return (
    <div className="space-y-4 p-2 sm:p-4 md:p-6 w-[95%] sm:w-full mx-auto">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <PageHeader 
            title="Notion Projects" 
            description="View and manage projects synchronized from your Notion database" 
          />
        </div>
        <RefreshButton />
      </div>

      {/* Error Display */}
      {error ? (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
          <h3 className="font-medium">Error loading Notion projects</h3>
          <p className="text-sm mt-1">{error}</p>
          <div className="text-sm mt-3 space-y-1">
            <p className="font-medium">Setup instructions:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Add your Notion integration token to your environment variables as <code className="bg-red-100 px-1 rounded">NOTION_TOKEN</code></li>
              <li>Add your projects database ID as <code className="bg-red-100 px-1 rounded">NOTION_DATABASE_ID</code></li>
              <li>Make sure your Notion integration has access to the projects database</li>
              <li>Ensure your database has the expected properties: Name (title), Status (select), Priority (select), Assignee (people), Due Date (date), Description (rich text)</li>
            </ol>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Display */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card text-card-foreground p-4 rounded-lg border">
              <div className="text-2xl font-bold">{projects.length}</div>
              <div className="text-sm text-muted-foreground">Total Projects</div>
            </div>
            <div className="bg-card text-card-foreground p-4 rounded-lg border">
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status?.toLowerCase() === "in progress" || p.status?.toLowerCase() === "active").length}
              </div>
              <div className="text-sm text-muted-foreground">Active Projects</div>
            </div>
            <div className="bg-card text-card-foreground p-4 rounded-lg border">
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status?.toLowerCase() === "completed" || p.status?.toLowerCase() === "done").length}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="bg-card text-card-foreground p-4 rounded-lg border">
              <div className="text-2xl font-bold">
                {projects.filter(p => p.priority?.toLowerCase() === "high" || p.priority?.toLowerCase() === "urgent").length}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
          </div>

          {/* Projects Table */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Projects Overview</h2>
            <NotionProjectsTable projects={projects} />
          </div>
        </>
      )}
    </div>
  );
}