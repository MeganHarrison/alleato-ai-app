import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Play, 
  RefreshCw, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  FileText,
  Users,
  TrendingUp
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InsightsStatus {
  service_available: boolean;
  insights_today: number;
  documents_pending: number;
  total_insights: number;
  timestamp: string;
}

interface Insight {
  id: string;
  insight_type: string;
  title: string;
  description: string;
  confidence_score: number;
  priority: string;
  status: string;
  project_name?: string;
  assigned_to?: string;
  due_date?: string;
  source_meeting_title?: string;
  created_at: string;
}

export const InsightsManagement = () => {
  const [status, setStatus] = useState<InsightsStatus | null>(null);
  const [recentInsights, setRecentInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingPending, setProcessingPending] = useState(false);
  const [userId, setUserId] = useState('');
  const { toast } = useToast();

  // API base URL - adjust based on your setup
  const INSIGHTS_API_BASE = process.env.NEXT_PUBLIC_INSIGHTS_API_URL || 'http://localhost:8002';

  const fetchInsightsStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${INSIGHTS_API_BASE}/insights/status`);
      if (!response.ok) throw new Error('Failed to fetch insights status');
      
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching insights status:', error);
      toast({
        title: "Error",
        description: "Failed to fetch insights status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentInsights = async () => {
    try {
      const response = await fetch(`${INSIGHTS_API_BASE}/insights/recent?limit=10`);
      if (!response.ok) throw new Error('Failed to fetch recent insights');
      
      const data = await response.json();
      setRecentInsights(data.insights || []);
    } catch (error) {
      console.error('Error fetching recent insights:', error);
      toast({
        title: "Error",
        description: "Failed to fetch recent insights",
        variant: "destructive",
      });
    }
  };

  const triggerInsightsProcessing = async () => {
    try {
      setProcessingPending(true);
      const response = await fetch(`${INSIGHTS_API_BASE}/insights/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId || undefined,
          force_reprocess: false
        }),
      });

      if (!response.ok) throw new Error('Failed to trigger insights processing');

      toast({
        title: "Success",
        description: "Insights processing started in background",
      });

      // Refresh status after a delay
      setTimeout(() => {
        fetchInsightsStatus();
        fetchRecentInsights();
      }, 2000);

    } catch (error) {
      console.error('Error triggering insights processing:', error);
      toast({
        title: "Error",
        description: "Failed to trigger insights processing",
        variant: "destructive",
      });
    } finally {
      setProcessingPending(false);
    }
  };

  const processPendingQueue = async () => {
    try {
      setProcessingPending(true);
      const response = await fetch(`${INSIGHTS_API_BASE}/insights/process-pending`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId || undefined
        }),
      });

      if (!response.ok) throw new Error('Failed to process pending queue');

      toast({
        title: "Success",
        description: "Processing pending insights queue",
      });

      // Refresh status after a delay
      setTimeout(() => {
        fetchInsightsStatus();
        fetchRecentInsights();
      }, 5000);

    } catch (error) {
      console.error('Error processing pending queue:', error);
      toast({
        title: "Error",
        description: "Failed to process pending queue",
        variant: "destructive",
      });
    } finally {
      setProcessingPending(false);
    }
  };

  useEffect(() => {
    fetchInsightsStatus();
    fetchRecentInsights();
  }, []);

  const getInsightTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      action_item: "bg-blue-100 text-blue-800",
      decision: "bg-green-100 text-green-800",
      risk: "bg-red-100 text-red-800",
      milestone: "bg-purple-100 text-purple-800",
      blocker: "bg-orange-100 text-orange-800",
      opportunity: "bg-emerald-100 text-emerald-800",
    };
    
    return (
      <Badge className={typeColors[type] || "bg-gray-100 text-gray-800"}>
        {type.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors: Record<string, string> = {
      critical: "bg-red-500 text-white",
      high: "bg-orange-500 text-white",
      medium: "bg-yellow-500 text-white",
      low: "bg-green-500 text-white",
    };
    
    return (
      <Badge className={priorityColors[priority] || "bg-gray-500 text-white"}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Status</CardTitle>
            {status?.service_available ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : status?.service_available ? "Online" : "Offline"}
            </div>
            <p className="text-xs text-muted-foreground">
              Insights processing service
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Insights</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : status?.insights_today || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Generated today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : status?.documents_pending || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : status?.total_insights || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Insights Processing Controls</CardTitle>
          <CardDescription>
            Manually trigger insights processing or process pending documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="userId">User ID (optional)</Label>
            <Input
              id="userId"
              placeholder="Filter by specific user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={triggerInsightsProcessing}
              disabled={processingPending || !status?.service_available}
            >
              {processingPending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Trigger Processing
            </Button>
            
            <Button
              variant="outline"
              onClick={processPendingQueue}
              disabled={processingPending || !status?.service_available}
            >
              {processingPending ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Clock className="mr-2 h-4 w-4" />
              )}
              Process Pending ({status?.documents_pending || 0})
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => {
                fetchInsightsStatus();
                fetchRecentInsights();
              }}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Insights</CardTitle>
          <CardDescription>
            Latest insights generated from meeting transcripts and documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentInsights.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No insights found. Process some documents to generate insights.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInsights.map((insight) => (
                  <TableRow key={insight.id}>
                    <TableCell>
                      {getInsightTypeBadge(insight.insight_type)}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{insight.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {insight.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(insight.priority)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {insight.source_meeting_title || 'Unknown'}
                        {insight.project_name && (
                          <p className="text-xs text-muted-foreground">
                            Project: {insight.project_name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(insight.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {Math.round(insight.confidence_score * 100)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};