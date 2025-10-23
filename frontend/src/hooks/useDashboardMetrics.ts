import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useProjectSummary } from './useProjects';
import { useInsightsSummary } from './useInsights';

export interface DashboardMetrics {
  activeProjects: number;
  totalRevenue: string;
  teamUtilization: string;
  aiInsightsGenerated: number;
  projectsOnTrack: number;
  projectsAtRisk: number;
  projectsDelayed: number;
}

export const useDashboardMetrics = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { summary: projectSummary, loading: projectsLoading } = useProjectSummary();
  const { summary: insightsSummary, loading: insightsLoading } = useInsightsSummary();

  useEffect(() => {
    if (!user || projectsLoading || insightsLoading) {
      return;
    }

    // Calculate derived metrics from project and insights data
    const calculateMetrics = async () => {
      try {
        setLoading(true);

        // Get conversation count for AI insights metric
        const { count: conversationCount } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Calculate budget totals from projects
        const { data: projectBudgets } = await supabase
          .from('projects')
          .select('budget, spent, status')
          .eq('owner_id', user.id)
          .eq('is_archived', false);

        const totalBudget = projectBudgets?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
        const totalSpent = projectBudgets?.reduce((sum, p) => sum + (p.spent || 0), 0) || 0;
        const remainingBudget = totalBudget - totalSpent;

        // Calculate project health stats
        const activeProjectsCount = projectSummary?.active_projects || 0;
        const projectsByPriority = projectSummary?.projects_by_priority || {};
        const overdueProjects = projectSummary?.overdue_projects || 0;

        // Estimate team utilization based on active projects and their progress
        const avgProgress = projectBudgets?.reduce((sum, p) => sum + (p.progress || 0), 0) / Math.max(projectBudgets?.length || 1, 1);
        const utilization = Math.min(Math.round(70 + (avgProgress * 0.3) + (activeProjectsCount * 2)), 100);

        // Project health distribution (simplified calculation)
        const criticalProjects = projectsByPriority['critical'] || 0;
        const highPriorityProjects = projectsByPriority['high'] || 0;
        const onTrack = Math.max(activeProjectsCount - criticalProjects - highPriorityProjects - overdueProjects, 0);

        const calculatedMetrics: DashboardMetrics = {
          activeProjects: activeProjectsCount,
          totalRevenue: `$${(remainingBudget / 1000).toFixed(1)}K`,
          teamUtilization: `${utilization}%`,
          aiInsightsGenerated: insightsSummary?.total_insights || conversationCount || 0,
          projectsOnTrack: onTrack,
          projectsAtRisk: criticalProjects + highPriorityProjects,
          projectsDelayed: overdueProjects
        };

        setMetrics(calculatedMetrics);
      } catch (err) {
        console.error('Failed to calculate dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    calculateMetrics();
  }, [user, projectSummary, insightsSummary, projectsLoading, insightsLoading]);

  return { metrics, loading };
};