// Re-export the generated database types
export type { Database } from './database.types';

// Additional type exports for convenience
export type DocumentInsight = Database['public']['Tables']['document_insights']['Row'];
export type ProjectInsight = Database['public']['Tables']['project_insights']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];

// Legacy type compatibility
export type LegacyDatabase = {
  public: {
    Tables: {
      document_insights: {
        Row: {
          id: string;
          document_id: string;
          title: string;
          description: string;
          insight_type: string;
          severity: string | null;
          confidence_score: number | null;
          assignee: string | null;
          due_date: string | null;
          resolved: boolean | null;
          project_id: number | null;
          doc_title: string | null;
          business_impact: string | null;
          financial_impact: number | null;
          stakeholders_affected: string[] | null;
          dependencies: string[] | null;
          exact_quotes: string[] | null;
          source_meetings: string[] | null;
          urgency_indicators: string[] | null;
          cross_project_impact: number[] | null;
          numerical_data: any | null;
          metadata: any | null;
          created_at: string | null;
          generated_by: string;
          critical_path_impact: boolean | null;
        };
        Insert: {
          id?: number;
          insight_type: 'action_item' | 'decision' | 'risk' | 'milestone' | 'blocker' | 'dependency' | 'budget_update' | 'timeline_change' | 'stakeholder_feedback' | 'technical_issue' | 'opportunity' | 'concern';
          title: string;
          description: string;
          confidence_score?: number | null;
          priority?: 'critical' | 'high' | 'medium' | 'low';
          status?: 'open' | 'in_progress' | 'completed' | 'cancelled';
          project_name?: string | null;
          assigned_to?: string | null;
          due_date?: string | null;
          source_document_id?: string | null;
          source_meeting_title?: string | null;
          source_date?: string | null;
          speakers?: string[] | null;
          keywords?: string[] | null;
          metadata?: any | null;
          related_insights?: string[] | null;
          created_at?: string;
          updated_at?: string;
          processed_by?: string;
        };
        Update: {
          id?: number;
          insight_type?: 'action_item' | 'decision' | 'risk' | 'milestone' | 'blocker' | 'dependency' | 'budget_update' | 'timeline_change' | 'stakeholder_feedback' | 'technical_issue' | 'opportunity' | 'concern';
          title?: string;
          description?: string;
          confidence_score?: number | null;
          priority?: 'critical' | 'high' | 'medium' | 'low';
          status?: 'open' | 'in_progress' | 'completed' | 'cancelled';
          project_name?: string | null;
          assigned_to?: string | null;
          due_date?: string | null;
          source_document_id?: string | null;
          source_meeting_title?: string | null;
          source_date?: string | null;
          speakers?: string[] | null;
          keywords?: string[] | null;
          metadata?: any | null;
          related_insights?: string[] | null;
          created_at?: string;
          updated_at?: string;
          processed_by?: string;
        };
      };
      documents: {
        Row: {
          id: number;
          content: string | null;
          metadata: any | null;
          embedding: number[] | null;
        };
        Insert: {
          id?: number;
          content?: string | null;
          metadata?: any | null;
          embedding?: number[] | null;
        };
        Update: {
          id?: number;
          content?: string | null;
          metadata?: any | null;
          embedding?: number[] | null;
        };
      };
      conversations: {
        Row: {
          session_id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          last_message_at: string;
          is_archived: boolean;
          metadata: any;
        };
        Insert: {
          session_id: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
          last_message_at?: string;
          is_archived?: boolean;
          metadata?: any;
        };
        Update: {
          session_id?: string;
          user_id?: string;
          title?: string | null;
          created_at?: string;
          last_message_at?: string;
          is_archived?: boolean;
          metadata?: any;
        };
      };
      messages: {
        Row: {
          id: number;
          session_id: string;
          message: any;
          message_data: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          session_id: string;
          message: any;
          message_data?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          session_id?: string;
          message?: any;
          message_data?: string | null;
          created_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      active_insights: {
        Row: {
          id: number;
          insight_type: string;
          title: string;
          description: string;
          confidence_score: number | null;
          priority: string;
          status: string;
          project_name: string | null;
          assigned_to: string | null;
          due_date: string | null;
          source_meeting_title: string | null;
          source_date: string | null;
          speakers: string[] | null;
          keywords: string[] | null;
          created_at: string;
          updated_at: string;
          is_overdue: boolean;
          priority_score: number;
        };
      };
    };
    Functions: {
      get_insights_summary: {
        Args: {
          days_back?: number;
        };
        Returns: {
          total_insights: number;
          insights_by_type: any;
          insights_by_priority: any;
          insights_by_status: any;
          active_projects: any;
          critical_items: number;
          overdue_items: number;
        }[];
      };
      search_project_insights: {
        Args: {
          search_query?: string;
          insight_types?: string[];
          priorities?: string[];
          status_filters?: string[];
          project_name_filter?: string;
          assigned_to_filter?: string;
          date_from?: string;
          date_to?: string;
          match_count?: number;
        };
        Returns: {
          id: number;
          insight_type: string;
          title: string;
          description: string;
          confidence_score: number;
          priority: string;
          status: string;
          project_name: string;
          assigned_to: string;
          due_date: string;
          source_meeting_title: string;
          source_date: string;
          speakers: string[];
          keywords: string[];
          created_at: string;
          search_rank: number;
        }[];
      };
      get_document_insights: {
        Args: {
          doc_id: string;
          include_related?: boolean;
        };
        Returns: {
          id: number;
          insight_type: string;
          title: string;
          description: string;
          priority: string;
          status: string;
          assigned_to: string;
          due_date: string;
          keywords: string[];
          created_at: string;
        }[];
      };
    };
    Enums: {
      insight_type: 'action_item' | 'decision' | 'risk' | 'milestone' | 'blocker' | 'dependency' | 'budget_update' | 'timeline_change' | 'stakeholder_feedback' | 'technical_issue' | 'opportunity' | 'concern';
      insight_priority: 'critical' | 'high' | 'medium' | 'low';
      insight_status: 'open' | 'in_progress' | 'completed' | 'cancelled';
    };
  };
};