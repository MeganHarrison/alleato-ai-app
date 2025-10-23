export type ProjectStatus = 'active' | 'inactive' | 'completed' | 'on_hold' | 'planning';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  owner_id: string;
  owner_name: string;
  team_members: string[] | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  spent: number | null;
  technologies: string[] | null;
  tags: string[] | null;
  goals: string[] | null;
  deliverables: string[] | null;
  risks: string[] | null;
  dependencies: string[] | null;
  repository_url: string | null;
  documentation_url: string | null;
  demo_url: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  last_modified_by: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
}

export interface ProjectFormData {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  team_members: string[];
  start_date: string;
  end_date: string;
  budget: number;
  technologies: string[];
  tags: string[];
  goals: string[];
  repository_url: string;
  documentation_url: string;
  demo_url: string;
}

export interface ProjectSummary {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  projects_by_status: Record<ProjectStatus, number>;
  projects_by_priority: Record<ProjectPriority, number>;
  overdue_projects: number;
  upcoming_deadlines: number;
}