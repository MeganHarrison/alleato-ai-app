import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Project, ProjectFormData, ProjectSummary } from '@/types/project.types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProjects = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (error) {
        // Check if it's a table not found error
        if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          console.log('Projects table not found. Please run the SQL migration scripts.');
          setProjects([]);
          setError('Projects table not configured');
          return;
        }
        throw error;
      }
      setProjects(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch projects:', err.message);
      // Only show toast for non-table-missing errors
      if (!err.message?.includes('does not exist')) {
        toast({
          title: "Error",
          description: "Failed to fetch projects",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  return { projects, loading, error, refetch: fetchProjects };
};

export const useProject = (projectId: string | undefined) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProject = async () => {
      if (!user || !projectId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) throw error;
        setProject(data);
      } catch (err: any) {
        setError(err.message);
        toast({
          title: "Error",
          description: "Failed to fetch project details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, user]);

  return { project, loading, error };
};

export const useCreateProject = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createProject = async (formData: Partial<ProjectFormData>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a project",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);
      
      // Get user profile to get the owner name
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const projectData = {
        ...formData,
        owner_id: user.id,
        owner_name: profile?.full_name || user.email?.split('@')[0] || 'Unknown User',
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      return data;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create project",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createProject, loading };
};

export const useUpdateProject = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update a project",
        variant: "destructive",
      });
      return null;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          last_modified_by: user.id,
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Project updated successfully",
      });

      return data;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update project",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateProject, loading };
};

export const useDeleteProject = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const deleteProject = async (projectId: string, permanent: boolean = false) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete a project",
        variant: "destructive",
      });
      return false;
    }

    try {
      setLoading(true);
      
      if (permanent) {
        // Permanent delete
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId);

        if (error) throw error;
      } else {
        // Soft delete (archive)
        const { error } = await supabase
          .from('projects')
          .update({
            is_archived: true,
            archived_at: new Date().toISOString(),
            archived_by: user.id,
          })
          .eq('id', projectId);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: permanent ? "Project deleted permanently" : "Project archived successfully",
      });

      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete project",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteProject, loading };
};

export const useProjectSummary = () => {
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
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
          .rpc('get_user_projects_summary', { user_id_param: user.id });

        if (error) throw error;
        setSummary(data?.[0] || null);
      } catch (err) {
        console.error('Failed to fetch project summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [user]);

  return { summary, loading };
};

export const useSearchProjects = () => {
  const [results, setResults] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchProjects = async (params: {
    search_query?: string;
    status_filters?: string[];
    priority_filters?: string[];
    technology_filter?: string;
    include_archived?: boolean;
  }) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('search_projects', params);

      if (error) throw error;
      setResults(data || []);
      return data || [];
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to search projects",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { searchProjects, results, loading };
};