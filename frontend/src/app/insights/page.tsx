'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { createBrowserClient } from '@/utils/supabase-browser';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Activity,
  Target,
  Users,
  Calendar as CalendarIcon,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  Flag,
  Zap,
  Shield,
  DollarSign,
  GitBranch,
  MessageSquare,
  FileText,
  BrainCircuit,
  ChevronUp,
  ChevronDown,
  Search,
  X,
} from 'lucide-react';

interface InsightMetrics {
  totalInsights: number;
  criticalItems: number;
  overdueItems: number;
  completionRate: number;
  avgResolutionTime: number;
  weeklyTrend: number;
  insightsByType: Record<string, number>;
  insightsByPriority: Record<string, number>;
  insightsByStatus: Record<string, number>;
  activeProjects: Record<string, number>;
  teamPerformance: Array<{ name: string; completed: number; inProgress: number; overdue: number }>;
  timeline: Array<{ date: string; count: number; type: string }>;
}

const COLORS = {
  critical: '#ef4444',
  high: '#fb923c',
  medium: '#fbbf24',
  low: '#84cc16',
  action_item: '#3b82f6',
  decision: '#8b5cf6',
  risk: '#ef4444',
  milestone: '#10b981',
  blocker: '#dc2626',
  opportunity: '#06b6d4',
};

const INSIGHT_TYPE_ICONS = {
  action_item: <CheckCircle2 className="w-4 h-4" />,
  decision: <Target className="w-4 h-4" />,
  risk: <AlertTriangle className="w-4 h-4" />,
  milestone: <Flag className="w-4 h-4" />,
  blocker: <AlertCircle className="w-4 h-4" />,
  opportunity: <TrendingUp className="w-4 h-4" />,
  technical_issue: <Zap className="w-4 h-4" />,
  budget_update: <DollarSign className="w-4 h-4" />,
  dependency: <GitBranch className="w-4 h-4" />,
  stakeholder_feedback: <MessageSquare className="w-4 h-4" />,
};

// Component for Project-Grouped Insights with Expandable Meeting Sections
function ProjectInsightsTable({ insights }: { insights: any[] }) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Group insights by project, then by meeting
  const projectGroups = insights.reduce((groups: any, insight) => {
    const projectName = insight.doc_title?.split(' - ')[0] || 'Unassigned';
    const meetingTitle = insight.doc_title || 'No Meeting';

    if (!groups[projectName]) {
      groups[projectName] = {
        meetings: {},
        totalInsights: 0,
        criticalCount: 0,
        highCount: 0,
        unresolvedCount: 0,
      };
    }

    if (!groups[projectName].meetings[meetingTitle]) {
      groups[projectName].meetings[meetingTitle] = [];
    }

    groups[projectName].meetings[meetingTitle].push(insight);
    groups[projectName].totalInsights++;

    if (insight.severity === 'critical') groups[projectName].criticalCount++;
    if (insight.severity === 'high') groups[projectName].highCount++;
    if (!insight.resolved) groups[projectName].unresolvedCount++;

    return groups;
  }, {});

  const toggleProject = (projectName: string) => {
    setExpandedProjects(prev => {
      const next = new Set(Array.from(prev));
      if (next.has(projectName)) {
        next.delete(projectName);
      } else {
        next.add(projectName);
      }
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {Object.entries(projectGroups).map(([projectName, projectData]: [string, any]) => {
        const isExpanded = expandedProjects.has(projectName);
        const hasCritical = projectData.criticalCount > 0;
        const hasHighRisk = projectData.highCount > 0;

        return (
          <div key={projectName} className="border rounded-lg">
            {/* Project Header Row */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleProject(projectName)}
            >
              <div className="flex items-center gap-3">
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
                <div className="flex items-center gap-2">
                  <span className="font-medium">{projectName}</span>
                  {hasCritical && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <Badge variant="destructive" className="text-xs">
                        {projectData.criticalCount} Critical
                      </Badge>
                    </div>
                  )}
                  {hasHighRisk && !hasCritical && (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <Badge variant="default" className="text-xs bg-orange-500">
                        {projectData.highCount} High
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{projectData.totalInsights} insights</span>
                <span>{projectData.unresolvedCount} unresolved</span>
              </div>
            </div>

            {/* Expanded Content - Meetings and Insights */}
            {isExpanded && (
              <div className="border-t bg-muted/20">
                {Object.entries(projectData.meetings).map(([meetingTitle, meetingInsights]: [string, any]) => (
                  <div key={meetingTitle} className="border-b last:border-b-0">
                    <div className="px-6 py-2 bg-muted/30">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        {meetingTitle}
                        <span className="text-muted-foreground">({meetingInsights.length} insights)</span>
                      </h4>
                    </div>
                    <div className="divide-y">
                      {meetingInsights.map((insight: any) => (
                        <div key={insight.id} className="px-6 py-3 hover:bg-muted/10">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="mt-0.5">
                                  {INSIGHT_TYPE_ICONS[insight.insight_type as keyof typeof INSIGHT_TYPE_ICONS] || <FileText className="w-4 h-4" />}
                                </div>
                                <span className="font-medium text-sm">{insight.title}</span>
                                <Badge
                                  variant={
                                    insight.severity === 'critical' ? 'destructive' :
                                    insight.severity === 'high' ? 'default' :
                                    'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {insight.severity || 'medium'}
                                </Badge>
                                {insight.resolved && (
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Resolved
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground ml-6 line-clamp-1">
                                {insight.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 ml-6 text-xs text-muted-foreground">
                                {insight.assignee && (
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {insight.assignee}
                                  </span>
                                )}
                                {insight.due_date && (
                                  <span className="flex items-center gap-1">
                                    <CalendarIcon className="w-3 h-3" />
                                    {format(new Date(insight.due_date), 'MMM dd, yyyy')}
                                  </span>
                                )}
                                {insight.business_impact && (
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    Business Impact
                                  </span>
                                )}
                                {insight.financial_impact && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    ${insight.financial_impact.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ProjectInsightsPage() {
  const [metrics, setMetrics] = useState<InsightMetrics | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDataTable, setShowDataTable] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchInsightsData();
  }, [timeRange, selectedProject]);

  const fetchInsightsData = async () => {
    setLoading(true);
    try {
      const daysBack = parseInt(timeRange);
      const dateFrom = subDays(new Date(), daysBack);

      // Fetch insights with filters
      let query = supabase
        .from('document_insights')
        .select('*')
        .gte('created_at', dateFrom.toISOString())
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      if (selectedProject !== 'all') {
        query = query.eq('project_name', selectedProject);
      }

      const { data: insightsData, error } = await query;

      if (error) throw error;

      setInsights(insightsData || []);

      // Calculate metrics
      const metrics = calculateMetrics(insightsData || []);
      setMetrics(metrics);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateMetrics = (data: any[]): InsightMetrics => {
    const now = new Date();
    const totalInsights = data.length;
    const criticalItems = data.filter(i => i.severity === 'critical' && !i.resolved).length;
    const overdueItems = data.filter(i => i.due_date && new Date(i.due_date) < now && !i.resolved).length;
    const completedItems = data.filter(i => i.resolved === true).length;
    const completionRate = totalInsights > 0 ? (completedItems / totalInsights) * 100 : 0;

    // Calculate average resolution time (mock calculation)
    const avgResolutionTime = 3.5; // days

    // Calculate weekly trend
    const lastWeek = subDays(now, 7);
    const thisWeekCount = data.filter(i => new Date(i.created_at) > lastWeek).length;
    const previousWeekCount = data.filter(i => {
      const created = new Date(i.created_at);
      return created <= lastWeek && created > subDays(lastWeek, 7);
    }).length;
    const weeklyTrend = previousWeekCount > 0 ? ((thisWeekCount - previousWeekCount) / previousWeekCount) * 100 : 0;

    // Group by type
    const insightsByType = data.reduce((acc, i) => {
      acc[i.insight_type] = (acc[i.insight_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by severity (replacing priority)
    const insightsByPriority = data.reduce((acc, i) => {
      const priority = i.severity || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by resolved status
    const insightsByStatus = data.reduce((acc, i) => {
      const status = i.resolved ? 'completed' : 'open';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Active projects
    const activeProjects = data.reduce((acc, i) => {
      if (i.project_name) {
        acc[i.project_name] = (acc[i.project_name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Team performance based on assignee
    const teamData = data.reduce((acc, i) => {
      if (i.assignee) {
        if (!acc[i.assignee]) {
          acc[i.assignee] = { completed: 0, inProgress: 0, overdue: 0 };
        }
        if (i.resolved) acc[i.assignee].completed++;
        else acc[i.assignee].inProgress++;
        if (i.due_date && new Date(i.due_date) < now && !i.resolved) {
          acc[i.assignee].overdue++;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    const teamPerformance = Object.entries(teamData).map(([name, stats]) => ({
      name,
      ...(stats as any),
    }));

    // Timeline data
    const timeline: Array<{ date: string; count: number; type: string }> = [];
    const dates = Array.from(new Set(data.map(i => format(new Date(i.created_at), 'yyyy-MM-dd')))).sort();
    dates.forEach(date => {
      const dayInsights = data.filter(i => format(new Date(i.created_at), 'yyyy-MM-dd') === date);
      timeline.push({
        date: format(new Date(date), 'MMM dd'),
        count: dayInsights.length,
        type: 'total',
      });
    });

    return {
      totalInsights,
      criticalItems,
      overdueItems,
      completionRate,
      avgResolutionTime,
      weeklyTrend,
      insightsByType,
      insightsByPriority,
      insightsByStatus,
      activeProjects,
      teamPerformance,
      timeline,
    };
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInsightsData();
  };

  const exportData = () => {
    const csvContent = insights.map(i =>
      `"${i.title}","${i.insight_type}","${i.severity || 'medium'}","${i.resolved ? 'Resolved' : 'Open'}","${i.doc_title || ''}","${i.assignee || ''}","${i.due_date || ''}"`
    ).join('\n');

    const blob = new Blob([`"Title","Type","Severity","Status","Document","Assignee","Due Date"\n${csvContent}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insights-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getFilteredAndSortedInsights = () => {
    let filtered = insights;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(insight =>
        insight.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insight.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insight.insight_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insight.assignee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insight.doc_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      // Compare values
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const handleViewDetails = (insight: any) => {
    // You can implement a modal or navigation to detailed view
    console.log('View details for:', insight);
    // For now, we'll just log it. You could add a modal component here
  };

  // Table header component
  const DataTableHeader = ({
    field,
    label,
    sortField,
    sortDirection,
    onSort
  }: {
    field: string;
    label: string;
    sortField: string;
    sortDirection: 'asc' | 'desc';
    onSort: (field: string) => void;
  }) => (
    <th
      className="text-left py-3 px-4 cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {sortField === field && (
          sortDirection === 'asc' ?
            <ChevronUp className="h-4 w-4" /> :
            <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BrainCircuit className="w-16 h-16 animate-pulse mx-auto mb-4 text-blue-500" />
          <p>Loading insights data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Project Insights Dashboard</h1>
          <p className="text-muted-foreground mt-1">Executive overview of AI-generated insights from meetings and documents</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalInsights || 0}</div>
            <div className="flex items-center text-xs mt-1">
              {metrics?.weeklyTrend && metrics.weeklyTrend > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  <span className="text-green-500">+{metrics.weeklyTrend.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                  <span className="text-red-500">{metrics?.weeklyTrend?.toFixed(1)}%</span>
                </>
              )}
              <span className="text-muted-foreground ml-1">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{metrics?.criticalItems || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Requires immediate attention</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{metrics?.overdueItems || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">Past due date</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.completionRate.toFixed(1)}%</div>
            <Progress value={metrics?.completionRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Resolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgResolutionTime.toFixed(1)} days</div>
            <div className="text-xs text-muted-foreground mt-1">Time to complete</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(metrics?.activeProjects || {}).length}</div>
            <div className="text-xs text-muted-foreground mt-1">With open insights</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(metrics?.insightsByPriority || {}).map(([key, value]) => ({ name: key, value }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.keys(metrics?.insightsByPriority || {}).map((key, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[key as keyof typeof COLORS] || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Insight Types */}
            <Card>
              <CardHeader>
                <CardTitle>Insight Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(metrics?.insightsByType || {}).map(([key, value]) => ({
                      type: key.replace('_', ' '),
                      count: value
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 65 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="type"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics?.insightsByStatus || {}).map(([status, count]) => {
                    const total = metrics?.totalInsights || 1;
                    const percentage = (count / total) * 100;
                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium capitalize">{status.replace('_', ' ')}</span>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project-Grouped Insights with Expandable Meeting Sections */}
          <Card>
            <CardHeader>
              <CardTitle>Project Insights Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectInsightsTable insights={insights} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Project Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Project Insights Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(metrics?.activeProjects || {})
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 8)
                      .map(([project, count]) => ({ project, count }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 65 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="project"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Insight Velocity */}
            <Card>
              <CardHeader>
                <CardTitle>Insight Generation Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics?.timeline || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Insight Type Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Insight Type Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={Object.entries(metrics?.insightsByType || {}).map(([key, value]) => ({
                  type: key.replace(/_/g, ' '),
                  value,
                  fullMark: Math.max(...Object.values(metrics?.insightsByType || {1: 1}))
                }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="type" />
                  <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
                  <Radar name="Count" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Insights Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.slice(0, 10).map((insight) => (
                  <div key={insight.id} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-24 text-sm text-muted-foreground text-right">
                      {format(new Date(insight.created_at), 'MMM dd, HH:mm')}
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5" />
                    </div>
                    <div className="flex-1 space-y-2 pb-8 border-l-2 border-muted pl-4 -ml-1.5">
                      <div className="flex items-center gap-2">
                        {INSIGHT_TYPE_ICONS[insight.insight_type as keyof typeof INSIGHT_TYPE_ICONS]}
                        <span className="font-medium">{insight.title}</span>
                        <Badge variant={insight.severity === 'critical' ? 'destructive' : 'default'} className="ml-auto">
                          {insight.severity || 'medium'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                      {insight.doc_title && (
                        <p className="text-xs text-muted-foreground">
                          From: {insight.doc_title}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={metrics?.teamPerformance || []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" stackId="a" fill="#10b981" />
                  <Bar dataKey="inProgress" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="overdue" stackId="a" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Individual Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics?.teamPerformance.slice(0, 6).map((member) => (
              <Card key={member.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{member.name}</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="text-sm font-medium text-green-600">{member.completed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">In Progress</span>
                    <span className="text-sm font-medium text-blue-600">{member.inProgress}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Overdue</span>
                    <span className="text-sm font-medium text-red-600">{member.overdue}</span>
                  </div>
                  <div className="pt-2">
                    <Progress
                      value={member.completed / (member.completed + member.inProgress + member.overdue) * 100}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Comprehensive Data Table */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>All Document Insights Data</CardTitle>
              <Badge variant="secondary">{insights.length} records</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search insights..."
                  className="pl-10 pr-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDataTable(!showDataTable)}
              >
                {showDataTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showDataTable ? 'Collapse' : 'Expand'}
              </Button>
            </div>
          </div>
        </CardHeader>
        {showDataTable && (
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <DataTableHeader field="title" label="Title" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <DataTableHeader field="insight_type" label="Type" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <DataTableHeader field="severity" label="Severity" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <DataTableHeader field="resolved" label="Status" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <DataTableHeader field="assignee" label="Assignee" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <DataTableHeader field="due_date" label="Due Date" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <DataTableHeader field="doc_title" label="Document" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <DataTableHeader field="confidence_score" label="Confidence" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <DataTableHeader field="financial_impact" label="Financial Impact" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <DataTableHeader field="created_at" label="Created" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredAndSortedInsights().map((insight) => (
                    <tr key={insight.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="max-w-xs">
                          <p className="font-medium truncate">{insight.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{insight.description}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {INSIGHT_TYPE_ICONS[insight.insight_type as keyof typeof INSIGHT_TYPE_ICONS] || <FileText className="w-3 h-3" />}
                          <span className="text-sm">{insight.insight_type?.replace(/_/g, ' ')}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            insight.severity === 'critical' ? 'destructive' :
                            insight.severity === 'high' ? 'default' :
                            'secondary'
                          }
                        >
                          {insight.severity || 'medium'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={insight.resolved ? 'outline' : 'default'}>
                          {insight.resolved ? 'Resolved' : 'Open'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{insight.assignee || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {insight.due_date ? format(new Date(insight.due_date), 'MMM dd, yyyy') : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm truncate max-w-xs block" title={insight.doc_title}>
                          {insight.doc_title || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {insight.confidence_score ? `${(insight.confidence_score * 100).toFixed(0)}%` : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {insight.financial_impact ? `$${insight.financial_impact.toLocaleString()}` : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(insight.created_at), 'MMM dd, HH:mm')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(insight)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {getFilteredAndSortedInsights().length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No insights found matching your criteria
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}