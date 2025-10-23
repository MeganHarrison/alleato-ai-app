import { getProjectMeetingInsights } from "@/app/actions/meeting-insights-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectInsights } from "@/lib/actions/project-documents-actions";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database.types";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { DocumentsTable } from "./DocumentsTable";
import { InsightsSection } from "./InsightsSection";

export const dynamic = "force-dynamic";


async function getProjectDetails(id: string) {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
        }
      },
    },
  });

  // Get project details
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      `
      *,
      clients (
        id,
        name,
        status
      )
    `
    )
    .eq("id", parseInt(id))
    .single();

  if (projectError || !project) {
    console.error("Project query error:", projectError);
    return null;
  }

  // Get documents for this project - documents table HAS a project_id column!
  const { data: projectDocuments } = await supabase
    .from("documents")
    .select("*")
    .eq("project_id", parseInt(id))
    .order("date", { ascending: false });

  // Use the documents directly - no transformation needed
  const uniqueDocuments = projectDocuments || [];

  // Get insights for this project (both project_insights and ai_insights)
  const insightsResult = await getProjectInsights(parseInt(id));
  const projectInsights = insightsResult.success
    ? insightsResult.projectInsights
    : [];
  const aiInsights = insightsResult.success ? insightsResult.aiInsights : [];

  // Get meeting insights for this project
  const meetingInsightsResult = await getProjectMeetingInsights();
  const meetingInsights = meetingInsightsResult.success
    ? meetingInsightsResult.insights
    : [];

  return {
    project,
    documents: uniqueDocuments,
    projectInsights,
    aiInsights,
    meetingInsights,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProjectDetails(id);

  if (!data) {
    notFound();
  }

  const { project, documents, projectInsights, aiInsights, meetingInsights } =
    data;

  // Calculate insight summary from meeting insights
  const safeInsights = meetingInsights || [];

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const getPhaseColor = (phase: string | null) => {
    if (!phase) return "bg-gray-100 text-gray-700";
    const lowerPhase = phase.toLowerCase();
    if (lowerPhase.includes("planning")) return "bg-blue-100 text-blue-700";
    if (lowerPhase.includes("development") || lowerPhase.includes("progress"))
      return "bg-purple-100 text-purple-700";
    if (lowerPhase.includes("testing")) return "bg-orange-100 text-orange-700";
    if (lowerPhase.includes("complete") || lowerPhase.includes("done"))
      return "bg-green-100 text-green-700";
    if (lowerPhase.includes("hold") || lowerPhase.includes("pause"))
      return "bg-yellow-100 text-yellow-700";
    return "bg-gray-100 text-gray-700";
  };


  return (
    <div className="min-h-screen px-8 lg:px-12 py-6">
      {/* Modern Header Section */}
      <div>
        <div className="mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl pb-4 font-medium text-gray-900">
                {project.name || `Project ${project.id}`}
              </h1>
              <h4 className="text-sm text-gray-600">
                Client:{" "}
                <span className="font-medium text-gray-900">
                  {project.clients?.name ||
                    "No client assigned"}
                </span>
              </h4>
              {project["job number"] && (
                <p className="mt-1 text-sm text-gray-600">
                  Job Number:{" "}
                  <span className="font-medium text-gray-900">
                    {project["job number"]}
                  </span>
                </p>
              )}
            </div>
            <Badge
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full",
                getPhaseColor(project.phase)
              )}
            >
              {project.phase || "Not Started"}
            </Badge>
          </div>

          {/* Two Column Layout for Summary and Details - Even Width */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-6">
            {/* Summary Column - 50% width */}
            <div>
              {project.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Project Summary
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {project.description}
                  </p>
                </div>
              )}
            </div>

            {/* Details Column - 50% width */}
            <div className="bg-gray-50 p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">
                Project Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Start Date:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(project["start date"])}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Est Revenue:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(project["est revenue"])}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Est Profit:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(project["est profit"])}
                  </span>
                </div>
                {project["est completion"] && (
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                      Est Completion:
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(project["est completion"])}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Feed - Moved Above Meetings */}
      <div className="my-8">
        <Card className="lg:col-span-4 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold tracking-[0.1em] uppercase">
              Project Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InsightsSection 
              meetingInsights={safeInsights}
              projectInsights={projectInsights}
              aiInsights={aiInsights}
            />
          </CardContent>
        </Card>
      </div>

      {/* Meetings Feed - Now Below Insights */}
      <div className="mb-8">
        <Card className="lg:col-span-4 bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold tracking-[0.1em] uppercase">
              Project Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-2">
              <DocumentsTable documents={documents} projectId={parseInt(id)} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
