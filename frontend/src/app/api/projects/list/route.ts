import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/utils/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Get distinct project names from document_insights
    const { data: projects, error } = await supabase
      .from('document_insights')
      .select('project_name')
      .not('project_name', 'is', null)
      .order('project_name');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    // Get unique project names and count insights for each
    const projectMap = new Map();
    projects?.forEach(p => {
      if (p.project_name) {
        projectMap.set(p.project_name, (projectMap.get(p.project_name) || 0) + 1);
      }
    });

    const projectList = Array.from(projectMap.entries()).map(([name, count]) => ({
      name,
      insightCount: count
    }));

    return NextResponse.json({ projects: projectList });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
