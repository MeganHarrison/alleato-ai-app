import { createServerClient } from '@/utils/supabase-server';
import { Database } from '@/types/supabase';
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

type ProjectInsight = Database['public']['Tables']['project_insights']['Row'];

export interface InsightAnalytics {
  summary: {
    totalInsights: number;
    criticalItems: number;
    overdueItems: number;
    completionRate: number;
    avgResolutionTime: number;
    weeklyGrowth: number;
    monthlyGrowth: number;
  };
  byCategory: {
    type: Record<string, number>;
    priority: Record<string, number>;
    status: Record<string, number>;
    project: Record<string, number>;
  };
  trends: {
    daily: Array<{ date: string; count: number; cumulative: number }>;
    weekly: Array<{ week: string; count: number; completionRate: number }>;
    monthly: Array<{ month: string; count: number; avgPriority: number }>;
  };
  predictions: {
    expectedCompletionTime: number;
    riskScore: number;
    velocityTrend: 'increasing' | 'stable' | 'decreasing';
    bottlenecks: string[];
  };
  teamMetrics: Array<{
    member: string;
    totalAssigned: number;
    completed: number;
    inProgress: number;
    overdue: number;
    avgCompletionTime: number;
    efficiency: number;
  }>;
  projectHealth: Array<{
    project: string;
    healthScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    blockers: number;
    criticalIssues: number;
    completionPercentage: number;
    estimatedCompletionDate: Date | null;
  }>;
}

export class InsightsAnalyticsService {
  private supabase: ReturnType<typeof createServerClient>;

  constructor() {
    this.supabase = createServerClient();
  }

  async getComprehensiveAnalytics(
    timeRange: number = 30,
    projectFilter?: string
  ): Promise<InsightAnalytics> {
    const endDate = new Date();
    const startDate = subDays(endDate, timeRange);

    // Fetch insights data
    let query = this.supabase
      .from('project_insights')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (projectFilter && projectFilter !== 'all') {
      query = query.eq('project_name', projectFilter);
    }

    const { data: insights, error } = await query;

    if (error || !insights) {
      throw new Error('Failed to fetch insights data');
    }

    return this.calculateAnalytics(insights as ProjectInsight[], timeRange);
  }

  private calculateAnalytics(insights: ProjectInsight[], timeRange: number): InsightAnalytics {
    const now = new Date();

    // Summary calculations
    const summary = this.calculateSummary(insights, now);

    // Category breakdowns
    const byCategory = this.calculateCategoryBreakdowns(insights);

    // Trend analysis
    const trends = this.calculateTrends(insights, timeRange);

    // Predictive analytics
    const predictions = this.calculatePredictions(insights, trends);

    // Team performance metrics
    const teamMetrics = this.calculateTeamMetrics(insights, now);

    // Project health scores
    const projectHealth = this.calculateProjectHealth(insights);

    return {
      summary,
      byCategory,
      trends,
      predictions,
      teamMetrics,
      projectHealth,
    };
  }

  private calculateSummary(insights: ProjectInsight[], now: Date) {
    const totalInsights = insights.length;
    const criticalItems = insights.filter(
      i => i.priority === 'critical' && ['open', 'in_progress'].includes(i.status)
    ).length;

    const overdueItems = insights.filter(
      i => i.due_date && new Date(i.due_date) < now && ['open', 'in_progress'].includes(i.status)
    ).length;

    const completedItems = insights.filter(i => i.status === 'completed').length;
    const completionRate = totalInsights > 0 ? (completedItems / totalInsights) * 100 : 0;

    // Calculate average resolution time (in days)
    const completedWithDates = insights.filter(
      i => i.status === 'completed' && i.created_at && i.updated_at
    );

    const avgResolutionTime = completedWithDates.length > 0
      ? completedWithDates.reduce((acc, i) => {
          const created = new Date(i.created_at);
          const updated = new Date(i.updated_at);
          return acc + (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / completedWithDates.length
      : 0;

    // Calculate weekly and monthly growth
    const lastWeek = subDays(now, 7);
    const lastMonth = subDays(now, 30);
    const prevWeek = subDays(now, 14);
    const prevMonth = subDays(now, 60);

    const thisWeekCount = insights.filter(i => new Date(i.created_at) > lastWeek).length;
    const prevWeekCount = insights.filter(
      i => new Date(i.created_at) > prevWeek && new Date(i.created_at) <= lastWeek
    ).length;

    const thisMonthCount = insights.filter(i => new Date(i.created_at) > lastMonth).length;
    const prevMonthCount = insights.filter(
      i => new Date(i.created_at) > prevMonth && new Date(i.created_at) <= lastMonth
    ).length;

    const weeklyGrowth = prevWeekCount > 0
      ? ((thisWeekCount - prevWeekCount) / prevWeekCount) * 100
      : 0;

    const monthlyGrowth = prevMonthCount > 0
      ? ((thisMonthCount - prevMonthCount) / prevMonthCount) * 100
      : 0;

    return {
      totalInsights,
      criticalItems,
      overdueItems,
      completionRate,
      avgResolutionTime,
      weeklyGrowth,
      monthlyGrowth,
    };
  }

  private calculateCategoryBreakdowns(insights: ProjectInsight[]) {
    const type = insights.reduce((acc, i) => {
      acc[i.insight_type] = (acc[i.insight_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priority = insights.reduce((acc, i) => {
      acc[i.priority] = (acc[i.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const status = insights.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const project = insights.reduce((acc, i) => {
      if (i.project_name) {
        acc[i.project_name] = (acc[i.project_name] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return { type, priority, status, project };
  }

  private calculateTrends(insights: ProjectInsight[], timeRange: number) {
    const daily: Array<{ date: string; count: number; cumulative: number }> = [];
    const weekly: Array<{ week: string; count: number; completionRate: number }> = [];
    const monthly: Array<{ month: string; count: number; avgPriority: number }> = [];

    // Daily trends
    const dailyMap = new Map<string, number>();
    insights.forEach(i => {
      const date = new Date(i.created_at).toISOString().split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });

    let cumulative = 0;
    Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, count]) => {
        cumulative += count;
        daily.push({ date, count, cumulative });
      });

    // Weekly trends
    const weeklyMap = new Map<string, { total: number; completed: number }>();
    insights.forEach(i => {
      const week = startOfWeek(new Date(i.created_at)).toISOString().split('T')[0];
      const existing = weeklyMap.get(week) || { total: 0, completed: 0 };
      existing.total++;
      if (i.status === 'completed') existing.completed++;
      weeklyMap.set(week, existing);
    });

    Array.from(weeklyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([week, data]) => {
        weekly.push({
          week,
          count: data.total,
          completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
        });
      });

    // Monthly trends with average priority
    const monthlyMap = new Map<string, { count: number; prioritySum: number }>();
    const priorityValues = { critical: 4, high: 3, medium: 2, low: 1 };

    insights.forEach(i => {
      const month = startOfMonth(new Date(i.created_at)).toISOString().split('T')[0];
      const existing = monthlyMap.get(month) || { count: 0, prioritySum: 0 };
      existing.count++;
      existing.prioritySum += priorityValues[i.priority as keyof typeof priorityValues] || 2;
      monthlyMap.set(month, existing);
    });

    Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, data]) => {
        monthly.push({
          month,
          count: data.count,
          avgPriority: data.count > 0 ? data.prioritySum / data.count : 0,
        });
      });

    return { daily, weekly, monthly };
  }

  private calculatePredictions(
    insights: ProjectInsight[],
    trends: InsightAnalytics['trends']
  ): InsightAnalytics['predictions'] {
    // Calculate velocity trend
    const recentWeeks = trends.weekly.slice(-4);
    let velocityTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';

    if (recentWeeks.length >= 2) {
      const avgRecent = recentWeeks.slice(-2).reduce((acc, w) => acc + w.count, 0) / 2;
      const avgPrevious = recentWeeks.slice(0, 2).reduce((acc, w) => acc + w.count, 0) / 2;

      if (avgRecent > avgPrevious * 1.2) velocityTrend = 'increasing';
      else if (avgRecent < avgPrevious * 0.8) velocityTrend = 'decreasing';
    }

    // Calculate expected completion time based on current velocity
    const openItems = insights.filter(i => ['open', 'in_progress'].includes(i.status)).length;
    const weeklyCompletionRate = trends.weekly.slice(-4).reduce((acc, w) => acc + w.completionRate, 0) / 4;
    const expectedCompletionTime = weeklyCompletionRate > 0
      ? (openItems / (weeklyCompletionRate / 100)) * 7
      : 0;

    // Calculate risk score (0-100)
    const criticalRatio = insights.filter(i => i.priority === 'critical').length / insights.length;
    const overdueRatio = insights.filter(i =>
      i.due_date && new Date(i.due_date) < new Date() && ['open', 'in_progress'].includes(i.status)
    ).length / insights.length;
    const blockerRatio = insights.filter(i => i.insight_type === 'blocker').length / insights.length;

    const riskScore = Math.min(100, (criticalRatio * 40 + overdueRatio * 40 + blockerRatio * 20) * 100);

    // Identify bottlenecks
    const bottlenecks: string[] = [];

    // Check for projects with high blocker count
    const projectBlockers = insights
      .filter(i => i.insight_type === 'blocker')
      .reduce((acc, i) => {
        if (i.project_name) {
          acc[i.project_name] = (acc[i.project_name] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

    Object.entries(projectBlockers).forEach(([project, count]) => {
      if (count >= 3) {
        bottlenecks.push(`${project}: ${count} blockers`);
      }
    });

    // Check for team members with overdue items
    const memberOverdue = insights
      .filter(i => i.due_date && new Date(i.due_date) < new Date() && i.assigned_to)
      .reduce((acc, i) => {
        if (i.assigned_to) {
          acc[i.assigned_to] = (acc[i.assigned_to] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

    Object.entries(memberOverdue).forEach(([member, count]) => {
      if (count >= 3) {
        bottlenecks.push(`${member}: ${count} overdue items`);
      }
    });

    return {
      expectedCompletionTime,
      riskScore,
      velocityTrend,
      bottlenecks,
    };
  }

  private calculateTeamMetrics(insights: ProjectInsight[], now: Date) {
    const teamMap = new Map<string, {
      totalAssigned: number;
      completed: number;
      inProgress: number;
      overdue: number;
      completionTimes: number[];
    }>();

    insights.forEach(i => {
      if (i.assigned_to) {
        const existing = teamMap.get(i.assigned_to) || {
          totalAssigned: 0,
          completed: 0,
          inProgress: 0,
          overdue: 0,
          completionTimes: [],
        };

        existing.totalAssigned++;

        if (i.status === 'completed') {
          existing.completed++;
          if (i.created_at && i.updated_at) {
            const days = (new Date(i.updated_at).getTime() - new Date(i.created_at).getTime()) / (1000 * 60 * 60 * 24);
            existing.completionTimes.push(days);
          }
        } else if (i.status === 'in_progress') {
          existing.inProgress++;
        }

        if (i.due_date && new Date(i.due_date) < now && ['open', 'in_progress'].includes(i.status)) {
          existing.overdue++;
        }

        teamMap.set(i.assigned_to, existing);
      }
    });

    return Array.from(teamMap.entries()).map(([member, data]) => {
      const avgCompletionTime = data.completionTimes.length > 0
        ? data.completionTimes.reduce((a, b) => a + b, 0) / data.completionTimes.length
        : 0;

      const efficiency = data.totalAssigned > 0
        ? ((data.completed - data.overdue) / data.totalAssigned) * 100
        : 0;

      return {
        member,
        totalAssigned: data.totalAssigned,
        completed: data.completed,
        inProgress: data.inProgress,
        overdue: data.overdue,
        avgCompletionTime,
        efficiency: Math.max(0, efficiency),
      };
    });
  }

  private calculateProjectHealth(insights: ProjectInsight[]) {
    const projectMap = new Map<string, ProjectInsight[]>();

    insights.forEach(i => {
      if (i.project_name) {
        const existing = projectMap.get(i.project_name) || [];
        existing.push(i);
        projectMap.set(i.project_name, existing);
      }
    });

    return Array.from(projectMap.entries()).map(([project, projectInsights]) => {
      const total = projectInsights.length;
      const completed = projectInsights.filter(i => i.status === 'completed').length;
      const blockers = projectInsights.filter(i => i.insight_type === 'blocker').length;
      const criticalIssues = projectInsights.filter(
        i => i.priority === 'critical' && ['open', 'in_progress'].includes(i.status)
      ).length;

      const completionPercentage = total > 0 ? (completed / total) * 100 : 0;

      // Calculate health score (0-100)
      let healthScore = 100;
      healthScore -= blockers * 10;
      healthScore -= criticalIssues * 15;
      healthScore -= (100 - completionPercentage) * 0.3;
      healthScore = Math.max(0, Math.min(100, healthScore));

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (healthScore < 40 || criticalIssues > 3 || blockers > 2) riskLevel = 'high';
      else if (healthScore < 70 || criticalIssues > 1 || blockers > 0) riskLevel = 'medium';

      // Estimate completion date based on velocity
      const openItems = projectInsights.filter(i => ['open', 'in_progress'].includes(i.status)).length;
      const completedInLastWeek = projectInsights.filter(
        i => i.status === 'completed' && new Date(i.updated_at) > subDays(new Date(), 7)
      ).length;

      let estimatedCompletionDate: Date | null = null;
      if (completedInLastWeek > 0 && openItems > 0) {
        const weeksToComplete = openItems / completedInLastWeek;
        estimatedCompletionDate = new Date();
        estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + weeksToComplete * 7);
      }

      return {
        project,
        healthScore,
        riskLevel,
        blockers,
        criticalIssues,
        completionPercentage,
        estimatedCompletionDate,
      };
    });
  }

  async getInsightsByDateRange(startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase
      .from('project_insights')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getTeamWorkload() {
    const { data, error } = await this.supabase
      .from('project_insights')
      .select('assigned_to, status, priority')
      .in('status', ['open', 'in_progress'])
      .not('assigned_to', 'is', null);

    if (error) throw error;

    const workload = data?.reduce((acc, item) => {
      const member = item.assigned_to!;
      if (!acc[member]) {
        acc[member] = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
      }
      acc[member].total++;
      acc[member][item.priority]++;
      return acc;
    }, {} as Record<string, any>);

    return workload;
  }

  async getProjectRisks(projectName?: string) {
    let query = this.supabase
      .from('project_insights')
      .select('*')
      .in('insight_type', ['risk', 'blocker', 'technical_issue'])
      .in('status', ['open', 'in_progress']);

    if (projectName) {
      query = query.eq('project_name', projectName);
    }

    const { data, error } = await query
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}