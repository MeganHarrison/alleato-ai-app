"use client";

import { ReactElement, useMemo } from "react";
import { type ProjectData } from "@/utils/notion/projects";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, User } from "lucide-react";
import { format, parseISO } from "date-fns";

interface NotionProjectsTableProps {
  projects: ProjectData[];
}

/**
 * Table component to display Notion projects with proper formatting and styling
 */
export function NotionProjectsTable({ projects }: NotionProjectsTableProps): ReactElement {
  // Pre-compute timestamps for better performance
  const projectsWithTimestamps = useMemo(() => 
    projects.map(project => ({
      ...project,
      lastEditedTimestamp: new Date(project.lastEditedTime).getTime(),
    })), [projects]
  );

  const sortedProjects = useMemo(() => {
    return [...projectsWithTimestamps].sort((a, b) => 
      b.lastEditedTimestamp - a.lastEditedTimestamp
    );
  }, [projectsWithTimestamps]);

  const getStatusBadgeVariant = (status: string | null): "default" | "secondary" | "destructive" | "outline" => {
    if (!status) return "outline";
    
    switch (status.toLowerCase()) {
      case "completed":
      case "done":
        return "default";
      case "in progress":
      case "active":
        return "secondary";
      case "blocked":
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPriorityBadgeVariant = (priority: string | null): "default" | "secondary" | "destructive" | "outline" => {
    if (!priority) return "outline";
    
    switch (priority.toLowerCase()) {
      case "high":
      case "urgent":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "—";
    
    try {
      return format(parseISO(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No projects found in the Notion database.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Project Name</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[100px]">Priority</TableHead>
            <TableHead className="w-[150px]">Assignee</TableHead>
            <TableHead className="w-[120px]">Due Date</TableHead>
            <TableHead className="w-[200px]">Description</TableHead>
            <TableHead className="w-[120px]">Last Updated</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProjects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span className="truncate">{project.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(project.status)}>
                  {project.status || "No Status"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getPriorityBadgeVariant(project.priority)}>
                  {project.priority || "No Priority"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  {project.assignee ? (
                    <>
                      <User className="h-3 w-3" />
                      <span className="truncate">{project.assignee}</span>
                    </>
                  ) : (
                    "Unassigned"
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  {project.dueDate ? (
                    <>
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(project.dueDate)}</span>
                    </>
                  ) : (
                    "No due date"
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                  {project.description || "No description"}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(project.lastEditedTime)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (project.url) {
                      const newWindow = window.open(project.url, "_blank", "noopener,noreferrer");
                      if (newWindow) {
                        newWindow.opener = null;
                      }
                    }
                  }}
                  className="h-8 w-8 p-0"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">Open in Notion</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}