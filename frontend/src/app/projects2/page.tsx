"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Briefcase,
  Building,
  Calendar,
  ChevronRight,
  DollarSign,
  FileText,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Project {
  id: string;
  name: string;
  phase: string;
  category?: string;
  description?: string;
  "est revenue"?: number;
  address?: string;
  state?: string;
  clients?: {
    id: number;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
}

interface ProjectWithDetails extends Project {
  meetings?: any[];
  documents?: any[];
  insights?: any[];
}

function getStatusColor(phase: string) {
  const statusMap: Record<string, string> = {
    Planning: "bg-blue-100 text-blue-800 border-blue-200",
    Current: "bg-green-100 text-green-800 border-green-200",
    "On Hold": "bg-yellow-100 text-yellow-800 border-yellow-200",
    Complete: "bg-gray-100 text-gray-800 border-gray-200",
    Lost: "bg-red-100 text-red-800 border-red-200",
  };
  return statusMap[phase] || "bg-gray-100 text-gray-800 border-gray-200";
}

function formatCurrency(amount: number | null | undefined) {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectDetailsLoading, setProjectDetailsLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      // Auto-select the first project
      handleProjectSelect(projects[0]);
    }
  }, [projects, selectedProject]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          clients (
            id,
            name
          )
        `)
        .in("phase", ["Current", "Planning", "On Hold"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
        return;
      }

      if (data) {
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = async (project: Project) => {
    try {
      setProjectDetailsLoading(true);
      const supabase = createClient();

      // Fetch detailed project info with related data
      const [projectResponse, meetingsResponse, documentsResponse, insightsResponse] = await Promise.all([
        supabase
          .from("projects")
          .select(`
            *,
            clients (
              id,
              name,
              status
            )
          `)
          .eq("id", project.id)
          .single(),
        supabase
          .from("documents")
          .select("*")
          .eq("project_id", project.id)
          .eq("category", "meeting")
          .order("date", { ascending: false })
          .limit(5),
        supabase
          .from("documents")
          .select("*")
          .eq("project_id", project.id)
          .neq("category", "meeting")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("ai_insights")
          .select(`
            *,
            projects:project_id(id, name)
          `)
          .eq("project_id", project.id)
          .order("created_at", { ascending: false })
          .limit(10)
      ]);

      if (projectResponse.data) {
        const projectWithDetails: ProjectWithDetails = {
          ...projectResponse.data,
          meetings: meetingsResponse.data || [],
          documents: documentsResponse.data || [],
          insights: insightsResponse.data || [],
        };
        setSelectedProject(projectWithDetails);
      }
    } catch (error) {
      console.error("Failed to fetch project details:", error);
    } finally {
      setProjectDetailsLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.clients?.name?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Projects List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Projects</h1>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Projects List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleProjectSelect(project)}
                className={cn(
                  "p-4 rounded-lg border cursor-pointer transition-all duration-200 mb-2",
                  selectedProject?.id === project.id
                    ? "border-blue-200 bg-blue-50 shadow-sm"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
                    {project.name}
                  </h3>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={cn("text-xs", getStatusColor(project.phase))}>
                      {project.phase}
                    </Badge>
                    {project["est revenue"] && (
                      <span className="text-xs font-medium text-gray-600">
                        {formatCurrency(project["est revenue"])}
                      </span>
                    )}
                  </div>
                  
                  {project.clients?.name && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Building className="h-3 w-3" />
                      <span className="truncate">{project.clients.name}</span>
                    </div>
                  )}
                  
                  {project.category && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Briefcase className="h-3 w-3" />
                      <span>{project.category}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Project Details */}
      <div className="flex-1 flex flex-col">
        {selectedProject ? (
          projectDetailsLoading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Project Header */}
              <div className="bg-white border-b border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                      {selectedProject.name}
                    </h1>
                    {selectedProject.description && (
                      <p className="text-gray-600 mb-3">{selectedProject.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {selectedProject.clients?.name && (
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          <span>{selectedProject.clients.name}</span>
                        </div>
                      )}
                      {selectedProject.category && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{selectedProject.category}</span>
                        </div>
                      )}
                      {(selectedProject.address || selectedProject.state) && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{selectedProject.state || selectedProject.address}</span>
                        </div>
                      )}
                      {selectedProject.created_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Created {format(new Date(selectedProject.created_at), "MMM d, yyyy")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={cn("text-sm px-3 py-1", getStatusColor(selectedProject.phase))}>
                      {selectedProject.phase}
                    </Badge>
                    {selectedProject["est revenue"] && (
                      <div className="text-right">
                        <div className="text-2xl font-semibold text-gray-900">
                          {formatCurrency(selectedProject["est revenue"])}
                        </div>
                        <div className="text-xs text-gray-500">Est. Revenue</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Project Details Content */}
              <ScrollArea className="flex-1 p-6">
                <div className="grid gap-6">
                  {/* Recent Meetings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Recent Meetings
                        <Badge variant="secondary" className="ml-auto">
                          {selectedProject.meetings?.length || 0}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedProject.meetings && selectedProject.meetings.length > 0 ? (
                        <div className="space-y-3">
                          {selectedProject.meetings.slice(0, 5).map((meeting) => (
                            <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <h4 className="font-medium text-sm">{meeting.title || 'Untitled Meeting'}</h4>
                                {meeting.date && (
                                  <p className="text-xs text-gray-500">
                                    {format(new Date(meeting.date), "MMM d, yyyy h:mm a")}
                                  </p>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No meetings found</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Documents */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Recent Documents
                        <Badge variant="secondary" className="ml-auto">
                          {selectedProject.documents?.length || 0}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedProject.documents && selectedProject.documents.length > 0 ? (
                        <div className="space-y-3">
                          {selectedProject.documents.slice(0, 5).map((document) => (
                            <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <h4 className="font-medium text-sm">{document.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{document.category}</span>
                                  {document.created_at && (
                                    <>
                                      <span>•</span>
                                      <span>{format(new Date(document.created_at), "MMM d, yyyy")}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No documents found</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recent Insights */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        AI Insights
                        <Badge variant="secondary" className="ml-auto">
                          {selectedProject.insights?.length || 0}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedProject.insights && selectedProject.insights.length > 0 ? (
                        <div className="space-y-3">
                          {selectedProject.insights.slice(0, 5).map((insight) => (
                            <div key={insight.id} className="p-3 border rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-sm line-clamp-1">
                                  {insight.title || insight.description}
                                </h4>
                                <Badge 
                                  variant="secondary" 
                                  className={cn(
                                    "text-xs",
                                    insight.severity === 'high' ? 'bg-red-100 text-red-700' :
                                    insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  )}
                                >
                                  {insight.severity}
                                </Badge>
                              </div>
                              {insight.description && insight.title && (
                                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                  {insight.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span className="capitalize">{insight.insight_type?.replace('_', ' ')}</span>
                                {insight.created_at && (
                                  <span>{format(new Date(insight.created_at), "MMM d")}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No insights found</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </>
          )
        ) : (
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">📁</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a project
              </h3>
              <p className="text-gray-600">
                Choose a project from the list to view its details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}