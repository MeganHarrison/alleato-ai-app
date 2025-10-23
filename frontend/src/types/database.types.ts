export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      __drizzle_migrations: {
        Row: {
          created_at: string | null
          hash: string
        }
        Insert: {
          created_at?: string | null
          hash: string
        }
        Update: {
          created_at?: string | null
          hash?: string
        }
        Relationships: []
      }
      ai_analysis_jobs: {
        Row: {
          completed_at: string | null
          confidence_metrics: Json | null
          config: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          job_type: string
          model_version: string | null
          processing_time_ms: number | null
          results: Json | null
          started_at: string | null
          status: string | null
          submittal_id: string
        }
        Insert: {
          completed_at?: string | null
          confidence_metrics?: Json | null
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type: string
          model_version?: string | null
          processing_time_ms?: number | null
          results?: Json | null
          started_at?: string | null
          status?: string | null
          submittal_id: string
        }
        Update: {
          completed_at?: string | null
          confidence_metrics?: Json | null
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type?: string
          model_version?: string | null
          processing_time_ms?: number | null
          results?: Json | null
          started_at?: string | null
          status?: string | null
          submittal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_jobs_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "active_submittals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_jobs_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "submittals"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          assigned_to: string | null
          assignee: string | null
          business_impact: string | null
          chunks_id: string | null
          confidence_score: number | null
          created_at: string | null
          cross_project_impact: number[] | null
          dependencies: Json | null
          description: string
          document_id: string | null
          due_date: string | null
          exact_quotes: Json | null
          exact_quotes_text: string | null
          financial_impact: number | null
          id: number
          insight_type: string | null
          meeting_date: string | null
          meeting_id: string | null
          meeting_name: string | null
          metadata: Json | null
          numerical_data: Json | null
          project_id: number | null
          project_name: string | null
          resolved: number | null
          resolved_at: string | null
          severity: string | null
          source_meetings: string | null
          stakeholders_affected: string[] | null
          status: string | null
          timeline_impact_days: number | null
          title: string
          urgency_indicators: string[] | null
        }
        Insert: {
          assigned_to?: string | null
          assignee?: string | null
          business_impact?: string | null
          chunks_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          cross_project_impact?: number[] | null
          dependencies?: Json | null
          description: string
          document_id?: string | null
          due_date?: string | null
          exact_quotes?: Json | null
          exact_quotes_text?: string | null
          financial_impact?: number | null
          id?: number
          insight_type?: string | null
          meeting_date?: string | null
          meeting_id?: string | null
          meeting_name?: string | null
          metadata?: Json | null
          numerical_data?: Json | null
          project_id?: number | null
          project_name?: string | null
          resolved?: number | null
          resolved_at?: string | null
          severity?: string | null
          source_meetings?: string | null
          stakeholders_affected?: string[] | null
          status?: string | null
          timeline_impact_days?: number | null
          title: string
          urgency_indicators?: string[] | null
        }
        Update: {
          assigned_to?: string | null
          assignee?: string | null
          business_impact?: string | null
          chunks_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          cross_project_impact?: number[] | null
          dependencies?: Json | null
          description?: string
          document_id?: string | null
          due_date?: string | null
          exact_quotes?: Json | null
          exact_quotes_text?: string | null
          financial_impact?: number | null
          id?: number
          insight_type?: string | null
          meeting_date?: string | null
          meeting_id?: string | null
          meeting_name?: string | null
          metadata?: Json | null
          numerical_data?: Json | null
          project_id?: number | null
          project_name?: string | null
          resolved?: number | null
          resolved_at?: string | null
          severity?: string | null
          source_meetings?: string | null
          stakeholders_affected?: string[] | null
          status?: string | null
          timeline_impact_days?: number | null
          title?: string
          urgency_indicators?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_chunks_id_fkey"
            columns: ["chunks_id"]
            isOneToOne: false
            referencedRelation: "chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models: {
        Row: {
          config: Json | null
          created_at: string | null
          deployment_date: string | null
          description: string | null
          id: string
          is_active: boolean | null
          model_type: string
          name: string
          performance_metrics: Json | null
          version: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          deployment_date?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          model_type: string
          name: string
          performance_metrics?: Json | null
          version: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          deployment_date?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          model_type?: string
          name?: string
          performance_metrics?: Json | null
          version?: string
        }
        Relationships: []
      }
      archon_code_examples: {
        Row: {
          chunk_number: number
          content: string
          created_at: string
          embedding: string | null
          id: number
          metadata: Json
          source_id: string
          summary: string
          url: string
        }
        Insert: {
          chunk_number: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json
          source_id: string
          summary: string
          url: string
        }
        Update: {
          chunk_number?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json
          source_id?: string
          summary?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "archon_code_examples_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "archon_sources"
            referencedColumns: ["source_id"]
          },
        ]
      }
      archon_crawled_pages: {
        Row: {
          chunk_number: number
          content: string
          created_at: string
          embedding: string | null
          id: number
          metadata: Json
          source_id: string
          url: string
        }
        Insert: {
          chunk_number: number
          content: string
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json
          source_id: string
          url: string
        }
        Update: {
          chunk_number?: number
          content?: string
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json
          source_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "archon_crawled_pages_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "archon_sources"
            referencedColumns: ["source_id"]
          },
        ]
      }
      archon_document_versions: {
        Row: {
          change_summary: string | null
          change_type: string | null
          content: Json
          created_at: string | null
          created_by: string | null
          document_id: string | null
          field_name: string
          id: string
          project_id: string | null
          task_id: string | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          change_type?: string | null
          content: Json
          created_at?: string | null
          created_by?: string | null
          document_id?: string | null
          field_name: string
          id?: string
          project_id?: string | null
          task_id?: string | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          change_type?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          document_id?: string | null
          field_name?: string
          id?: string
          project_id?: string | null
          task_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "archon_document_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "archon_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archon_document_versions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "archon_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      archon_project_sources: {
        Row: {
          created_by: string | null
          id: string
          linked_at: string | null
          notes: string | null
          project_id: string | null
          source_id: string
        }
        Insert: {
          created_by?: string | null
          id?: string
          linked_at?: string | null
          notes?: string | null
          project_id?: string | null
          source_id: string
        }
        Update: {
          created_by?: string | null
          id?: string
          linked_at?: string | null
          notes?: string | null
          project_id?: string | null
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "archon_project_sources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "archon_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      archon_projects: {
        Row: {
          created_at: string | null
          data: Json | null
          description: string | null
          docs: Json | null
          features: Json | null
          github_repo: string | null
          id: string
          pinned: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          docs?: Json | null
          features?: Json | null
          github_repo?: string | null
          id?: string
          pinned?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          docs?: Json | null
          features?: Json | null
          github_repo?: string | null
          id?: string
          pinned?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      archon_prompts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          prompt: string
          prompt_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          prompt: string
          prompt_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          prompt?: string
          prompt_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      archon_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          encrypted_value: string | null
          id: string
          is_encrypted: boolean | null
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          encrypted_value?: string | null
          id?: string
          is_encrypted?: boolean | null
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          encrypted_value?: string | null
          id?: string
          is_encrypted?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      archon_sources: {
        Row: {
          created_at: string
          metadata: Json | null
          source_id: string
          summary: string | null
          title: string | null
          total_word_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          metadata?: Json | null
          source_id: string
          summary?: string | null
          title?: string | null
          total_word_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          metadata?: Json | null
          source_id?: string
          summary?: string | null
          title?: string | null
          total_word_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      archon_tasks: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          archived_by: string | null
          assignee: string | null
          code_examples: Json | null
          created_at: string | null
          description: string | null
          feature: string | null
          id: string
          parent_task_id: string | null
          project_id: string | null
          sources: Json | null
          status: Database["public"]["Enums"]["task_status"] | null
          task_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          assignee?: string | null
          code_examples?: Json | null
          created_at?: string | null
          description?: string | null
          feature?: string | null
          id?: string
          parent_task_id?: string | null
          project_id?: string | null
          sources?: Json | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          assignee?: string | null
          code_examples?: Json | null
          created_at?: string | null
          description?: string | null
          feature?: string | null
          id?: string
          parent_task_id?: string | null
          project_id?: string | null
          sources?: Json | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "archon_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "archon_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archon_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "archon_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      asrs_blocks: {
        Row: {
          block_type: string
          html: string | null
          id: string
          meta: Json | null
          ordinal: number
          section_id: string
          source_text: string | null
        }
        Insert: {
          block_type: string
          html?: string | null
          id?: string
          meta?: Json | null
          ordinal: number
          section_id: string
          source_text?: string | null
        }
        Update: {
          block_type?: string
          html?: string | null
          id?: string
          meta?: Json | null
          ordinal?: number
          section_id?: string
          source_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asrs_blocks_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "asrs_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      asrs_configurations: {
        Row: {
          asrs_type: string
          config_name: string
          container_types: string[] | null
          cost_multiplier: number | null
          created_at: string | null
          id: string
          max_height_ft: number | null
          typical_applications: string[] | null
        }
        Insert: {
          asrs_type: string
          config_name: string
          container_types?: string[] | null
          cost_multiplier?: number | null
          created_at?: string | null
          id?: string
          max_height_ft?: number | null
          typical_applications?: string[] | null
        }
        Update: {
          asrs_type?: string
          config_name?: string
          container_types?: string[] | null
          cost_multiplier?: number | null
          created_at?: string | null
          id?: string
          max_height_ft?: number | null
          typical_applications?: string[] | null
        }
        Relationships: []
      }
      asrs_decision_matrix: {
        Row: {
          asrs_type: string
          container_type: string
          created_at: string | null
          figure_number: number
          id: string
          max_depth_ft: number
          max_spacing_ft: number
          page_number: number
          requires_flue_spaces: boolean | null
          requires_vertical_barriers: boolean | null
          sprinkler_count: number
          sprinkler_numbering: string | null
          title: string | null
        }
        Insert: {
          asrs_type: string
          container_type: string
          created_at?: string | null
          figure_number: number
          id?: string
          max_depth_ft: number
          max_spacing_ft: number
          page_number: number
          requires_flue_spaces?: boolean | null
          requires_vertical_barriers?: boolean | null
          sprinkler_count: number
          sprinkler_numbering?: string | null
          title?: string | null
        }
        Update: {
          asrs_type?: string
          container_type?: string
          created_at?: string | null
          figure_number?: number
          id?: string
          max_depth_ft?: number
          max_spacing_ft?: number
          page_number?: number
          requires_flue_spaces?: boolean | null
          requires_vertical_barriers?: boolean | null
          sprinkler_count?: number
          sprinkler_numbering?: string | null
          title?: string | null
        }
        Relationships: []
      }
      asrs_logic_cards: {
        Row: {
          citations: Json
          clause_id: string | null
          decision: Json
          doc: string
          id: number
          inputs: Json
          inserted_at: string
          page: number | null
          preconditions: Json
          purpose: string
          related_figure_ids: string[] | null
          related_table_ids: string[] | null
          section_id: string | null
          updated_at: string
          version: string
        }
        Insert: {
          citations: Json
          clause_id?: string | null
          decision: Json
          doc?: string
          id?: number
          inputs: Json
          inserted_at?: string
          page?: number | null
          preconditions: Json
          purpose: string
          related_figure_ids?: string[] | null
          related_table_ids?: string[] | null
          section_id?: string | null
          updated_at?: string
          version?: string
        }
        Update: {
          citations?: Json
          clause_id?: string | null
          decision?: Json
          doc?: string
          id?: number
          inputs?: Json
          inserted_at?: string
          page?: number | null
          preconditions?: Json
          purpose?: string
          related_figure_ids?: string[] | null
          related_table_ids?: string[] | null
          section_id?: string | null
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "asrs_logic_cards_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "asrs_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      asrs_protection_rules: {
        Row: {
          area_ft2: number | null
          asrs_type: string | null
          ceiling_height_max: number | null
          ceiling_height_min: number | null
          commodity_class: string | null
          container_material: string | null
          container_top: string | null
          container_wall: string | null
          density_gpm_ft2: number | null
          id: string
          k_factor: number | null
          notes: string | null
          pressure_psi: number | null
          section_id: string
          sprinkler_scheme: string | null
        }
        Insert: {
          area_ft2?: number | null
          asrs_type?: string | null
          ceiling_height_max?: number | null
          ceiling_height_min?: number | null
          commodity_class?: string | null
          container_material?: string | null
          container_top?: string | null
          container_wall?: string | null
          density_gpm_ft2?: number | null
          id?: string
          k_factor?: number | null
          notes?: string | null
          pressure_psi?: number | null
          section_id: string
          sprinkler_scheme?: string | null
        }
        Update: {
          area_ft2?: number | null
          asrs_type?: string | null
          ceiling_height_max?: number | null
          ceiling_height_min?: number | null
          commodity_class?: string | null
          container_material?: string | null
          container_top?: string | null
          container_wall?: string | null
          density_gpm_ft2?: number | null
          id?: string
          k_factor?: number | null
          notes?: string | null
          pressure_psi?: number | null
          section_id?: string
          sprinkler_scheme?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asrs_protection_rules_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "asrs_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      asrs_sections: {
        Row: {
          id: string
          number: string
          parent_id: string | null
          slug: string
          sort_key: number
          title: string
        }
        Insert: {
          id?: string
          number: string
          parent_id?: string | null
          slug: string
          sort_key: number
          title: string
        }
        Update: {
          id?: string
          number?: string
          parent_id?: string | null
          slug?: string
          sort_key?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "asrs_sections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "asrs_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      block_embeddings: {
        Row: {
          block_id: string
          embedding: string | null
        }
        Insert: {
          block_id: string
          embedding?: string | null
        }
        Update: {
          block_id?: string
          embedding?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "block_embeddings_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: true
            referencedRelation: "asrs_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      briefing_runs: {
        Row: {
          briefing_id: string | null
          error: string | null
          finished_at: string | null
          id: string
          input_doc_ids: string[] | null
          project_id: number | null
          started_at: string | null
          status: string | null
          token_usage: Json | null
        }
        Insert: {
          briefing_id?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          input_doc_ids?: string[] | null
          project_id?: number | null
          started_at?: string | null
          status?: string | null
          token_usage?: Json | null
        }
        Update: {
          briefing_id?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          input_doc_ids?: string[] | null
          project_id?: number | null
          started_at?: string | null
          status?: string | null
          token_usage?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "briefing_runs_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: false
            referencedRelation: "project_briefings"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_history: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          session_id: string
          sources: Json | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
          sources?: Json | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
          sources?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          session_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          session_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chats: {
        Row: {
          id: string
        }
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          document_id: string
          document_title: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          token_count: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          document_id: string
          document_title?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          token_count?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          document_id?: string
          document_title?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents_ordered_view"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company_id: string | null
          created_at: string
          id: number
          name: string | null
          status: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: number
          name?: string | null
          status?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: number
          name?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          state: string | null
          title: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          state?: string | null
          title?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          state?: string | null
          title?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_context: {
        Row: {
          goals: Json | null
          id: string
          okrs: Json | null
          org_structure: Json | null
          policies: Json | null
          resource_constraints: Json | null
          strategic_initiatives: Json | null
          updated_at: string | null
        }
        Insert: {
          goals?: Json | null
          id?: string
          okrs?: Json | null
          org_structure?: Json | null
          policies?: Json | null
          resource_constraints?: Json | null
          strategic_initiatives?: Json | null
          updated_at?: string | null
        }
        Update: {
          goals?: Json | null
          id?: string
          okrs?: Json | null
          org_structure?: Json | null
          policies?: Json | null
          resource_constraints?: Json | null
          strategic_initiatives?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          birthday: string | null
          created_at: string
          department: string | null
          email: string | null
          first_name: string | null
          id: number
          last_name: string | null
          metadata: Json | null
          notes: string | null
          phone: string | null
          projects: string[] | null
          role: string | null
        }
        Insert: {
          birthday?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          projects?: string[] | null
          role?: string | null
        }
        Update: {
          birthday?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: number
          last_name?: string | null
          metadata?: Json | null
          notes?: string | null
          phone?: string | null
          projects?: string[] | null
          role?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          is_archived: boolean | null
          last_message_at: string | null
          metadata: Json | null
          session_id: string
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          is_archived?: boolean | null
          last_message_at?: string | null
          metadata?: Json | null
          session_id: string
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          is_archived?: boolean | null
          last_message_at?: string | null
          metadata?: Json | null
          session_id?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_factors: {
        Row: {
          base_cost_per_unit: number | null
          complexity_multiplier: number | null
          factor_name: string
          factor_type: string
          id: string
          unit_type: string | null
          updated_at: string | null
        }
        Insert: {
          base_cost_per_unit?: number | null
          complexity_multiplier?: number | null
          factor_name: string
          factor_type: string
          id?: string
          unit_type?: string | null
          updated_at?: string | null
        }
        Update: {
          base_cost_per_unit?: number | null
          complexity_multiplier?: number | null
          factor_name?: string
          factor_type?: string
          id?: string
          unit_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      design_recommendations: {
        Row: {
          created_at: string | null
          description: string
          id: string
          implementation_effort: string | null
          potential_savings: number | null
          priority_level: string
          project_id: string | null
          recommendation_type: string
          technical_details: Json | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          implementation_effort?: string | null
          potential_savings?: number | null
          priority_level: string
          project_id?: string | null
          recommendation_type: string
          technical_details?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          implementation_effort?: string | null
          potential_savings?: number | null
          priority_level?: string
          project_id?: string | null
          recommendation_type?: string
          technical_details?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "user_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      discrepancies: {
        Row: {
          ai_model_version: string | null
          confidence_score: number | null
          created_at: string | null
          description: string
          discrepancy_type: string
          document_id: string | null
          id: string
          identified_by: string | null
          location_in_doc: Json | null
          severity: string
          spec_requirement: string | null
          specification_id: string | null
          status: string | null
          submittal_content: string | null
          submittal_id: string
          suggested_resolution: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_model_version?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description: string
          discrepancy_type: string
          document_id?: string | null
          id?: string
          identified_by?: string | null
          location_in_doc?: Json | null
          severity: string
          spec_requirement?: string | null
          specification_id?: string | null
          status?: string | null
          submittal_content?: string | null
          submittal_id: string
          suggested_resolution?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_model_version?: string | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string
          discrepancy_type?: string
          document_id?: string | null
          id?: string
          identified_by?: string | null
          location_in_doc?: Json | null
          severity?: string
          spec_requirement?: string | null
          specification_id?: string | null
          status?: string | null
          submittal_content?: string | null
          submittal_id?: string
          suggested_resolution?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discrepancies_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "submittal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discrepancies_specification_id_fkey"
            columns: ["specification_id"]
            isOneToOne: false
            referencedRelation: "specifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discrepancies_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "active_submittals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discrepancies_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "submittals"
            referencedColumns: ["id"]
          },
        ]
      }
      document_executive_summaries: {
        Row: {
          budget_discussions: Json | null
          competitive_intel: Json | null
          confidence_average: number | null
          cost_implications: number | null
          created_at: string | null
          critical_deadlines: Json | null
          critical_path_items: number | null
          decisions_made: Json | null
          delay_risks: Json | null
          document_id: string
          executive_summary: string
          financial_decisions_count: number | null
          id: number
          performance_issues: Json | null
          project_id: number | null
          relationship_changes: Json | null
          revenue_impact: number | null
          stakeholder_feedback_count: number | null
          strategic_pivots: Json | null
          timeline_concerns_count: number | null
          total_insights: number | null
          updated_at: string | null
        }
        Insert: {
          budget_discussions?: Json | null
          competitive_intel?: Json | null
          confidence_average?: number | null
          cost_implications?: number | null
          created_at?: string | null
          critical_deadlines?: Json | null
          critical_path_items?: number | null
          decisions_made?: Json | null
          delay_risks?: Json | null
          document_id: string
          executive_summary: string
          financial_decisions_count?: number | null
          id?: number
          performance_issues?: Json | null
          project_id?: number | null
          relationship_changes?: Json | null
          revenue_impact?: number | null
          stakeholder_feedback_count?: number | null
          strategic_pivots?: Json | null
          timeline_concerns_count?: number | null
          total_insights?: number | null
          updated_at?: string | null
        }
        Update: {
          budget_discussions?: Json | null
          competitive_intel?: Json | null
          confidence_average?: number | null
          cost_implications?: number | null
          created_at?: string | null
          critical_deadlines?: Json | null
          critical_path_items?: number | null
          decisions_made?: Json | null
          delay_risks?: Json | null
          document_id?: string
          executive_summary?: string
          financial_decisions_count?: number | null
          id?: number
          performance_issues?: Json | null
          project_id?: number | null
          relationship_changes?: Json | null
          revenue_impact?: number | null
          stakeholder_feedback_count?: number | null
          strategic_pivots?: Json | null
          timeline_concerns_count?: number | null
          total_insights?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      document_insights: {
        Row: {
          assignee: string | null
          business_impact: string | null
          confidence_score: number | null
          created_at: string | null
          critical_path_impact: boolean | null
          cross_project_impact: number[] | null
          dependencies: string[] | null
          description: string
          doc_title: string | null
          document_date: string | null
          document_id: string
          due_date: string | null
          exact_quotes: string[] | null
          financial_impact: number | null
          generated_by: string
          id: string
          insight_type: string
          metadata: Json | null
          numerical_data: Json | null
          project_id: number | null
          project_name: string | null
          resolved: boolean | null
          severity: string | null
          source_meetings: string[] | null
          stakeholders_affected: string[] | null
          title: string
          urgency_indicators: string[] | null
        }
        Insert: {
          assignee?: string | null
          business_impact?: string | null
          confidence_score?: number | null
          created_at?: string | null
          critical_path_impact?: boolean | null
          cross_project_impact?: number[] | null
          dependencies?: string[] | null
          description: string
          doc_title?: string | null
          document_date?: string | null
          document_id: string
          due_date?: string | null
          exact_quotes?: string[] | null
          financial_impact?: number | null
          generated_by?: string
          id?: string
          insight_type: string
          metadata?: Json | null
          numerical_data?: Json | null
          project_id?: number | null
          project_name?: string | null
          resolved?: boolean | null
          severity?: string | null
          source_meetings?: string[] | null
          stakeholders_affected?: string[] | null
          title: string
          urgency_indicators?: string[] | null
        }
        Update: {
          assignee?: string | null
          business_impact?: string | null
          confidence_score?: number | null
          created_at?: string | null
          critical_path_impact?: boolean | null
          cross_project_impact?: number[] | null
          dependencies?: string[] | null
          description?: string
          doc_title?: string | null
          document_date?: string | null
          document_id?: string
          due_date?: string | null
          exact_quotes?: string[] | null
          financial_impact?: number | null
          generated_by?: string
          id?: string
          insight_type?: string
          metadata?: Json | null
          numerical_data?: Json | null
          project_id?: number | null
          project_name?: string | null
          resolved?: boolean | null
          severity?: string | null
          source_meetings?: string[] | null
          stakeholders_affected?: string[] | null
          title?: string
          urgency_indicators?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "document_insights_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      document_metadata: {
        Row: {
          action_items: string | null
          bullet_points: string | null
          category: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          description: string | null
          duration_minutes: number | null
          employee: string | null
          entities: Json | null
          file_id: number | null
          fireflies_file_url: string | null
          fireflies_id: string | null
          fireflies_link: string | null
          id: string
          outline: string | null
          overview: string | null
          participants: string | null
          project: string | null
          project_id: number | null
          source: string | null
          summary: string | null
          tags: string | null
          title: string | null
          type: string | null
          url: string | null
        }
        Insert: {
          action_items?: string | null
          bullet_points?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          duration_minutes?: number | null
          employee?: string | null
          entities?: Json | null
          file_id?: number | null
          fireflies_file_url?: string | null
          fireflies_id?: string | null
          fireflies_link?: string | null
          id: string
          outline?: string | null
          overview?: string | null
          participants?: string | null
          project?: string | null
          project_id?: number | null
          source?: string | null
          summary?: string | null
          tags?: string | null
          title?: string | null
          type?: string | null
          url?: string | null
        }
        Update: {
          action_items?: string | null
          bullet_points?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          duration_minutes?: number | null
          employee?: string | null
          entities?: Json | null
          file_id?: number | null
          fireflies_file_url?: string | null
          fireflies_id?: string | null
          fireflies_link?: string | null
          id?: string
          outline?: string | null
          overview?: string | null
          participants?: string | null
          project?: string | null
          project_id?: number | null
          source?: string | null
          summary?: string | null
          tags?: string | null
          title?: string | null
          type?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_metadata_employee_fkey"
            columns: ["employee"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["email"]
          },
          {
            foreignKeyName: "document_metadata_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_metadata_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard_no_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_metadata_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_metadata_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "submittal_project_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      document_rows: {
        Row: {
          dataset_id: string | null
          id: number
          row_data: Json | null
        }
        Insert: {
          dataset_id?: string | null
          id?: number
          row_data?: Json | null
        }
        Update: {
          dataset_id?: string | null
          id?: number
          row_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_rows_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "document_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          action_items: string | null
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          embedding: string | null
          file_date: string | null
          file_id: string
          fireflies_id: string | null
          fireflies_link: string | null
          id: string
          metadata: Json | null
          processing_status: string | null
          project: string | null
          project_id: number | null
          source: string | null
          storage_object_id: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          action_items?: string | null
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          embedding?: string | null
          file_date?: string | null
          file_id: string
          fireflies_id?: string | null
          fireflies_link?: string | null
          id?: string
          metadata?: Json | null
          processing_status?: string | null
          project?: string | null
          project_id?: number | null
          source?: string | null
          storage_object_id?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          action_items?: string | null
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          embedding?: string | null
          file_date?: string | null
          file_id?: string
          fireflies_id?: string | null
          fireflies_link?: string | null
          id?: string
          metadata?: Json | null
          processing_status?: string | null
          project?: string | null
          project_id?: number | null
          source?: string | null
          storage_object_id?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "document_metadata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard_no_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "submittal_project_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          company_card: number | null
          created_at: string
          department: string | null
          email: string | null
          first_name: string | null
          id: number
          job_title: string | null
          last_name: string | null
          phone: string | null
          phone_allowance: number | null
          photo: string | null
          salery: string | null
          start_date: string | null
          supervisor: number | null
          supervisor_name: string | null
          truck_allowance: number | null
          updated_at: string
        }
        Insert: {
          company_card?: number | null
          created_at?: string
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: number
          job_title?: string | null
          last_name?: string | null
          phone?: string | null
          phone_allowance?: number | null
          photo?: string | null
          salery?: string | null
          start_date?: string | null
          supervisor?: number | null
          supervisor_name?: string | null
          truck_allowance?: number | null
          updated_at?: string
        }
        Update: {
          company_card?: number | null
          created_at?: string
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: number
          job_title?: string | null
          last_name?: string | null
          phone?: string | null
          phone_allowance?: number | null
          photo?: string | null
          salery?: string | null
          start_date?: string | null
          supervisor?: number | null
          supervisor_name?: string | null
          truck_allowance?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_supervisor_fkey"
            columns: ["supervisor"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      fm_blocks: {
        Row: {
          block_type: string
          created_at: string | null
          html: string
          id: string
          inline_figures: number[] | null
          inline_tables: string[] | null
          meta: Json | null
          ordinal: number
          page_reference: number | null
          search_vector: unknown
          section_id: string
          source_text: string
        }
        Insert: {
          block_type: string
          created_at?: string | null
          html: string
          id: string
          inline_figures?: number[] | null
          inline_tables?: string[] | null
          meta?: Json | null
          ordinal: number
          page_reference?: number | null
          search_vector?: unknown
          section_id: string
          source_text: string
        }
        Update: {
          block_type?: string
          created_at?: string | null
          html?: string
          id?: string
          inline_figures?: number[] | null
          inline_tables?: string[] | null
          meta?: Json | null
          ordinal?: number
          page_reference?: number | null
          search_vector?: unknown
          section_id?: string
          source_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "fm_blocks_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "fm_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      fm_cost_factors: {
        Row: {
          base_cost_per_unit: number | null
          complexity_multiplier: number | null
          component_type: string
          factor_name: string
          id: string
          last_updated: string | null
          region_adjustments: Json | null
          unit_type: string | null
        }
        Insert: {
          base_cost_per_unit?: number | null
          complexity_multiplier?: number | null
          component_type: string
          factor_name: string
          id?: string
          last_updated?: string | null
          region_adjustments?: Json | null
          unit_type?: string | null
        }
        Update: {
          base_cost_per_unit?: number | null
          complexity_multiplier?: number | null
          component_type?: string
          factor_name?: string
          id?: string
          last_updated?: string | null
          region_adjustments?: Json | null
          unit_type?: string | null
        }
        Relationships: []
      }
      fm_documents: {
        Row: {
          content: string | null
          created_at: string | null
          document_type: string | null
          embedding: string | null
          filename: string | null
          id: string
          metadata: Json | null
          processing_notes: string | null
          processing_status: string | null
          related_table_ids: string[] | null
          source: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          document_type?: string | null
          embedding?: string | null
          filename?: string | null
          id?: string
          metadata?: Json | null
          processing_notes?: string | null
          processing_status?: string | null
          related_table_ids?: string[] | null
          source?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          document_type?: string | null
          embedding?: string | null
          filename?: string | null
          id?: string
          metadata?: Json | null
          processing_notes?: string | null
          processing_status?: string | null
          related_table_ids?: string[] | null
          source?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fm_form_submissions: {
        Row: {
          contact_info: Json | null
          cost_analysis: Json | null
          created_at: string | null
          id: string
          lead_score: number | null
          lead_status: string | null
          matched_table_ids: string[] | null
          parsed_requirements: Json | null
          project_details: Json | null
          recommendations: Json | null
          selected_configuration: Json | null
          session_id: string | null
          similarity_scores: number[] | null
          updated_at: string | null
          user_input: Json
        }
        Insert: {
          contact_info?: Json | null
          cost_analysis?: Json | null
          created_at?: string | null
          id?: string
          lead_score?: number | null
          lead_status?: string | null
          matched_table_ids?: string[] | null
          parsed_requirements?: Json | null
          project_details?: Json | null
          recommendations?: Json | null
          selected_configuration?: Json | null
          session_id?: string | null
          similarity_scores?: number[] | null
          updated_at?: string | null
          user_input: Json
        }
        Update: {
          contact_info?: Json | null
          cost_analysis?: Json | null
          created_at?: string | null
          id?: string
          lead_score?: number | null
          lead_status?: string | null
          matched_table_ids?: string[] | null
          parsed_requirements?: Json | null
          project_details?: Json | null
          recommendations?: Json | null
          selected_configuration?: Json | null
          session_id?: string | null
          similarity_scores?: number[] | null
          updated_at?: string | null
          user_input?: Json
        }
        Relationships: []
      }
      fm_global_figures: {
        Row: {
          aisle_width_ft: number | null
          applicable_commodities: string[] | null
          asrs_type: string
          axis_titles: string[] | null
          axis_units: string[] | null
          callouts_labels: string[] | null
          ceiling_height_ft: number | null
          clean_caption: string
          container_type: string | null
          created_at: string | null
          embedded_tables: Json | null
          embedding: string | null
          figure_number: number
          figure_type: string
          footnotes: string[] | null
          id: string
          image: string | null
          machine_readable_claims: Json | null
          max_depth_ft: number | null
          max_depth_m: number | null
          max_spacing_ft: number | null
          max_spacing_m: number | null
          normalized_summary: string
          page_number: number | null
          related_tables: number[] | null
          search_keywords: string[] | null
          section_reference: string | null
          section_references: string[] | null
          special_conditions: string[] | null
          system_requirements: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          aisle_width_ft?: number | null
          applicable_commodities?: string[] | null
          asrs_type: string
          axis_titles?: string[] | null
          axis_units?: string[] | null
          callouts_labels?: string[] | null
          ceiling_height_ft?: number | null
          clean_caption: string
          container_type?: string | null
          created_at?: string | null
          embedded_tables?: Json | null
          embedding?: string | null
          figure_number: number
          figure_type: string
          footnotes?: string[] | null
          id?: string
          image?: string | null
          machine_readable_claims?: Json | null
          max_depth_ft?: number | null
          max_depth_m?: number | null
          max_spacing_ft?: number | null
          max_spacing_m?: number | null
          normalized_summary: string
          page_number?: number | null
          related_tables?: number[] | null
          search_keywords?: string[] | null
          section_reference?: string | null
          section_references?: string[] | null
          special_conditions?: string[] | null
          system_requirements?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          aisle_width_ft?: number | null
          applicable_commodities?: string[] | null
          asrs_type?: string
          axis_titles?: string[] | null
          axis_units?: string[] | null
          callouts_labels?: string[] | null
          ceiling_height_ft?: number | null
          clean_caption?: string
          container_type?: string | null
          created_at?: string | null
          embedded_tables?: Json | null
          embedding?: string | null
          figure_number?: number
          figure_type?: string
          footnotes?: string[] | null
          id?: string
          image?: string | null
          machine_readable_claims?: Json | null
          max_depth_ft?: number | null
          max_depth_m?: number | null
          max_spacing_ft?: number | null
          max_spacing_m?: number | null
          normalized_summary?: string
          page_number?: number | null
          related_tables?: number[] | null
          search_keywords?: string[] | null
          section_reference?: string | null
          section_references?: string[] | null
          special_conditions?: string[] | null
          system_requirements?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      fm_global_tables: {
        Row: {
          aisle_width_requirements: string | null
          applicable_figures: number[] | null
          asrs_type: string
          ceiling_height_max_ft: number | null
          ceiling_height_min_ft: number | null
          commodity_types: string[] | null
          container_type: string | null
          created_at: string | null
          design_parameters: Json | null
          estimated_page_number: number | null
          extraction_status: string | null
          figures: string | null
          id: string
          image: string | null
          protection_scheme: string
          rack_configuration: Json | null
          raw_data: Json | null
          section_references: string[] | null
          special_conditions: string[] | null
          sprinkler_specifications: Json | null
          storage_height_max_ft: number | null
          system_type: string
          table_id: string
          table_number: number
          title: string
          updated_at: string | null
        }
        Insert: {
          aisle_width_requirements?: string | null
          applicable_figures?: number[] | null
          asrs_type: string
          ceiling_height_max_ft?: number | null
          ceiling_height_min_ft?: number | null
          commodity_types?: string[] | null
          container_type?: string | null
          created_at?: string | null
          design_parameters?: Json | null
          estimated_page_number?: number | null
          extraction_status?: string | null
          figures?: string | null
          id?: string
          image?: string | null
          protection_scheme: string
          rack_configuration?: Json | null
          raw_data?: Json | null
          section_references?: string[] | null
          special_conditions?: string[] | null
          sprinkler_specifications?: Json | null
          storage_height_max_ft?: number | null
          system_type: string
          table_id: string
          table_number: number
          title: string
          updated_at?: string | null
        }
        Update: {
          aisle_width_requirements?: string | null
          applicable_figures?: number[] | null
          asrs_type?: string
          ceiling_height_max_ft?: number | null
          ceiling_height_min_ft?: number | null
          commodity_types?: string[] | null
          container_type?: string | null
          created_at?: string | null
          design_parameters?: Json | null
          estimated_page_number?: number | null
          extraction_status?: string | null
          figures?: string | null
          id?: string
          image?: string | null
          protection_scheme?: string
          rack_configuration?: Json | null
          raw_data?: Json | null
          section_references?: string[] | null
          special_conditions?: string[] | null
          sprinkler_specifications?: Json | null
          storage_height_max_ft?: number | null
          system_type?: string
          table_id?: string
          table_number?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fm_global_tables_figures_fkey"
            columns: ["figures"]
            isOneToOne: false
            referencedRelation: "fm_global_figures"
            referencedColumns: ["id"]
          },
        ]
      }
      fm_optimization_rules: {
        Row: {
          created_at: string | null
          description: string | null
          estimated_savings_max: number | null
          estimated_savings_min: number | null
          id: string
          implementation_difficulty: string | null
          is_active: boolean | null
          priority_level: number | null
          rule_name: string
          suggested_changes: Json | null
          trigger_conditions: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          estimated_savings_max?: number | null
          estimated_savings_min?: number | null
          id?: string
          implementation_difficulty?: string | null
          is_active?: boolean | null
          priority_level?: number | null
          rule_name: string
          suggested_changes?: Json | null
          trigger_conditions?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          estimated_savings_max?: number | null
          estimated_savings_min?: number | null
          id?: string
          implementation_difficulty?: string | null
          is_active?: boolean | null
          priority_level?: number | null
          rule_name?: string
          suggested_changes?: Json | null
          trigger_conditions?: Json | null
        }
        Relationships: []
      }
      fm_optimization_suggestions: {
        Row: {
          applicable_codes: string[] | null
          created_at: string | null
          description: string | null
          estimated_savings: number | null
          form_submission_id: string | null
          id: string
          implementation_effort: string | null
          original_config: Json | null
          risk_level: string | null
          suggested_config: Json | null
          suggestion_type: string
          technical_justification: string | null
          title: string
        }
        Insert: {
          applicable_codes?: string[] | null
          created_at?: string | null
          description?: string | null
          estimated_savings?: number | null
          form_submission_id?: string | null
          id?: string
          implementation_effort?: string | null
          original_config?: Json | null
          risk_level?: string | null
          suggested_config?: Json | null
          suggestion_type: string
          technical_justification?: string | null
          title: string
        }
        Update: {
          applicable_codes?: string[] | null
          created_at?: string | null
          description?: string | null
          estimated_savings?: number | null
          form_submission_id?: string | null
          id?: string
          implementation_effort?: string | null
          original_config?: Json | null
          risk_level?: string | null
          suggested_config?: Json | null
          suggestion_type?: string
          technical_justification?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fm_optimization_suggestions_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "fm_form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      fm_sections: {
        Row: {
          breadcrumb_display: string[] | null
          created_at: string | null
          id: string
          is_visible: boolean | null
          number: string
          page_end: number
          page_start: number
          parent_id: string | null
          section_path: string[] | null
          section_type: string | null
          slug: string
          sort_key: number
          title: string
          updated_at: string | null
        }
        Insert: {
          breadcrumb_display?: string[] | null
          created_at?: string | null
          id: string
          is_visible?: boolean | null
          number: string
          page_end: number
          page_start: number
          parent_id?: string | null
          section_path?: string[] | null
          section_type?: string | null
          slug: string
          sort_key: number
          title: string
          updated_at?: string | null
        }
        Update: {
          breadcrumb_display?: string[] | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          number?: string
          page_end?: number
          page_start?: number
          parent_id?: string | null
          section_path?: string[] | null
          section_type?: string | null
          slug?: string
          sort_key?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fm_sections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "fm_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      fm_sprinkler_configs: {
        Row: {
          aisle_width_ft: number | null
          ceiling_height_ft: number
          coverage_type: string | null
          created_at: string | null
          design_area_sqft: number | null
          id: string
          k_factor: number | null
          k_factor_type: string | null
          notes: string | null
          orientation: string | null
          pressure_bar: number | null
          pressure_psi: number | null
          response_type: string | null
          spacing_ft: number | null
          special_conditions: string[] | null
          sprinkler_count: number | null
          storage_height_ft: number | null
          table_id: string
          temperature_rating: number | null
        }
        Insert: {
          aisle_width_ft?: number | null
          ceiling_height_ft: number
          coverage_type?: string | null
          created_at?: string | null
          design_area_sqft?: number | null
          id?: string
          k_factor?: number | null
          k_factor_type?: string | null
          notes?: string | null
          orientation?: string | null
          pressure_bar?: number | null
          pressure_psi?: number | null
          response_type?: string | null
          spacing_ft?: number | null
          special_conditions?: string[] | null
          sprinkler_count?: number | null
          storage_height_ft?: number | null
          table_id: string
          temperature_rating?: number | null
        }
        Update: {
          aisle_width_ft?: number | null
          ceiling_height_ft?: number
          coverage_type?: string | null
          created_at?: string | null
          design_area_sqft?: number | null
          id?: string
          k_factor?: number | null
          k_factor_type?: string | null
          notes?: string | null
          orientation?: string | null
          pressure_bar?: number | null
          pressure_psi?: number | null
          response_type?: string | null
          spacing_ft?: number | null
          special_conditions?: string[] | null
          sprinkler_count?: number | null
          storage_height_ft?: number | null
          table_id?: string
          temperature_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fm_sprinkler_configs_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "fm_global_tables"
            referencedColumns: ["table_id"]
          },
        ]
      }
      fm_table_vectors: {
        Row: {
          content_text: string
          content_type: string
          created_at: string | null
          embedding: string
          id: string
          metadata: Json | null
          table_id: string
        }
        Insert: {
          content_text: string
          content_type: string
          created_at?: string | null
          embedding: string
          id?: string
          metadata?: Json | null
          table_id: string
        }
        Update: {
          content_text?: string
          content_type?: string
          created_at?: string | null
          embedding?: string
          id?: string
          metadata?: Json | null
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fm_table_vectors_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "fm_global_tables"
            referencedColumns: ["table_id"]
          },
        ]
      }
      fm_text_chunks: {
        Row: {
          chunk_size: number | null
          chunk_summary: string | null
          clause_id: string | null
          complexity_score: number | null
          compliance_type: string | null
          content_type: string
          cost_impact: string | null
          created_at: string | null
          doc_id: string
          doc_version: string
          embedding: string | null
          extracted_requirements: string[] | null
          id: string
          page_number: number | null
          raw_text: string
          related_figures: number[] | null
          related_sections: string[] | null
          related_tables: string[] | null
          savings_opportunities: string[] | null
          search_keywords: string[] | null
          section_path: string[] | null
          topics: string[] | null
          updated_at: string | null
        }
        Insert: {
          chunk_size?: number | null
          chunk_summary?: string | null
          clause_id?: string | null
          complexity_score?: number | null
          compliance_type?: string | null
          content_type?: string
          cost_impact?: string | null
          created_at?: string | null
          doc_id?: string
          doc_version?: string
          embedding?: string | null
          extracted_requirements?: string[] | null
          id?: string
          page_number?: number | null
          raw_text: string
          related_figures?: number[] | null
          related_sections?: string[] | null
          related_tables?: string[] | null
          savings_opportunities?: string[] | null
          search_keywords?: string[] | null
          section_path?: string[] | null
          topics?: string[] | null
          updated_at?: string | null
        }
        Update: {
          chunk_size?: number | null
          chunk_summary?: string | null
          clause_id?: string | null
          complexity_score?: number | null
          compliance_type?: string | null
          content_type?: string
          cost_impact?: string | null
          created_at?: string | null
          doc_id?: string
          doc_version?: string
          embedding?: string | null
          extracted_requirements?: string[] | null
          id?: string
          page_number?: number | null
          raw_text?: string
          related_figures?: number[] | null
          related_sections?: string[] | null
          related_tables?: string[] | null
          savings_opportunities?: string[] | null
          search_keywords?: string[] | null
          section_path?: string[] | null
          topics?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      initiative_insights: {
        Row: {
          category: string | null
          chunks_id: string | null
          confidence: number | null
          context: string | null
          created_at: string | null
          document_id: string | null
          id: string
          initiative_id: number
          match_reasons: string[] | null
          meeting_id: string | null
          priority: string | null
          status: string | null
          text: string
        }
        Insert: {
          category?: string | null
          chunks_id?: string | null
          confidence?: number | null
          context?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          initiative_id: number
          match_reasons?: string[] | null
          meeting_id?: string | null
          priority?: string | null
          status?: string | null
          text: string
        }
        Update: {
          category?: string | null
          chunks_id?: string | null
          confidence?: number | null
          context?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          initiative_id?: number
          match_reasons?: string[] | null
          meeting_id?: string | null
          priority?: string | null
          status?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiative_insights_chunks_id_fkey"
            columns: ["chunks_id"]
            isOneToOne: false
            referencedRelation: "chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiative_insights_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiative_insights_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents_ordered_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiative_insights_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiative_insights_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives_with_insights"
            referencedColumns: ["id"]
          },
        ]
      }
      initiatives: {
        Row: {
          actual_completion: string | null
          aliases: string[] | null
          budget: number | null
          budget_used: number | null
          category: string
          completion_percentage: number | null
          created_at: string | null
          description: string | null
          documentation_links: string[] | null
          id: number
          keywords: string[] | null
          name: string
          notes: string | null
          owner: string | null
          priority: string | null
          related_project_ids: number[] | null
          stakeholders: string[] | null
          start_date: string | null
          status: string | null
          target_completion: string | null
          team_members: string[] | null
          updated_at: string | null
        }
        Insert: {
          actual_completion?: string | null
          aliases?: string[] | null
          budget?: number | null
          budget_used?: number | null
          category: string
          completion_percentage?: number | null
          created_at?: string | null
          description?: string | null
          documentation_links?: string[] | null
          id?: number
          keywords?: string[] | null
          name: string
          notes?: string | null
          owner?: string | null
          priority?: string | null
          related_project_ids?: number[] | null
          stakeholders?: string[] | null
          start_date?: string | null
          status?: string | null
          target_completion?: string | null
          team_members?: string[] | null
          updated_at?: string | null
        }
        Update: {
          actual_completion?: string | null
          aliases?: string[] | null
          budget?: number | null
          budget_used?: number | null
          category?: string
          completion_percentage?: number | null
          created_at?: string | null
          description?: string | null
          documentation_links?: string[] | null
          id?: number
          keywords?: string[] | null
          name?: string
          notes?: string | null
          owner?: string | null
          priority?: string | null
          related_project_ids?: number[] | null
          stakeholders?: string[] | null
          start_date?: string | null
          status?: string | null
          target_completion?: string | null
          team_members?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      memories: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          computed_session_user_id: string | null
          created_at: string | null
          id: number
          message: Json
          message_data: string | null
          session_id: string
        }
        Insert: {
          computed_session_user_id?: string | null
          created_at?: string | null
          id?: never
          message: Json
          message_data?: string | null
          session_id: string
        }
        Update: {
          computed_session_user_id?: string | null
          created_at?: string | null
          id?: never
          message?: Json
          message_data?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["session_id"]
          },
        ]
      }
      nods_page: {
        Row: {
          checksum: string | null
          id: number
          meta: Json | null
          parent_page_id: number | null
          path: string
          source: string | null
          type: string | null
        }
        Insert: {
          checksum?: string | null
          id?: number
          meta?: Json | null
          parent_page_id?: number | null
          path: string
          source?: string | null
          type?: string | null
        }
        Update: {
          checksum?: string | null
          id?: number
          meta?: Json | null
          parent_page_id?: number | null
          path?: string
          source?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nods_page_parent_page_id_fkey"
            columns: ["parent_page_id"]
            isOneToOne: false
            referencedRelation: "nods_page"
            referencedColumns: ["id"]
          },
        ]
      }
      nods_page_section: {
        Row: {
          content: string | null
          embedding: string | null
          heading: string | null
          id: number
          page_id: number
          slug: string | null
          token_count: number | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          heading?: string | null
          id?: number
          page_id: number
          slug?: string | null
          token_count?: number | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          heading?: string | null
          id?: number
          page_id?: number
          slug?: string | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nods_page_section_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "nods_page"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_rules: {
        Row: {
          condition_from: Json | null
          condition_to: Json | null
          cost_impact: number | null
          description: string | null
          embedding: string | null
          id: number
        }
        Insert: {
          condition_from?: Json | null
          condition_to?: Json | null
          cost_impact?: number | null
          description?: string | null
          embedding?: string | null
          id?: number
        }
        Update: {
          condition_from?: Json | null
          condition_to?: Json | null
          cost_impact?: number | null
          description?: string | null
          embedding?: string | null
          id?: number
        }
        Relationships: []
      }
      parts: {
        Row: {
          createdAt: string
          data_weather_id: string | null
          data_weather_location: string | null
          data_weather_temperature: number | null
          data_weather_weather: string | null
          file_filename: string | null
          file_mediaType: string | null
          file_url: string | null
          id: string
          messageId: string
          order: number
          providerMetadata: Json | null
          reasoning_text: string | null
          source_document_filename: string | null
          source_document_mediaType: string | null
          source_document_sourceId: string | null
          source_document_title: string | null
          source_url_sourceId: string | null
          source_url_title: string | null
          source_url_url: string | null
          text_text: string | null
          tool_errorText: string | null
          tool_getLocation_input: Json | null
          tool_getLocation_output: Json | null
          tool_getWeatherInformation_input: Json | null
          tool_getWeatherInformation_output: Json | null
          tool_state: string | null
          tool_toolCallId: string | null
          type: string
        }
        Insert: {
          createdAt?: string
          data_weather_id?: string | null
          data_weather_location?: string | null
          data_weather_temperature?: number | null
          data_weather_weather?: string | null
          file_filename?: string | null
          file_mediaType?: string | null
          file_url?: string | null
          id: string
          messageId: string
          order?: number
          providerMetadata?: Json | null
          reasoning_text?: string | null
          source_document_filename?: string | null
          source_document_mediaType?: string | null
          source_document_sourceId?: string | null
          source_document_title?: string | null
          source_url_sourceId?: string | null
          source_url_title?: string | null
          source_url_url?: string | null
          text_text?: string | null
          tool_errorText?: string | null
          tool_getLocation_input?: Json | null
          tool_getLocation_output?: Json | null
          tool_getWeatherInformation_input?: Json | null
          tool_getWeatherInformation_output?: Json | null
          tool_state?: string | null
          tool_toolCallId?: string | null
          type: string
        }
        Update: {
          createdAt?: string
          data_weather_id?: string | null
          data_weather_location?: string | null
          data_weather_temperature?: number | null
          data_weather_weather?: string | null
          file_filename?: string | null
          file_mediaType?: string | null
          file_url?: string | null
          id?: string
          messageId?: string
          order?: number
          providerMetadata?: Json | null
          reasoning_text?: string | null
          source_document_filename?: string | null
          source_document_mediaType?: string | null
          source_document_sourceId?: string | null
          source_document_title?: string | null
          source_url_sourceId?: string | null
          source_url_title?: string | null
          source_url_url?: string | null
          text_text?: string | null
          tool_errorText?: string | null
          tool_getLocation_input?: Json | null
          tool_getLocation_output?: Json | null
          tool_getWeatherInformation_input?: Json | null
          tool_getWeatherInformation_output?: Json | null
          tool_state?: string | null
          tool_toolCallId?: string | null
          type?: string
        }
        Relationships: []
      }
      processing_queue: {
        Row: {
          attempts: number | null
          completed_at: string | null
          config: Json | null
          created_at: string | null
          document_id: string
          error_message: string | null
          id: string
          job_type: string
          max_attempts: number | null
          priority: number | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          config?: Json | null
          created_at?: string | null
          document_id: string
          error_message?: string | null
          id?: string
          job_type: string
          max_attempts?: number | null
          priority?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          config?: Json | null
          created_at?: string | null
          document_id?: string
          error_message?: string | null
          id?: string
          job_type?: string
          max_attempts?: number | null
          priority?: number | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      project_briefings: {
        Row: {
          briefing_content: string
          briefing_type: string | null
          generated_at: string
          generated_by: string | null
          id: string
          project_id: number
          source_documents: string[]
          token_count: number | null
          version: number | null
        }
        Insert: {
          briefing_content: string
          briefing_type?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          project_id: number
          source_documents: string[]
          token_count?: number | null
          version?: number | null
        }
        Update: {
          briefing_content?: string
          briefing_type?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          project_id?: number
          source_documents?: string[]
          token_count?: number | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_briefings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_briefings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard_no_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_briefings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_briefings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "submittal_project_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      project_health: {
        Row: {
          decision_count: number | null
          health_score: number | null
          health_trend: Json | null
          id: string
          last_activity: string | null
          last_updated: string | null
          meeting_count: number | null
          momentum: string | null
          open_action_items: number | null
          project_id: number | null
          risk_level: string | null
          sentiment_trend: Json | null
        }
        Insert: {
          decision_count?: number | null
          health_score?: number | null
          health_trend?: Json | null
          id?: string
          last_activity?: string | null
          last_updated?: string | null
          meeting_count?: number | null
          momentum?: string | null
          open_action_items?: number | null
          project_id?: number | null
          risk_level?: string | null
          sentiment_trend?: Json | null
        }
        Update: {
          decision_count?: number | null
          health_score?: number | null
          health_trend?: Json | null
          id?: string
          last_activity?: string | null
          last_updated?: string | null
          meeting_count?: number | null
          momentum?: string | null
          open_action_items?: number | null
          project_id?: number | null
          risk_level?: string | null
          sentiment_trend?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_health_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project_health_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_health_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "project_health_dashboard_no_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_health_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_health_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "submittal_project_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          access: string
          created_at: string | null
          id: string
          permissions: Json | null
          project_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access: string
          created_at?: string | null
          id?: string
          permissions?: Json | null
          project_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access?: string
          created_at?: string | null
          id?: string
          permissions?: Json | null
          project_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard_no_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "submittal_project_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      project_resources: {
        Row: {
          created_at: string
          description: string | null
          id: number
          project_id: number | null
          title: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          project_id?: number | null
          title?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          project_id?: number | null
          title?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard_no_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "submittal_project_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          due_date: string | null
          id: string
          priority: string | null
          project_id: number | null
          status: string | null
          task_description: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: number | null
          status?: string | null
          task_description: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          project_id?: number | null
          status?: string | null
          task_description?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard_no_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "submittal_project_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      project_users: {
        Row: {
          assigned_at: string | null
          id: string
          permissions: Json | null
          project_id: number
          role: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          id?: string
          permissions?: Json | null
          project_id: number
          role: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          id?: string
          permissions?: Json | null
          project_id?: number
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_users_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_users_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard_no_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_users_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_users_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "submittal_project_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          access: string | null
          address: string | null
          aliases: string[] | null
          archived: boolean
          archived_at: string | null
          archived_by: string | null
          budget: number | null
          budget_used: number | null
          category: string | null
          client: string | null
          client_id: number | null
          completion_percentage: number | null
          created_at: string
          current_phase: string | null
          description: string | null
          "est completion": string | null
          "est profit": number | null
          "est revenue": number | null
          health_score: number | null
          health_status: string | null
          id: number
          "job number": string | null
          keywords: string[] | null
          name: string | null
          onedrive: string | null
          phase: string | null
          stakeholders: string[] | null
          "start date": string | null
          state: string | null
          summary: string | null
          summary_metadata: Json | null
          summary_updated_at: string | null
          team_members: string[] | null
        }
        Insert: {
          access?: string | null
          address?: string | null
          aliases?: string[] | null
          archived?: boolean
          archived_at?: string | null
          archived_by?: string | null
          budget?: number | null
          budget_used?: number | null
          category?: string | null
          client?: string | null
          client_id?: number | null
          completion_percentage?: number | null
          created_at?: string
          current_phase?: string | null
          description?: string | null
          "est completion"?: string | null
          "est profit"?: number | null
          "est revenue"?: number | null
          health_score?: number | null
          health_status?: string | null
          id?: number
          "job number"?: string | null
          keywords?: string[] | null
          name?: string | null
          onedrive?: string | null
          phase?: string | null
          stakeholders?: string[] | null
          "start date"?: string | null
          state?: string | null
          summary?: string | null
          summary_metadata?: Json | null
          summary_updated_at?: string | null
          team_members?: string[] | null
        }
        Update: {
          access?: string | null
          address?: string | null
          aliases?: string[] | null
          archived?: boolean
          archived_at?: string | null
          archived_by?: string | null
          budget?: number | null
          budget_used?: number | null
          category?: string | null
          client?: string | null
          client_id?: number | null
          completion_percentage?: number | null
          created_at?: string
          current_phase?: string | null
          description?: string | null
          "est completion"?: string | null
          "est profit"?: number | null
          "est revenue"?: number | null
          health_score?: number | null
          health_status?: string | null
          id?: number
          "job number"?: string | null
          keywords?: string[] | null
          name?: string | null
          onedrive?: string | null
          phase?: string | null
          stakeholders?: string[] | null
          "start date"?: string | null
          state?: string | null
          summary?: string | null
          summary_metadata?: Json | null
          summary_updated_at?: string | null
          team_members?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      Prospects: {
        Row: {
          contact: number | null
          created_at: string
          id: number
          status: string | null
          title: string | null
        }
        Insert: {
          contact?: number | null
          created_at?: string
          id?: number
          status?: string | null
          title?: string | null
        }
        Update: {
          contact?: number | null
          created_at?: string
          id?: number
          status?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Prospects_contact_fkey"
            columns: ["contact"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          id: string
          timestamp: string | null
          user_id: string
          user_query: string
        }
        Insert: {
          id: string
          timestamp?: string | null
          user_id: string
          user_query: string
        }
        Update: {
          id?: string
          timestamp?: string | null
          user_id?: string
          user_query?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_comments: {
        Row: {
          comment: string
          comment_type: string | null
          created_at: string | null
          created_by: string
          discrepancy_id: string | null
          document_id: string | null
          id: string
          location_in_doc: Json | null
          priority: string | null
          review_id: string
          status: string | null
        }
        Insert: {
          comment: string
          comment_type?: string | null
          created_at?: string | null
          created_by: string
          discrepancy_id?: string | null
          document_id?: string | null
          id?: string
          location_in_doc?: Json | null
          priority?: string | null
          review_id: string
          status?: string | null
        }
        Update: {
          comment?: string
          comment_type?: string | null
          created_at?: string | null
          created_by?: string
          discrepancy_id?: string | null
          document_id?: string | null
          id?: string
          location_in_doc?: Json | null
          priority?: string | null
          review_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_comments_discrepancy_id_fkey"
            columns: ["discrepancy_id"]
            isOneToOne: false
            referencedRelation: "discrepancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "submittal_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_comments_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comments: string | null
          completed_at: string | null
          created_at: string | null
          decision: string | null
          due_date: string | null
          id: string
          review_criteria_met: Json | null
          review_type: string
          reviewer_id: string
          started_at: string | null
          status: string | null
          submittal_id: string
        }
        Insert: {
          comments?: string | null
          completed_at?: string | null
          created_at?: string | null
          decision?: string | null
          due_date?: string | null
          id?: string
          review_criteria_met?: Json | null
          review_type: string
          reviewer_id: string
          started_at?: string | null
          status?: string | null
          submittal_id: string
        }
        Update: {
          comments?: string | null
          completed_at?: string | null
          created_at?: string | null
          decision?: string | null
          due_date?: string | null
          id?: string
          review_criteria_met?: Json | null
          review_type?: string
          reviewer_id?: string
          started_at?: string | null
          status?: string | null
          submittal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "active_submittals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "submittals"
            referencedColumns: ["id"]
          },
        ]
      }
      specifications: {
        Row: {
          ai_summary: string | null
          content: string | null
          created_at: string | null
          division: string | null
          document_url: string | null
          id: string
          keywords: string[] | null
          project_id: number
          requirements: Json | null
          section_number: string
          section_title: string
          specification_type: string | null
          status: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          ai_summary?: string | null
          content?: string | null
          created_at?: string | null
          division?: string | null
          document_url?: string | null
          id?: string
          keywords?: string[] | null
          project_id: number
          requirements?: Json | null
          section_number: string
          section_title: string
          specification_type?: string | null
          status?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          ai_summary?: string | null
          content?: string | null
          created_at?: string | null
          division?: string | null
          document_url?: string | null
          id?: string
          keywords?: string[] | null
          project_id?: number
          requirements?: Json | null
          section_number?: string
          section_title?: string
          specification_type?: string | null
          status?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "specifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard_no_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "submittal_project_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_contacts: {
        Row: {
          contact_type: string | null
          created_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          mobile_phone: string | null
          name: string
          notes: string | null
          phone: string | null
          subcontractor_id: string | null
          title: string | null
        }
        Insert: {
          contact_type?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          mobile_phone?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          subcontractor_id?: string | null
          title?: string | null
        }
        Update: {
          contact_type?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          mobile_phone?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          subcontractor_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_contacts_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_contacts_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_documents: {
        Row: {
          document_name: string
          document_type: string
          expiration_date: string | null
          file_url: string | null
          id: string
          is_current: boolean | null
          subcontractor_id: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          document_name: string
          document_type: string
          expiration_date?: string | null
          file_url?: string | null
          id?: string
          is_current?: boolean | null
          subcontractor_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          document_name?: string
          document_type?: string
          expiration_date?: string | null
          file_url?: string | null
          id?: string
          is_current?: boolean | null
          subcontractor_id?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_documents_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_documents_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_projects: {
        Row: {
          completion_date: string | null
          created_at: string | null
          id: string
          notes: string | null
          on_budget: boolean | null
          on_time: boolean | null
          project_name: string
          project_rating: number | null
          project_value: number | null
          safety_incidents: number | null
          start_date: string | null
          subcontractor_id: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          on_budget?: boolean | null
          on_time?: boolean | null
          project_name: string
          project_rating?: number | null
          project_value?: number | null
          safety_incidents?: number | null
          start_date?: string | null
          subcontractor_id?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          on_budget?: boolean | null
          on_time?: boolean | null
          project_name?: string
          project_rating?: number | null
          project_value?: number | null
          safety_incidents?: number | null
          start_date?: string | null
          subcontractor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_projects_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_projects_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractors: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          alleato_projects_completed: number | null
          annual_revenue_range: string | null
          asrs_experience_years: number | null
          avg_project_rating: number | null
          background_check_policy: boolean | null
          bim_capabilities: boolean | null
          bonding_capacity: number | null
          cad_software_proficiency: string[] | null
          city: string | null
          company_name: string
          company_type: string | null
          concurrent_projects_capacity: number | null
          country: string | null
          created_at: string | null
          created_by: string | null
          credit_rating: string | null
          dba_name: string | null
          digital_collaboration_tools: string[] | null
          drug_testing_program: boolean | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          employee_count: number | null
          fm_global_certified: boolean | null
          hourly_rates_range: string | null
          id: string
          insurance_general_liability: number | null
          insurance_professional_liability: number | null
          insurance_workers_comp: boolean | null
          internal_notes: string | null
          legal_business_name: string | null
          license_expiration_date: string | null
          markup_percentage: number | null
          master_agreement_date: string | null
          master_agreement_signed: boolean | null
          max_project_size: string | null
          nfpa_certifications: string[] | null
          on_time_completion_rate: number | null
          osha_training_current: boolean | null
          postal_code: string | null
          preferred_payment_terms: string | null
          preferred_project_types: string[] | null
          preferred_vendor: boolean | null
          primary_contact_email: string | null
          primary_contact_name: string
          primary_contact_phone: string | null
          primary_contact_title: string | null
          project_management_software: string[] | null
          quality_certifications: string[] | null
          safety_incident_rate: number | null
          secondary_contact_email: string | null
          secondary_contact_name: string | null
          secondary_contact_phone: string | null
          service_areas: string[] | null
          special_requirements: string | null
          specialties: string[] | null
          sprinkler_contractor_license: string | null
          state_province: string | null
          status: string | null
          strengths: string[] | null
          tax_id: string | null
          tier_level: string | null
          travel_radius_miles: number | null
          updated_at: string | null
          updated_by: string | null
          weaknesses: string[] | null
          years_in_business: number | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          alleato_projects_completed?: number | null
          annual_revenue_range?: string | null
          asrs_experience_years?: number | null
          avg_project_rating?: number | null
          background_check_policy?: boolean | null
          bim_capabilities?: boolean | null
          bonding_capacity?: number | null
          cad_software_proficiency?: string[] | null
          city?: string | null
          company_name: string
          company_type?: string | null
          concurrent_projects_capacity?: number | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_rating?: string | null
          dba_name?: string | null
          digital_collaboration_tools?: string[] | null
          drug_testing_program?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_count?: number | null
          fm_global_certified?: boolean | null
          hourly_rates_range?: string | null
          id?: string
          insurance_general_liability?: number | null
          insurance_professional_liability?: number | null
          insurance_workers_comp?: boolean | null
          internal_notes?: string | null
          legal_business_name?: string | null
          license_expiration_date?: string | null
          markup_percentage?: number | null
          master_agreement_date?: string | null
          master_agreement_signed?: boolean | null
          max_project_size?: string | null
          nfpa_certifications?: string[] | null
          on_time_completion_rate?: number | null
          osha_training_current?: boolean | null
          postal_code?: string | null
          preferred_payment_terms?: string | null
          preferred_project_types?: string[] | null
          preferred_vendor?: boolean | null
          primary_contact_email?: string | null
          primary_contact_name: string
          primary_contact_phone?: string | null
          primary_contact_title?: string | null
          project_management_software?: string[] | null
          quality_certifications?: string[] | null
          safety_incident_rate?: number | null
          secondary_contact_email?: string | null
          secondary_contact_name?: string | null
          secondary_contact_phone?: string | null
          service_areas?: string[] | null
          special_requirements?: string | null
          specialties?: string[] | null
          sprinkler_contractor_license?: string | null
          state_province?: string | null
          status?: string | null
          strengths?: string[] | null
          tax_id?: string | null
          tier_level?: string | null
          travel_radius_miles?: number | null
          updated_at?: string | null
          updated_by?: string | null
          weaknesses?: string[] | null
          years_in_business?: number | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          alleato_projects_completed?: number | null
          annual_revenue_range?: string | null
          asrs_experience_years?: number | null
          avg_project_rating?: number | null
          background_check_policy?: boolean | null
          bim_capabilities?: boolean | null
          bonding_capacity?: number | null
          cad_software_proficiency?: string[] | null
          city?: string | null
          company_name?: string
          company_type?: string | null
          concurrent_projects_capacity?: number | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_rating?: string | null
          dba_name?: string | null
          digital_collaboration_tools?: string[] | null
          drug_testing_program?: boolean | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_count?: number | null
          fm_global_certified?: boolean | null
          hourly_rates_range?: string | null
          id?: string
          insurance_general_liability?: number | null
          insurance_professional_liability?: number | null
          insurance_workers_comp?: boolean | null
          internal_notes?: string | null
          legal_business_name?: string | null
          license_expiration_date?: string | null
          markup_percentage?: number | null
          master_agreement_date?: string | null
          master_agreement_signed?: boolean | null
          max_project_size?: string | null
          nfpa_certifications?: string[] | null
          on_time_completion_rate?: number | null
          osha_training_current?: boolean | null
          postal_code?: string | null
          preferred_payment_terms?: string | null
          preferred_project_types?: string[] | null
          preferred_vendor?: boolean | null
          primary_contact_email?: string | null
          primary_contact_name?: string
          primary_contact_phone?: string | null
          primary_contact_title?: string | null
          project_management_software?: string[] | null
          quality_certifications?: string[] | null
          safety_incident_rate?: number | null
          secondary_contact_email?: string | null
          secondary_contact_name?: string | null
          secondary_contact_phone?: string | null
          service_areas?: string[] | null
          special_requirements?: string | null
          specialties?: string[] | null
          sprinkler_contractor_license?: string | null
          state_province?: string | null
          status?: string | null
          strengths?: string[] | null
          tax_id?: string | null
          tier_level?: string | null
          travel_radius_miles?: number | null
          updated_at?: string | null
          updated_by?: string | null
          weaknesses?: string[] | null
          years_in_business?: number | null
        }
        Relationships: []
      }
      submittal_analytics_events: {
        Row: {
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown
          occurred_at: string | null
          project_id: number | null
          session_id: string | null
          submittal_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          occurred_at?: string | null
          project_id?: number | null
          session_id?: string | null
          submittal_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          occurred_at?: string | null
          project_id?: number | null
          session_id?: string | null
          submittal_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submittal_analytics_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_analytics_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard_no_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_analytics_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_analytics_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "submittal_project_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_analytics_events_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "active_submittals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_analytics_events_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "submittals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      submittal_documents: {
        Row: {
          ai_analysis: Json | null
          document_name: string
          document_type: string | null
          extracted_text: string | null
          file_size_bytes: number | null
          file_url: string
          id: string
          mime_type: string | null
          page_count: number | null
          submittal_id: string
          uploaded_at: string | null
          uploaded_by: string
          version: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          document_name: string
          document_type?: string | null
          extracted_text?: string | null
          file_size_bytes?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          page_count?: number | null
          submittal_id: string
          uploaded_at?: string | null
          uploaded_by: string
          version?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          document_name?: string
          document_type?: string | null
          extracted_text?: string | null
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          page_count?: number | null
          submittal_id?: string
          uploaded_at?: string | null
          uploaded_by?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "submittal_documents_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "active_submittals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_documents_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "submittals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      submittal_history: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string | null
          changes: Json | null
          description: string | null
          id: string
          metadata: Json | null
          new_status: string | null
          occurred_at: string | null
          previous_status: string | null
          submittal_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string | null
          changes?: Json | null
          description?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          occurred_at?: string | null
          previous_status?: string | null
          submittal_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string | null
          changes?: Json | null
          description?: string | null
          id?: string
          metadata?: Json | null
          new_status?: string | null
          occurred_at?: string | null
          previous_status?: string | null
          submittal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submittal_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_history_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "active_submittals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_history_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "submittals"
            referencedColumns: ["id"]
          },
        ]
      }
      submittal_notifications: {
        Row: {
          created_at: string | null
          delivery_methods: string[] | null
          id: string
          is_read: boolean | null
          message: string | null
          notification_type: string
          priority: string | null
          project_id: number | null
          scheduled_for: string | null
          sent_at: string | null
          submittal_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_methods?: string[] | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type: string
          priority?: string | null
          project_id?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          submittal_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_methods?: string[] | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type?: string
          priority?: string | null
          project_id?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          submittal_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submittal_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard_no_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "submittal_project_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_notifications_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "active_submittals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_notifications_submittal_id_fkey"
            columns: ["submittal_id"]
            isOneToOne: false
            referencedRelation: "submittals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      submittal_performance_metrics: {
        Row: {
          calculated_at: string | null
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          period_end: string | null
          period_start: string | null
          project_id: number | null
          unit: string | null
          value: number | null
        }
        Insert: {
          calculated_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          period_end?: string | null
          period_start?: string | null
          project_id?: number | null
          unit?: string | null
          value?: number | null
        }
        Update: {
          calculated_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          period_end?: string | null
          period_start?: string | null
          project_id?: number | null
          unit?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "submittal_performance_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_performance_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard_no_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_performance_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittal_performance_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "submittal_project_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      submittal_types: {
        Row: {
          ai_analysis_config: Json | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          required_documents: string[] | null
          review_criteria: Json | null
        }
        Insert: {
          ai_analysis_config?: Json | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          required_documents?: string[] | null
          review_criteria?: Json | null
        }
        Update: {
          ai_analysis_config?: Json | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          required_documents?: string[] | null
          review_criteria?: Json | null
        }
        Relationships: []
      }
      submittals: {
        Row: {
          created_at: string | null
          current_version: number | null
          description: string | null
          id: string
          metadata: Json | null
          priority: string | null
          project_id: number
          required_approval_date: string | null
          specification_id: string | null
          status: string | null
          submission_date: string | null
          submittal_number: string
          submittal_type_id: string
          submitted_by: string
          submitter_company: string | null
          title: string
          total_versions: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_version?: number | null
          description?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          project_id: number
          required_approval_date?: string | null
          specification_id?: string | null
          status?: string | null
          submission_date?: string | null
          submittal_number: string
          submittal_type_id: string
          submitted_by: string
          submitter_company?: string | null
          title: string
          total_versions?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_version?: number | null
          description?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          project_id?: number
          required_approval_date?: string | null
          specification_id?: string | null
          status?: string | null
          submission_date?: string | null
          submittal_number?: string
          submittal_type_id?: string
          submitted_by?: string
          submitter_company?: string | null
          title?: string
          total_versions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard_no_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "submittal_project_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_specification_id_fkey"
            columns: ["specification_id"]
            isOneToOne: false
            referencedRelation: "specifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_submittal_type_id_fkey"
            columns: ["submittal_type_id"]
            isOneToOne: false
            referencedRelation: "submittal_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_status: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          last_successful_sync_at: string | null
          last_sync_at: string | null
          metadata: Json | null
          status: string | null
          sync_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_successful_sync_at?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          status?: string | null
          sync_type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_successful_sync_at?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          status?: string | null
          sync_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_admin: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      user_projects: {
        Row: {
          company_name: string | null
          contact_phone: string | null
          created_at: string | null
          estimated_value: number | null
          id: string
          lead_score: number | null
          project_data: Json
          project_name: string | null
          status: string | null
          updated_at: string | null
          user_email: string | null
        }
        Insert: {
          company_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          estimated_value?: number | null
          id?: string
          lead_score?: number | null
          project_data: Json
          project_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Update: {
          company_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          estimated_value?: number | null
          id?: string
          lead_score?: number | null
          project_data?: Json
          project_name?: string | null
          status?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      actionable_insights: {
        Row: {
          assignee: string | null
          business_impact: string | null
          confidence_score: number | null
          created_at: string | null
          critical_path_impact: boolean | null
          cross_project_impact: number[] | null
          dependencies: string[] | null
          description: string | null
          doc_title: string | null
          document_id: string | null
          document_title: string | null
          document_type: string | null
          due_date: string | null
          exact_quotes: string[] | null
          financial_impact: number | null
          generated_by: string | null
          id: string | null
          insight_type: string | null
          meeting_date: string | null
          metadata: Json | null
          numerical_data: Json | null
          project_id: number | null
          project_name: string | null
          resolved: boolean | null
          severity: string | null
          source_meetings: string[] | null
          stakeholders_affected: string[] | null
          title: string | null
          urgency_indicators: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "document_insights_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      active_submittals: {
        Row: {
          created_at: string | null
          critical_discrepancies: number | null
          current_version: number | null
          description: string | null
          discrepancy_count: number | null
          id: string | null
          metadata: Json | null
          priority: string | null
          project_id: number | null
          project_name: string | null
          required_approval_date: string | null
          specification_id: string | null
          status: string | null
          submission_date: string | null
          submittal_number: string | null
          submittal_type_id: string | null
          submittal_type_name: string | null
          submitted_by: string | null
          submitted_by_email: string | null
          submitter_company: string | null
          title: string | null
          total_versions: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard_no_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "submittal_project_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_specification_id_fkey"
            columns: ["specification_id"]
            isOneToOne: false
            referencedRelation: "specifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_submittal_type_id_fkey"
            columns: ["submittal_type_id"]
            isOneToOne: false
            referencedRelation: "submittal_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submittals_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights_today: {
        Row: {
          assigned_to: string | null
          assignee: string | null
          business_impact: string | null
          confidence_score: number | null
          created_at: string | null
          cross_project_impact: number[] | null
          dependencies: Json | null
          description: string | null
          document_id: string | null
          due_date: string | null
          exact_quotes: Json | null
          financial_impact: number | null
          id: number | null
          insight_type: string | null
          meeting_id: string | null
          meeting_name: string | null
          metadata: Json | null
          numerical_data: Json | null
          project_id: number | null
          project_name: string | null
          resolved: number | null
          resolved_at: string | null
          severity: string | null
          source_meetings: string | null
          stakeholders_affected: string[] | null
          status: string | null
          timeline_impact_days: number | null
          title: string | null
          urgency_indicators: string[] | null
        }
        Insert: {
          assigned_to?: string | null
          assignee?: string | null
          business_impact?: string | null
          confidence_score?: number | null
          created_at?: string | null
          cross_project_impact?: number[] | null
          dependencies?: Json | null
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          exact_quotes?: Json | null
          financial_impact?: number | null
          id?: number | null
          insight_type?: string | null
          meeting_id?: string | null
          meeting_name?: string | null
          metadata?: Json | null
          numerical_data?: Json | null
          project_id?: number | null
          project_name?: string | null
          resolved?: number | null
          resolved_at?: string | null
          severity?: string | null
          source_meetings?: string | null
          stakeholders_affected?: string[] | null
          status?: string | null
          timeline_impact_days?: number | null
          title?: string | null
          urgency_indicators?: string[] | null
        }
        Update: {
          assigned_to?: string | null
          assignee?: string | null
          business_impact?: string | null
          confidence_score?: number | null
          created_at?: string | null
          cross_project_impact?: number[] | null
          dependencies?: Json | null
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          exact_quotes?: Json | null
          financial_impact?: number | null
          id?: number | null
          insight_type?: string | null
          meeting_id?: string | null
          meeting_name?: string | null
          metadata?: Json | null
          numerical_data?: Json | null
          project_id?: number | null
          project_name?: string | null
          resolved?: number | null
          resolved_at?: string | null
          severity?: string | null
          source_meetings?: string | null
          stakeholders_affected?: string[] | null
          status?: string | null
          timeline_impact_days?: number | null
          title?: string | null
          urgency_indicators?: string[] | null
        }
        Relationships: []
      }
      ai_insights_with_project: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          description: string | null
          id: number | null
          insight_type: string | null
          meeting_id: string | null
          project_id: number | null
          project_name: string | null
          resolved: number | null
          severity: string | null
          source_meetings: string | null
          title: string | null
        }
        Relationships: []
      }
      document_metadata_view_no_summary: {
        Row: {
          date: string | null
          fireflies_id: string | null
          fireflies_link: string | null
          project: string | null
          project_id: number | null
          title: string | null
        }
        Insert: {
          date?: string | null
          fireflies_id?: string | null
          fireflies_link?: string | null
          project?: string | null
          project_id?: number | null
          title?: string | null
        }
        Update: {
          date?: string | null
          fireflies_id?: string | null
          fireflies_link?: string | null
          project?: string | null
          project_id?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_metadata_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_metadata_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard_no_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_metadata_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_metadata_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "submittal_project_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_ordered_view: {
        Row: {
          created_at: string | null
          date: string | null
          fireflies_id: string | null
          id: string | null
          project: string | null
          project_id: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          fireflies_id?: string | null
          id?: string | null
          project?: string | null
          project_id?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          fireflies_id?: string | null
          id?: string | null
          project?: string | null
          project_id?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_health_dashboard_no_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "submittal_project_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      figure_statistics: {
        Row: {
          metric: string | null
          value: string | null
        }
        Relationships: []
      }
      figure_summary: {
        Row: {
          asrs_type: string | null
          container_type: string | null
          figure_number: number | null
          figure_type: string | null
          keyword_count: number | null
          keywords: string | null
          max_depth: string | null
          max_spacing: string | null
          normalized_summary: string | null
          page_number: number | null
          related_tables: number[] | null
          title: string | null
        }
        Insert: {
          asrs_type?: string | null
          container_type?: string | null
          figure_number?: number | null
          figure_type?: string | null
          keyword_count?: never
          keywords?: never
          max_depth?: never
          max_spacing?: never
          normalized_summary?: string | null
          page_number?: number | null
          related_tables?: number[] | null
          title?: string | null
        }
        Update: {
          asrs_type?: string | null
          container_type?: string | null
          figure_number?: number | null
          figure_type?: string | null
          keyword_count?: never
          keywords?: never
          max_depth?: never
          max_spacing?: never
          normalized_summary?: string | null
          page_number?: number | null
          related_tables?: number[] | null
          title?: string | null
        }
        Relationships: []
      }
      initiatives_with_insights: {
        Row: {
          action_items: number | null
          actual_completion: string | null
          aliases: string[] | null
          budget: number | null
          budget_used: number | null
          category: string | null
          completion_percentage: number | null
          created_at: string | null
          decisions: number | null
          description: string | null
          documentation_links: string[] | null
          id: number | null
          insight_count: number | null
          keywords: string[] | null
          latest_insight_date: string | null
          name: string | null
          notes: string | null
          opportunities: number | null
          owner: string | null
          priority: string | null
          related_project_ids: number[] | null
          risks: number | null
          stakeholders: string[] | null
          start_date: string | null
          status: string | null
          target_completion: string | null
          team_members: string[] | null
          updated_at: string | null
        }
        Relationships: []
      }
      project_health_dashboard: {
        Row: {
          budget_utilization: number | null
          completion_percentage: number | null
          current_phase: string | null
          "est completion": string | null
          health_score: number | null
          health_status: string | null
          id: number | null
          last_document_date: string | null
          name: string | null
          open_critical_items: number | null
          recent_documents_count: number | null
          summary: string | null
          summary_updated_at: string | null
          total_insights_count: number | null
        }
        Insert: {
          budget_utilization?: never
          completion_percentage?: number | null
          current_phase?: string | null
          "est completion"?: string | null
          health_score?: number | null
          health_status?: string | null
          id?: number | null
          last_document_date?: never
          name?: string | null
          open_critical_items?: never
          recent_documents_count?: never
          summary?: string | null
          summary_updated_at?: string | null
          total_insights_count?: never
        }
        Update: {
          budget_utilization?: never
          completion_percentage?: number | null
          current_phase?: string | null
          "est completion"?: string | null
          health_score?: number | null
          health_status?: string | null
          id?: number | null
          last_document_date?: never
          name?: string | null
          open_critical_items?: never
          recent_documents_count?: never
          summary?: string | null
          summary_updated_at?: string | null
          total_insights_count?: never
        }
        Relationships: []
      }
      project_health_dashboard_no_summary: {
        Row: {
          budget_utilization: number | null
          completion_percentage: number | null
          current_phase: string | null
          "est completion": string | null
          health_score: number | null
          health_status: string | null
          id: number | null
          last_document_date: string | null
          name: string | null
          open_critical_items: number | null
          recent_documents_count: number | null
          summary_updated_at: string | null
          total_insights_count: number | null
        }
        Insert: {
          budget_utilization?: never
          completion_percentage?: number | null
          current_phase?: string | null
          "est completion"?: string | null
          health_score?: number | null
          health_status?: string | null
          id?: number | null
          last_document_date?: never
          name?: string | null
          open_critical_items?: never
          recent_documents_count?: never
          summary_updated_at?: string | null
          total_insights_count?: never
        }
        Update: {
          budget_utilization?: never
          completion_percentage?: number | null
          current_phase?: string | null
          "est completion"?: string | null
          health_score?: number | null
          health_status?: string | null
          id?: number | null
          last_document_date?: never
          name?: string | null
          open_critical_items?: never
          recent_documents_count?: never
          summary_updated_at?: string | null
          total_insights_count?: never
        }
        Relationships: []
      }
      subcontractors_summary: {
        Row: {
          asrs_experience_years: number | null
          avg_rating: number | null
          company_name: string | null
          fm_global_certified: boolean | null
          id: string | null
          on_time_percentage: number | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          service_areas: string[] | null
          specialties: string[] | null
          status: string | null
          tier_level: string | null
          total_projects: number | null
        }
        Relationships: []
      }
      submittal_project_dashboard: {
        Row: {
          approved_submittals: number | null
          avg_review_time_days: number | null
          critical_discrepancies: number | null
          id: number | null
          name: string | null
          needs_revision: number | null
          pending_submittals: number | null
          status: string | null
          total_discrepancies: number | null
          total_submittals: number | null
          under_review: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_task: {
        Args: { archived_by_param?: string; task_id_param: string }
        Returns: boolean
      }
      auto_archive_old_chats: { Args: never; Returns: number }
      backfill_meeting_participants_to_contacts: {
        Args: never
        Returns: {
          total_contacts_added: number
          unique_emails: string[]
        }[]
      }
      batch_update_project_assignments: {
        Args: { p_assignments: Json }
        Returns: {
          document_id: string
          error_message: string
          success: boolean
        }[]
      }
      convert_embeddings_to_vector: { Args: never; Returns: undefined }
      create_conversation_with_message: {
        Args: {
          p_agent_type: string
          p_content: string
          p_metadata?: Json
          p_role: string
          p_title: string
        }
        Returns: string
      }
      email_to_names: {
        Args: { email: string }
        Returns: {
          first_name: string
          last_name: string
        }[]
      }
      enhanced_match_chunks: {
        Args: {
          date_after?: string
          doc_type_filter?: string
          match_count?: number
          project_filter?: number
          query_embedding: string
        }
        Returns: {
          chunk_id: string
          content: string
          created_at: string
          document_id: string
          document_source: string
          document_title: string
          metadata: Json
          similarity: number
        }[]
      }
      execute_custom_sql: { Args: { sql_query: string }; Returns: Json }
      extract_names: {
        Args: { participant: string }
        Returns: {
          first_name: string
          last_name: string
        }[]
      }
      find_duplicate_insights: {
        Args: { p_similarity_threshold?: number }
        Returns: {
          insight1_id: number
          insight2_id: number
          same_document: boolean
          same_project: boolean
          similarity_score: number
          title1: string
          title2: string
        }[]
      }
      find_sprinkler_requirements:
        | {
            Args: {
              p_asrs_type?: string
              p_ceiling_height_ft?: number
              p_commodity_class?: string
              p_system_type?: string
              p_tolerance_ft?: number
            }
            Returns: {
              height_match_type: string
              k_factor: number
              pressure_psi: number
              special_conditions: string[]
              sprinkler_count: number
              table_id: string
              table_number: number
              title: string
            }[]
          }
        | {
            Args: {
              p_asrs_type?: string
              p_ceiling_height_ft?: number
              p_commodity_class?: string
              p_k_factor?: number
              p_system_type?: string
            }
            Returns: {
              ceiling_height_ft: number
              k_factor: number
              k_type: string
              pressure_bar: number
              pressure_psi: number
              special_conditions: string[]
              sprinkler_count: number
              sprinkler_orientation: string
              sprinkler_response: string
              table_id: string
              table_number: number
              title: string
            }[]
          }
      full_text_search_meetings: {
        Args: { match_count?: number; search_query: string }
        Returns: {
          category: string
          content: string
          date: string
          id: string
          participants: string
          rank: number
          title: string
        }[]
      }
      generate_optimization_recommendations: {
        Args: { project_data: Json }
        Returns: {
          implementation_effort: string
          priority: string
          recommendation: string
          savings_potential: number
          technical_details: Json
        }[]
      }
      generate_optimizations: {
        Args: { p_user_input: Json }
        Returns: {
          description: string
          estimated_savings: number
          implementation_effort: string
          optimization_type: string
          title: string
        }[]
      }
      get_all_project_documents: {
        Args: { in_project_id: number }
        Returns: {
          content: string
          date: string
          duration_minutes: number
          id: string
          participants: string
          project_id: number
          summary: string
          title: string
          url: string
        }[]
      }
      get_asrs_figure_options: {
        Args: never
        Returns: {
          asrs_types: string[]
          container_types: string[]
          orientation_types: string[]
          rack_depths: string[]
          spacings: string[]
        }[]
      }
      get_conversation_with_history: {
        Args: { p_conversation_id: string }
        Returns: {
          agent_type: string
          content: string
          conversation_created_at: string
          conversation_id: string
          message_created_at: string
          message_id: string
          message_metadata: Json
          role: string
          title: string
        }[]
      }
      get_document_chunks: {
        Args: { doc_id: string }
        Returns: {
          chunk_id: string
          chunk_index: number
          content: string
          metadata: Json
        }[]
      }
      get_document_insights_page: {
        Args: {
          in_cursor_created_at: string
          in_cursor_id: string
          in_page_size: number
          in_search: string
          in_sort_by: string
          in_sort_dir: string
        }
        Returns: {
          confidence_score: number
          document_date: string
          document_id: string
          document_summary: string
          document_title: string
          document_url: string
          insight_created_at: string
          insight_description: string
          insight_id: string
          insight_title: string
          insight_type: string
          project_id: string
          project_name: string
          total_count: number
        }[]
      }
      get_figures_by_config: {
        Args: {
          p_asrs_type: string
          p_container_type: string
          p_orientation_type?: string
        }
        Returns: {
          figure_number: string
          max_horizontal_spacing: string
          name: string
          order_number: number
          rack_row_depth: string
        }[]
      }
      get_fm_global_references_by_topic: {
        Args: { limit_count?: number; topic: string }
        Returns: {
          asrs_relevance: string
          reference_number: string
          reference_type: string
          section: string
          title: string
        }[]
      }
      get_insights_processing_stats: {
        Args: { p_days_back?: number }
        Returns: {
          avg_insights_per_document: number
          processed_documents: number
          processing_rate: number
          recent_activity: Json
          top_categories: Json
          total_documents: number
          total_insights: number
        }[]
      }
      get_meeting_analytics: {
        Args: never
        Returns: {
          avg_duration_minutes: number
          meetings_by_category: Json
          recent_meetings_count: number
          top_participants: Json
          total_meetings: number
        }[]
      }
      get_meeting_frequency_stats: {
        Args: { p_days_back?: number }
        Returns: {
          meeting_count: number
          period_date: string
          total_duration_minutes: number
          unique_participants: number
        }[]
      }
      get_meeting_statistics: {
        Args: never
        Returns: {
          avg_duration_minutes: number
          meetings_this_week: number
          open_risks: number
          pending_actions: number
          total_meetings: number
          total_participants: number
        }[]
      }
      get_page_parents: {
        Args: { page_id: number }
        Returns: {
          id: number
          meta: Json
          parent_page_id: number
          path: string
        }[]
      }
      get_pending_documents: {
        Args: {
          p_category?: string
          p_date_from?: string
          p_date_to?: string
          p_exclude_processed?: boolean
          p_limit?: number
          p_project_id?: number
        }
        Returns: {
          action_items: string
          bullet_points: string
          category: string
          content: string
          content_length: number
          date: string
          duration_minutes: number
          entities: Json
          has_existing_insights: boolean
          id: string
          outline: string
          participants: string
          project: string
          project_id: number
          title: string
        }[]
      }
      get_priority_insights: {
        Args: { p_limit?: number; p_project_id?: number }
        Returns: {
          assignee: string
          confidence_score: number
          days_until_due: number
          description: string
          document_id: string
          due_date: string
          id: string
          insight_type: string
          project_id: number
          severity: string
          title: string
        }[]
      }
      get_project_documents_page: {
        Args: {
          in_cursor_date: string
          in_cursor_id: string
          in_page_size: number
          in_project_id: number
          in_search: string
          in_sort_by: string
          in_sort_dir: string
        }
        Returns: {
          content: string
          date: string
          duration_minutes: number
          id: string
          next_cursor_date: string
          next_cursor_id: string
          participants: string
          project_id: number
          summary: string
          title: string
          total_count: number
          url: string
        }[]
      }
      get_project_matching_context: {
        Args: never
        Returns: {
          active_keywords: string[]
          aliases: string[]
          category: string
          description: string
          id: number
          keywords: string[]
          name: string
          phase: string
          stakeholders: string[]
          team_members: string[]
        }[]
      }
      get_projects_needing_summary_update: {
        Args: { hours_threshold?: number }
        Returns: {
          hours_since_update: number
          last_update: string
          project_id: number
          project_name: string
        }[]
      }
      get_recent_project_insights: {
        Args: { p_days_back?: number; p_limit?: number; p_project_id: string }
        Returns: {
          assigned_to: string
          content: string
          created_at: string
          due_date: string
          insight_id: string
          insight_type: string
          meeting_date: string
          meeting_id: string
          meeting_title: string
          priority: string
          status: string
        }[]
      }
      get_related_content: {
        Args: { chunk_id: string; max_results?: number }
        Returns: {
          content_type: string
          page_number: number
          relevance_score: number
          summary: string
          title: string
        }[]
      }
      get_user_chat_stats: {
        Args: { p_user_id: string }
        Returns: {
          active_chats: number
          archived_chats: number
          starred_chats: number
          total_chats: number
          total_messages: number
          total_tokens_used: number
        }[]
      }
      hybrid_search: {
        Args: {
          match_count?: number
          query_embedding: string
          query_text: string
          text_weight?: number
        }
        Returns: {
          chunk_id: string
          combined_score: number
          content: string
          document_id: string
          document_source: string
          document_title: string
          metadata: Json
          text_similarity: number
          vector_similarity: number
        }[]
      }
      hybrid_search_fm_global: {
        Args: {
          filter_asrs_type?: string
          match_count?: number
          query_embedding: string
          query_text: string
          text_weight?: number
        }
        Returns: {
          asrs_topic: string
          combined_score: number
          content: string
          design_parameter: string
          figure_number: string
          metadata: Json
          reference_title: string
          regulation_section: string
          source_id: string
          source_type: string
          table_number: string
          text_similarity: number
          vector_id: string
          vector_similarity: number
        }[]
      }
      increment_session_tokens: {
        Args: { session_id: string; tokens_to_add: number }
        Returns: undefined
      }
      interpolate_sprinkler_requirements: {
        Args: { p_table_id: string; p_target_height_ft: number }
        Returns: {
          interpolated_count: number
          interpolated_height_ft: number
          interpolated_pressure: number
          k_factor: number
          k_type: string
          lower_height_ft: number
          note: string
          table_id: string
          upper_height_ft: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      mark_document_processed: {
        Args: {
          p_document_id: string
          p_insights_count?: number
          p_projects_assigned?: number
        }
        Returns: boolean
      }
      match_archon_code_examples: {
        Args: {
          filter?: Json
          match_count?: number
          query_embedding: string
          source_filter?: string
        }
        Returns: {
          chunk_number: number
          content: string
          id: number
          metadata: Json
          similarity: number
          source_id: string
          summary: string
          url: string
        }[]
      }
      match_archon_crawled_pages: {
        Args: {
          filter?: Json
          match_count?: number
          query_embedding: string
          source_filter?: string
        }
        Returns: {
          chunk_number: number
          content: string
          id: number
          metadata: Json
          similarity: number
          source_id: string
          url: string
        }[]
      }
      match_chunks: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          chunk_id: string
          content: string
          document_id: string
          document_source: string
          document_title: string
          metadata: Json
          similarity: number
        }[]
      }
      match_document_chunks: {
        Args: {
          filter_document_ids?: string[]
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          content: string
          document_id: string
          id: string
          similarity: number
        }[]
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_documents_enhanced: {
        Args: {
          category_filter?: string
          date_after_filter?: string
          match_count?: number
          participants_filter?: string
          project_filter?: string
          query_embedding: string
          year_filter?: number
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      match_files: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_fm_documents: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
          title: string
        }[]
      }
      match_fm_global_vectors: {
        Args: {
          filter_asrs_type?: string
          filter_source_type?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          asrs_topic: string
          content: string
          design_parameter: string
          figure_number: string
          metadata: Json
          reference_title: string
          regulation_section: string
          similarity: number
          source_id: string
          source_type: string
          table_number: string
          vector_id: string
        }[]
      }
      match_fm_tables:
        | {
            Args: {
              match_count?: number
              match_threshold?: number
              query_embedding: string
            }
            Returns: {
              content_text: string
              content_type: string
              metadata: Json
              similarity: number
              table_id: string
            }[]
          }
        | {
            Args: {
              match_count?: number
              match_threshold?: number
              query_embedding: string
            }
            Returns: {
              asrs_type: string
              metadata: Json
              similarity: number
              system_type: string
              table_id: string
              title: string
            }[]
          }
      match_meeting_chunks: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_meeting_id?: string
          p_project_id?: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          content: string
          end_timestamp: number
          id: string
          meeting_id: string
          project_id: number
          similarity: number
          speaker_info: Json
          start_timestamp: number
        }[]
      }
      match_meeting_chunks_with_project: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_project_id?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          meeting_id: string
          project_id: number
          similarity: number
          speaker_info: Json
          start_timestamp: number
        }[]
      }
      match_memories: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_page_sections: {
        Args: {
          embedding: string
          match_count: number
          match_threshold: number
          min_content_length: number
        }
        Returns: {
          content: string
          heading: string
          id: number
          page_id: number
          similarity: number
          slug: string
        }[]
      }
      match_recent_documents: {
        Args: {
          days_back?: number
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content: string
          document_date: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      normalize_exact_quotes: { Args: { in_json: Json }; Returns: string }
      refresh_search_vectors: { Args: never; Returns: undefined }
      search_asrs_figures: {
        Args: {
          p_asrs_type?: string
          p_container_type?: string
          p_orientation_type?: string
          p_rack_depth?: string
          p_search_text?: string
          p_spacing?: string
        }
        Returns: {
          asrs_type: string
          container_type: string
          figure_number: string
          id: string
          max_horizontal_spacing: string
          name: string
          order_number: number
          orientation_type: string
          rack_row_depth: string
          relevance_score: number
        }[]
      }
      search_by_category: {
        Args: {
          category: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          meeting_category: string
          metadata: Json
          similarity: number
        }[]
      }
      search_by_participants: {
        Args: {
          match_count?: number
          participant_name: string
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          participants: string
          similarity: number
        }[]
      }
      search_documentation: {
        Args: {
          limit_count?: number
          query_text: string
          section_filter?: string
        }
        Returns: {
          block_content: string
          page_reference: number
          rank: number
          section_id: string
          section_slug: string
          section_title: string
        }[]
      }
      search_fm_global_all: {
        Args: {
          match_count?: number
          query_embedding: string
          query_text: string
        }
        Returns: {
          content: string
          metadata: Json
          similarity: number
          source_id: string
          source_table: string
          source_type: string
          title: string
        }[]
      }
      search_meeting_chunks:
        | {
            Args: {
              chunk_types?: string[]
              date_from?: string
              date_to?: string
              match_count?: number
              match_threshold?: number
              project_filter?: number
              query_embedding: string
            }
            Returns: {
              chunk_id: string
              chunk_index: number
              chunk_text: string
              chunk_type: string
              meeting_date: string
              meeting_id: string
              meeting_title: string
              metadata: Json
              project_id: number
              rank_score: number
              similarity: number
              speakers: Json
            }[]
          }
        | {
            Args: {
              match_count?: number
              match_threshold?: number
              project_filter?: string
              query_embedding: string
            }
            Returns: {
              chunk_end_time: number
              chunk_index: number
              chunk_start_time: number
              chunk_text: string
              id: string
              meeting_date: string
              meeting_id: string
              meeting_title: string
              project_id: string
              project_title: string
              similarity: number
              speaker_info: Json
            }[]
          }
      search_meeting_chunks_semantic: {
        Args: {
          filter_meeting_id?: string
          filter_project_id?: number
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_content: string
          chunk_id: string
          chunk_index: number
          meeting_date: string
          meeting_id: string
          meeting_title: string
          project_id: number
          similarity: number
          speaker_info: Json
        }[]
      }
      search_meeting_embeddings: {
        Args: {
          match_count?: number
          match_threshold?: number
          project_filter?: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          meeting_id: string
          metadata: Json
          similarity: number
        }[]
      }
      search_text_chunks: {
        Args: {
          compliance_filter?: string
          cost_impact_filter?: string
          embedding_vector?: string
          match_threshold?: number
          max_results?: number
          page_filter?: number
          search_query: string
        }
        Returns: {
          chunk_summary: string
          clause_id: string
          cost_impact: string
          id: string
          page_number: number
          raw_text: string
          savings_opportunities: string[]
          similarity: number
          topics: string[]
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      suggest_project_assignments: {
        Args: {
          p_document_content: string
          p_document_title?: string
          p_participants?: string
          p_top_matches?: number
        }
        Returns: {
          match_reasons: string[]
          match_score: number
          project_id: number
          project_name: string
        }[]
      }
      text_search_chunks: {
        Args: { match_count?: number; search_query: string }
        Returns: {
          chunk_id: string
          chunk_summary: string
          content: string
          doc_id: string
          page_number: number
          related_figures: string[]
          related_tables: string[]
          section_path: string[]
        }[]
      }
      update_document_project_assignment: {
        Args: {
          p_confidence?: number
          p_document_id: string
          p_project_id: number
          p_reasoning?: string
        }
        Returns: boolean
      }
      validate_project_assignment: {
        Args: { p_document_id: string; p_project_id: number }
        Returns: {
          confidence: number
          is_valid: boolean
          validation_notes: string[]
        }[]
      }
      vector_search: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          meeting_id: string
          similarity: number
        }[]
      }
    }
    Enums: {
      task_status: "todo" | "doing" | "review" | "done"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      task_status: ["todo", "doing", "review", "done"],
    },
  },
} as const
