import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type InsightType = 'action_item' | 'decision' | 'risk' | 'milestone' | 'blocker' | 'dependency' | 'budget_update' | 'timeline_change' | 'stakeholder_feedback' | 'technical_issue' | 'opportunity' | 'concern';
export type InsightPriority = 'critical' | 'high' | 'medium' | 'low';
export type InsightStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface Insight {
  id: string;
  insight_type: InsightType;
  title: string;
  description: string;
  confidence_score?: number;
  priority: InsightPriority;
  status: InsightStatus;
  project_name?: string;
  assigned_to?: string;
  due_date?: string;
  source_document_id?: string;
  source_meeting_title?: string;
  source_date?: string;
  speakers?: string[];
  keywords?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface InsightsSummary {
  total_insights: number;
  insights_by_type: Record<string, number>;
  insights_by_priority: Record<string, number>;
  insights_by_status: Record<string, number>;
  active_projects: Record<string, number>;
  critical_items: number;
  overdue_items: number;
}

export const useInsights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchInsights = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setInsights(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [user]);

  return { insights, loading, error, refetch: fetchInsights };
};

export const useInsightsSummary = (daysBack: number = 30) => {
  const [summary, setSummary] = useState<InsightsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSummary = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .rpc('get_insights_summary', { days_back: daysBack });

        if (error) throw error;
        setSummary(data?.[0] || null);
      } catch (err) {
        console.error('Failed to fetch insights summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [user, daysBack]);

  return { summary, loading };
};

export const useActiveInsights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchActiveInsights = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('active_insights')
          .select('*')
          .limit(10);

        if (error) throw error;
        setInsights(data || []);
      } catch (err) {
        console.error('Failed to fetch active insights:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveInsights();
  }, [user]);

  return { insights, loading };
};