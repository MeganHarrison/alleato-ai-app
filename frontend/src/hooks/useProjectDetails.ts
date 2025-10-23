import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DocumentMetadata, ProjectInsight } from '@/types/database.types';
import { toast } from '@/hooks/use-toast';

export interface ProjectDetails {
  projectName: string;
  client?: string;
  startDate?: string;
  estimatedCompletion?: string;
  revenue?: number;
  profit?: number;
  location?: string;
  notes?: string;
  meetings: DocumentMetadata[];
  insights: ProjectInsight[];
}

export const useProjectDetails = (projectId: string) => {
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Decode the projectId (it may be URL encoded)
        const projectName = decodeURIComponent(projectId);

        // Fetch meetings (documents with type='meeting' for this project)
        const { data: meetings, error: meetingsError } = await supabase
          .from('document_metadata')
          .select('*')
          .eq('project_name', projectName)
          .order('created_at', { ascending: false });

        if (meetingsError) {
          throw meetingsError;
        }

        // Fetch insights for this project
        const { data: insights, error: insightsError } = await supabase
          .from('project_insights')
          .select('*')
          .eq('project_name', projectName)
          .order('created_at', { ascending: false });

        if (insightsError) {
          throw insightsError;
        }

        // Extract project details from the first meeting or insight metadata
        // In a real app, you might have a separate projects table
        let projectInfo: Partial<ProjectDetails> = {
          projectName,
          meetings: meetings || [],
          insights: insights || []
        };

        // Try to extract additional project info from metadata
        if (meetings && meetings.length > 0) {
          const firstMeeting = meetings[0];
          // If there's additional project info in the schema or metadata
          if (firstMeeting.schema) {
            try {
              const schemaData = JSON.parse(firstMeeting.schema);
              projectInfo = {
                ...projectInfo,
                client: schemaData.client,
                startDate: schemaData.startDate,
                estimatedCompletion: schemaData.estimatedCompletion,
                revenue: schemaData.revenue,
                profit: schemaData.profit,
                location: schemaData.location,
                notes: schemaData.notes,
              };
            } catch (e) {
              // Schema might not be JSON or might not have these fields
              console.log('Could not parse schema data');
            }
          }
        }

        // If we have insights, check their metadata for project info
        if ((!projectInfo.client || !projectInfo.startDate) && insights && insights.length > 0) {
          for (const insight of insights) {
            if (insight.metadata) {
              projectInfo = {
                ...projectInfo,
                client: projectInfo.client || insight.metadata.client,
                startDate: projectInfo.startDate || insight.metadata.startDate,
                estimatedCompletion: projectInfo.estimatedCompletion || insight.metadata.estimatedCompletion,
                revenue: projectInfo.revenue || insight.metadata.revenue,
                profit: projectInfo.profit || insight.metadata.profit,
                location: projectInfo.location || insight.metadata.location,
                notes: projectInfo.notes || insight.metadata.notes,
              };
              if (projectInfo.client && projectInfo.startDate) break;
            }
          }
        }

        setProjectDetails(projectInfo as ProjectDetails);
      } catch (error) {
        console.error('Error fetching project details:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch project details');
        toast({
          title: 'Error',
          description: 'Failed to fetch project details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  const updateProjectDetails = async (updates: Partial<ProjectDetails>) => {
    // In a real app, you would update a projects table
    // For now, we can store this in the metadata of insights or documents
    toast({
      title: 'Info',
      description: 'Project details update functionality would be implemented with a dedicated projects table',
    });
  };

  return {
    projectDetails,
    loading,
    error,
    updateProjectDetails,
    refetch: () => {
      if (projectId) {
        setLoading(true);
        // Re-trigger the effect
        const fetchData = async () => {
          const projectName = decodeURIComponent(projectId);
          const { data: meetings } = await supabase
            .from('document_metadata')
            .select('*')
            .eq('project_name', projectName)
            .order('created_at', { ascending: false });
          
          const { data: insights } = await supabase
            .from('project_insights')
            .select('*')
            .eq('project_name', projectName)
            .order('created_at', { ascending: false });
          
          setProjectDetails({
            projectName,
            meetings: meetings || [],
            insights: insights || [],
          } as ProjectDetails);
          setLoading(false);
        };
        fetchData();
      }
    }
  };
};