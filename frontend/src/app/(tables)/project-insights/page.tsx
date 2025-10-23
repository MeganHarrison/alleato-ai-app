import { AIInsightsDataTable } from "@/components/tables/ai-insights-data-table"
import { getAIInsights } from "@/app/actions/ai-insights-actions"

export const dynamic = "force-dynamic"

export default async function AIInsightsPage() {
  const insights = await getAIInsights()

  return <AIInsightsDataTable insights={insights} />
}