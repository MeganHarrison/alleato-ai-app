'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { createBrowserClient } from '@/utils/supabase-browser';
import { format } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  FileText,
  Users,
  Calendar,
  Shield,
  Target,
  Zap,
  X,
  Info,
  ExternalLink,
  Clock,
} from 'lucide-react';

interface ExecutiveBriefing {
  executiveSummary: {
    status: 'on-track' | 'at-risk' | 'critical' | 'delayed';
    headline: string;
    lastUpdated: string;
  };
  currentState: {
    keyDevelopments: Array<{
      title: string;
      impact: 'positive' | 'negative' | 'neutral';
      insightIds: string[];
    }>;
  };
  riskAssessment: {
    risks: Array<{
      risk: string;
      impact: string;
      likelihood: 'high' | 'medium' | 'low';
      insightIds: string[];
    }>;
  };
  activeResponse: {
    actions: Array<{
      action: string;
      owner: string;
      dueDate?: string;
      insightIds: string[];
    }>;
  };
  leadershipItems: {
    decisions: Array<{
      item: string;
      context: string;
      insightIds: string[];
    }>;
  };
  projectName: string;
  insightsCount: number;
  insights: any[];
}

interface DrillDownModalProps {
  insight: any;
  onClose: () => void;
}

function DrillDownModal({ insight, onClose }: DrillDownModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{insight.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                From: {insight.doc_title || 'Unknown Meeting'}
              </p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h4 className="font-medium mb-2">Context</h4>
            <p className="text-sm text-muted-foreground">{insight.description}</p>
          </div>
          
          {insight.business_impact && (
            <div>
              <h4 className="font-medium mb-2">Business Impact</h4>
              <p className="text-sm text-muted-foreground">{insight.business_impact}</p>
            </div>
          )}

          {insight.next_steps && insight.next_steps.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Next Steps</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                {insight.next_steps.map((step: string, i: number) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-4">
            <Badge variant={insight.severity === 'critical' ? 'destructive' : 'default'}>
              {insight.severity || 'medium'}
            </Badge>
            <Badge variant="outline">{insight.insight_type}</Badge>
            {insight.assignee && (
              <Badge variant="secondary">
                <Users className="h-3 w-3 mr-1" />
                {insight.assignee}
              </Badge>
            )}
            {insight.due_date && (
              <Badge variant="secondary">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(insight.due_date), 'MMM dd')}
              </Badge>
            )}
          </div>

          <div className="text-xs text-muted-foreground pt-2">
            Created: {format(new Date(insight.created_at), 'MMM dd, yyyy HH:mm')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectInsightsDashboard() {
  const [projects, setProjects] = useState<Array<{ name: string; insightCount: number }>>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [briefing, setBriefing] = useState<ExecutiveBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchBriefing(selectedProject);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects/list');
      const data = await response.json();
      if (data.projects && data.projects.length > 0) {
        setProjects(data.projects);
        setSelectedProject(data.projects[0].name);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchBriefing = async (projectName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectName)}/briefing`);
      const data = await response.json();
      setBriefing(data);
    } catch (error) {
      console.error('Error fetching briefing:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (selectedProject) {
      setRefreshing(true);
      fetchBriefing(selectedProject);
    }
  };

  const findInsight = (insightIds: string[]) => {
    if (!briefing?.insights) return null;
    return briefing.insights.find(i => insightIds.includes(i.id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-green-500';
      case 'at-risk': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      case 'delayed': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track': return <CheckCircle2 className="h-5 w-5" />;
      case 'at-risk': return <AlertCircle className="h-5 w-5" />;
      case 'critical': return <AlertTriangle className="h-5 w-5" />;
      case 'delayed': return <Clock className="h-5 w-5" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading && !briefing) {
    return (
      <div className="mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Executive Project Briefing</h1>
          <p className="text-muted-foreground mt-1">Synthesized insights from project meetings and documents</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(project => (
                <SelectItem key={project.name} value={project.name}>
                  {project.name} ({project.insightCount} insights)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {briefing && (
        <>
          {/* Executive Summary */}
<div>
            <div>
              <div className="flex items-start gap-4 pb-8">

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={briefing.executiveSummary.status === 'critical' ? 'destructive' : 'default'}
                      className="capitalize"
                    >
                      {briefing.executiveSummary.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {briefing.insightsCount} total insights analyzed
                    </span>
                  </div>
                  <p className="text-lg font-medium">{briefing.executiveSummary.headline}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Last updated: {format(new Date(briefing.executiveSummary.lastUpdated), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </div>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-[50%_50%] gap-16">
            {/* Current State */}
            <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 pb-4">
                  <Zap className="h-5 w-5" />
                  CURRENT STATE
                </h3>
              <div className="space-y-3">
                {briefing.currentState.keyDevelopments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No key developments</p>
                ) : (
                  briefing.currentState.keyDevelopments.map((dev, i) => {
                    const insight = findInsight(dev.insightIds);
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => insight && setSelectedInsight(insight)}
                      >
                        {getImpactIcon(dev.impact)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{dev.title}</p>
                          {insight && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {insight.doc_title ? `From: ${insight.doc_title}` : 'View details →'}
                            </p>
                          )}
                        </div>
                        {insight && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Risk Assessment */}
            <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  RISK ASSESSENT
                </h3>
              <div className="space-y-3 pt-4">
                {briefing.riskAssessment.risks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No significant risks identified</p>
                ) : (
                  briefing.riskAssessment.risks.map((risk, i) => {
                    const insight = findInsight(risk.insightIds);
                    return (
                      <div
                        key={i}
                        className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => insight && setSelectedInsight(insight)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium">{risk.risk}</p>
                          <Badge
                            variant={risk.likelihood === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {risk.likelihood}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{risk.impact}</p>
                        {insight && (
                          <p className="text-xs text-blue-500 mt-2">View meeting context →</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Response */}
<div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  OUR RESPONSE
                </h3>
              <div className="space-y-3 pt-4">
                {briefing.activeResponse.actions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active mitigation actions</p>
                ) : (
                  briefing.activeResponse.actions.map((action, i) => {
                    const insight = findInsight(action.insightIds);
                    return (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => insight && setSelectedInsight(insight)}
                      >
                        <p className="text-sm font-medium">{action.action}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {action.owner}
                          </span>
                          {action.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(action.dueDate), 'MMM dd')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
</div>

            {/* Leadership */}
<div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  LEADERSHIP ACTIONS
                </h3>
              <div className="space-y-3 pt-4">
                {briefing.leadershipItems.decisions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No decisions required</p>
                ) : (
                  briefing.leadershipItems.decisions.map((decision, i) => {
                    const insight = findInsight(decision.insightIds);
                    return (
                      <div
                        key={i}
                        className="p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 cursor-pointer transition-colors"
                        onClick={() => insight && setSelectedInsight(insight)}
                      >
                        <p className="text-sm font-medium">{decision.item}</p>
                        <p className="text-xs text-muted-foreground mt-1">{decision.context}</p>
                      </div>
                    );
                  })
                )}
              </div>
</div>


          </div>
        </>
      )}

      {/* Drill-down Modal */}
      {selectedInsight && (
        <DrillDownModal
          insight={selectedInsight}
          onClose={() => setSelectedInsight(null)}
        />
      )}
    </div>
  );
}
