"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AddProjectButton } from "@/components/table-buttons/add-project-button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Briefcase,
  Building,
  DollarSign,
  MapPin,
  Search,
} from "lucide-react";
import Link from "next/link";

interface Project {
  id: number;
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
  } | null;
  created_at?: string;
}

function getStatusColor(phase: string) {
  const statusMap: Record<string, string> = {
    Planning: "bg-brand-100 text-brand-800 border-brand-200",
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

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'yesterday' | 'thisWeek'>('today');

  useEffect(() => {
    fetchData();
  }, [showOnlyActive]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch projects
      let projectQuery = supabase.from("projects").select(`
        *,
        clients (id, name)
      `);

      if (showOnlyActive) {
        projectQuery = projectQuery.in("phase", ["Current", "Planning", "On Hold"]);
      }

      const { data: projectData } = await projectQuery
        .order("created_at", { ascending: false })
        .limit(6);

      // Fetch meetings - using 'date' field since 'meeting_date' doesn't exist
      const { data: meetingData } = await supabase
        .from('documents')
        .select(`
          id, title, date, created_at, category,
          projects(id, name)
        `)
        .eq('category', 'meeting')
        .not('date', 'is', null)
        .order('date', { ascending: false })
        .limit(8);

      // Fetch insights with project information
      const { data: insightData } = await supabase
        .from('ai_insights')
        .select(`
          id, description, insight_type, severity, created_at, project_id,
          projects:project_id(id, name)
        `)
        .order('created_at', { ascending: false })
        .limit(6);

      if (projectData) setProjects(projectData);
      if (meetingData) setMeetings(meetingData);
      if (insightData) setInsights(insightData);

    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setMeetingsLoading(false);
      setInsightsLoading(false);
    }
  };

  // Filter projects based on search
  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter((project) =>
      project.name?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.clients?.name?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  // Group meetings by time periods
  const groupedMeetings = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const groups = {
      today: [] as any[],
      yesterday: [] as any[],
      thisWeek: [] as any[]
    };
    
    meetings.forEach(meeting => {
      const meetingDate = new Date(meeting.date);
      const meetingDay = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
      
      if (meetingDay.getTime() === today.getTime()) {
        groups.today.push(meeting);
      } else if (meetingDay.getTime() === yesterday.getTime()) {
        groups.yesterday.push(meeting);
      } else if (meetingDay >= weekAgo) {
        groups.thisWeek.push(meeting);
      }
    });
    
    return groups;
  }, [meetings]);

  // Group insights by project and sort by most recent first
  const groupedInsights = useMemo(() => {
    // Sort all insights by newest first
    const sortedInsights = [...insights].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // Group by project
    const projectGroups: { [key: string]: any[] } = {};
    
    sortedInsights.forEach(insight => {
      const projectName = insight.projects?.name || 'Unknown Project';
      if (!projectGroups[projectName]) {
        projectGroups[projectName] = [];
      }
      projectGroups[projectName].push(insight);
    });
    
    // Convert to array and sort projects by their most recent insight
    const projectArray = Object.entries(projectGroups).map(([projectName, insights]) => ({
      projectName,
      insights,
      mostRecent: new Date(insights[0].created_at).getTime()
    })).sort((a, b) => b.mostRecent - a.mostRecent);
    
    return projectArray;
  }, [insights]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-gray-50/50 -m-6 p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredProjects.length} active projects • {meetings.length} recent meetings
          </p>
        </div>
        <AddProjectButton />
      </div>

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Left Column - Projects */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              ACTIVE PROJECTS
            </h2>
            <div className="flex items-center gap-3">
              <Switch
                id="active-only"
                checked={showOnlyActive}
                onCheckedChange={setShowOnlyActive}
                className="scale-90"
              />
              <Label htmlFor="active-only" className="text-xs text-gray-600">
                Active only
              </Label>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>

          {/* Modern Project Cards */}
          <div className="space-y-2">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block p-5 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-brand-600 transition-colors text-base">
                      {project.name}
                    </h3>
                    {project.clients?.name && (
                      <p className="text-sm text-gray-500 mt-1 font-medium">{project.clients.name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    {project["est revenue"] && (
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(project["est revenue"])}
                        </p>
                        <p className="text-xs text-gray-500">Est. Revenue</p>
                      </div>
                    )}
                    <Badge className={cn("text-xs font-medium px-2.5 py-1", getStatusColor(project.phase))}>
                      {project.phase}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  {project.category && (
                    <span className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      {project.category}
                    </span>
                  )}
                  {(project.address || project.state) && (
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {project.state ? project.state : project.address}
                    </span>
                  )}
                </div>
              </Link>
            ))}
            
            <Link 
              href="/projects-dashboard"
              className="block p-4 text-center text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-xl border border-brand-100 hover:border-brand-200 transition-all"
            >
              View all projects →
            </Link>
          </div>
        </div>

        {/* Right Column - Meetings & Insights */}
        <div className="space-y-8">
          {/* Meetings Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              RECENT MEETINGS
            </h2>
            
{meetingsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* macOS-style Tabs */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg inline-flex">
                  <button
                    onClick={() => setActiveTab('today')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      activeTab === 'today' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Today ({groupedMeetings.today.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('yesterday')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      activeTab === 'yesterday' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Yesterday ({groupedMeetings.yesterday.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('thisWeek')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      activeTab === 'thisWeek' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    This Week ({groupedMeetings.thisWeek.length})
                  </button>
                </div>

                {/* Tab Content */}
                <div className="min-h-[200px]">
                  {activeTab === 'today' && (
                    <div className="space-y-1">
                      {groupedMeetings.today.length > 0 ? (
                        groupedMeetings.today.map((meeting) => (
                          <Link
                            key={meeting.id}
                            href={`/meetings/${meeting.id}`}
                            className="block p-3 hover:bg-gray-50 rounded-lg transition-all duration-150 group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-600 transition-colors">
                                  {meeting.title || 'Untitled Meeting'}
                                </p>
                                {meeting.projects?.name && (
                                  <p className="text-xs text-gray-500 mt-0.5">{meeting.projects.name}</p>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 font-medium ml-3">
                                {format(new Date(meeting.date), 'h:mm a')}
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">No meetings today</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'yesterday' && (
                    <div className="space-y-1">
                      {groupedMeetings.yesterday.length > 0 ? (
                        groupedMeetings.yesterday.map((meeting) => (
                          <Link
                            key={meeting.id}
                            href={`/meetings/${meeting.id}`}
                            className="block p-3 hover:bg-gray-50 rounded-lg transition-all duration-150 group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-600 transition-colors">
                                  {meeting.title || 'Untitled Meeting'}
                                </p>
                                {meeting.projects?.name && (
                                  <p className="text-xs text-gray-500 mt-0.5">{meeting.projects.name}</p>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 font-medium ml-3">
                                {format(new Date(meeting.date), 'h:mm a')}
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">No meetings yesterday</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'thisWeek' && (
                    <div className="space-y-1">
                      {groupedMeetings.thisWeek.length > 0 ? (
                        groupedMeetings.thisWeek.map((meeting) => (
                          <Link
                            key={meeting.id}
                            href={`/meetings/${meeting.id}`}
                            className="block p-3 hover:bg-gray-50 rounded-lg transition-all duration-150 group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-brand-600 transition-colors">
                                  {meeting.title || 'Untitled Meeting'}
                                </p>
                                {meeting.projects?.name && (
                                  <p className="text-xs text-gray-500 mt-0.5">{meeting.projects.name}</p>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 font-medium ml-3">
                                {format(new Date(meeting.date), 'MMM d')}
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">No meetings this week</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {meetings.length > 0 && (
                  <Link 
                    href="/meetings"
                    className="block p-3 text-center text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg border border-brand-100 hover:border-brand-200 transition-all mt-4"
                  >
                    View all meetings →
                  </Link>
                )}

                {meetings.length === 0 && !meetingsLoading && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No recent meetings</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Insights Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              RECENT INSIGHTS
            </h2>
            
            {insightsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group by Project - Most Recent First */}
                {groupedInsights.slice(0, 3).map((projectGroup) => (
                  <div key={projectGroup.projectName}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{projectGroup.projectName}</h3>
                    <div className="space-y-1">
                      {projectGroup.insights.slice(0, 2).map((insight) => (
                        <div
                          key={insight.id}
                          className="p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-150"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-sm font-medium text-gray-900 leading-snug pr-2">
                              {(() => {
                                // Parse JSON description if needed
                                if (typeof insight.description === 'string' && insight.description.startsWith('{')) {
                                  try {
                                    const parsed = JSON.parse(insight.description);
                                    return parsed.item || parsed.description || parsed.content || insight.description;
                                  } catch {
                                    return insight.description;
                                  }
                                }
                                return insight.description;
                              })()}
                            </p>
                            <span className={cn(
                              "text-xs px-2 py-1 rounded-full font-medium flex-shrink-0",
                              insight.severity === 'high' 
                                ? 'bg-red-100 text-red-700'
                                : insight.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            )}>
                              {insight.severity}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 capitalize">
                            {insight.insight_type?.replace('_', ' ')} • {insight.projects?.name || 'Unknown Project'} • {format(new Date(insight.created_at), 'h:mm a')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {insights.length === 0 && !insightsLoading && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No recent insights available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}