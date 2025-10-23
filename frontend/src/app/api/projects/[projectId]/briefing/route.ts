import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/utils/supabase-server';
// import OpenAI from 'openai';

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

interface Insight {
  id: string;
  title: string;
  description: string;
  insight_type: string;
  severity: string;
  assignee?: string;
  due_date?: string;
  resolved: boolean;
  doc_title?: string;
  created_at: string;
  confidence_score?: number;
  business_impact?: string;
  financial_impact?: number;
  dependencies?: string[];
  next_steps?: string[];
  project_name?: string;
  meeting_date?: string;
  participants?: string[];
  source_content?: string;
}

interface ExecutiveBriefing {
  executiveSummary: {
    status: 'on-track' | 'at-risk' | 'critical' | 'delayed';
    headline: string;
    lastUpdated: string;
  };
  currentState: {
    keyDevelopments: Array<{
      title: string;
      impact: 'positive' | 'negative' | 'neutral';
      insightIds: string[];
    }>;
  };
  riskAssessment: {
    risks: Array<{
      risk: string;
      impact: string;
      likelihood: 'high' | 'medium' | 'low';
      insightIds: string[];
    }>;
  };
  activeResponse: {
    actions: Array<{
      action: string;
      owner: string;
      dueDate?: string;
      insightIds: string[];
    }>;
  };
  leadershipItems: {
    decisions: Array<{
      item: string;
      context: string;
      insightIds: string[];
    }>;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const supabase = createServerClient();

    // Fetch all insights for the project
    const { data: insights, error } = await supabase
      .from('document_insights')
      .select('*')
      .eq('project_name', decodeURIComponent(params.projectId))
      .order('created_at', { ascending: false })
      .limit(100); // Limit to most recent 100 insights

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch insights' },
        { status: 500 }
      );
    }

    if (!insights || insights.length === 0) {
      return NextResponse.json(
        {
          executiveSummary: {
            status: 'on-track',
            headline: 'No insights available for this project',
            lastUpdated: new Date().toISOString()
          },
          currentState: { keyDevelopments: [] },
          riskAssessment: { risks: [] },
          activeResponse: { actions: [] },
          leadershipItems: { decisions: [] },
          insights: []
        },
        { status: 200 }
      );
    }

    // Prepare insights for AI synthesis
    const insightsSummary = insights.map((i: Insight) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      type: i.insight_type,
      severity: i.severity,
      resolved: i.resolved,
      assignee: i.assignee,
      dueDate: i.due_date,
      meeting: i.doc_title,
      businessImpact: i.business_impact,
      financialImpact: i.financial_impact,
      createdAt: i.created_at
    }));

    // Use manual synthesis for now (OpenAI not installed)
    // TODO: Uncomment when openai package is installed
    /*
    const systemPrompt = `You are a senior project manager synthesizing project insights into an executive briefing.
    Transform the individual insights into a cohesive narrative that tells leadership:
    1. Executive Summary: One-sentence headline status and key message
    2. Current State: 2-3 key developments that show project momentum (positive or negative)
    3. Risk Assessment: Top 2-3 risks with business impact
    4. Active Response: What we're doing to address risks/issues (2-3 actions)
    5. Leadership Items: 1-2 decisions or awareness items for leadership

    For each point, reference the specific insight IDs that support it.
    Focus on business impact, not technical details.
    Be direct and actionable.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Project: ${params.projectId}\n\nInsights:\n${JSON.stringify(insightsSummary, null, 2)}\n\nCreate an executive briefing in JSON format.`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    let briefing: ExecutiveBriefing;
    try {
      briefing = JSON.parse(completion.choices[0].message.content || '{}');
    } catch (parseError) {
      // Fallback to manual synthesis if AI fails
      briefing = synthesizeManually(insights);
    }
    */
    
    // Use manual synthesis for now
    const briefing = synthesizeManually(insights);

    // Return the briefing with original insights attached
    return NextResponse.json({
      ...briefing,
      projectName: params.projectId,
      insightsCount: insights.length,
      insights: insights // Include raw insights for drill-down
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate briefing' },
      { status: 500 }
    );
  }
}

// Fallback manual synthesis if AI fails
function synthesizeManually(insights: Insight[]): ExecutiveBriefing {
  const criticalInsights = insights.filter(i => i.severity === 'critical');
  const unresolvedInsights = insights.filter(i => !i.resolved);
  const recentInsights = insights.slice(0, 5);

  // Determine overall status
  let status: 'on-track' | 'at-risk' | 'critical' | 'delayed' = 'on-track';
  if (criticalInsights.length > 2) status = 'critical';
  else if (criticalInsights.length > 0) status = 'at-risk';
  else if (unresolvedInsights.length > insights.length * 0.5) status = 'delayed';

  return {
    executiveSummary: {
      status,
      headline: `Project has ${criticalInsights.length} critical issues and ${unresolvedInsights.length} open items`,
      lastUpdated: new Date().toISOString()
    },
    currentState: {
      keyDevelopments: recentInsights.slice(0, 3).map(i => ({
        title: i.title,
        impact: i.severity === 'critical' ? 'negative' : 'neutral' as const,
        insightIds: [i.id]
      }))
    },
    riskAssessment: {
      risks: criticalInsights.slice(0, 3).map(i => ({
        risk: i.title,
        impact: i.business_impact || 'Potential project delay',
        likelihood: 'high' as const,
        insightIds: [i.id]
      }))
    },
    activeResponse: {
      actions: unresolvedInsights
        .filter(i => i.assignee)
        .slice(0, 3)
        .map(i => ({
          action: i.title,
          owner: i.assignee!,
          dueDate: i.due_date,
          insightIds: [i.id]
        }))
    },
    leadershipItems: {
      decisions: criticalInsights
        .filter(i => i.insight_type === 'decision' || i.business_impact)
        .slice(0, 2)
        .map(i => ({
          item: i.title,
          context: i.business_impact || i.description,
          insightIds: [i.id]
        }))
    }
  };
}
