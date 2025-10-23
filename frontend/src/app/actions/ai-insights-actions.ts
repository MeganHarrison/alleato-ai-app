"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { Database } from "@/types/database.types"
import { revalidatePath } from "next/cache"

type AIInsight = Database["public"]["Tables"]["ai_insights"]["Row"]
type Project = Database["public"]["Tables"]["projects"]["Row"]

// Match the type expected by the component
export interface AIInsightWithProject {
  id: number
  insight_type: string
  title: string | null
  description: string | null
  confidence_score: number | null
  severity: string | null
  status: string | null
  project_name: string | null
  assigned_to: string | null
  assignee: string | null
  due_date: string | null
  document_id: string | null
  meeting_name: string | null
  meeting_date: string | null
  resolved: boolean | null
  created_at: string
  updated_at: string | null
  metadata: any
  project?: {
    id: number
    name: string | null
  } | null
}

export async function getAIInsights(): Promise<AIInsightWithProject[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("ai_insights")
    .select(`
      *,
      project:projects(*)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching AI insights:", error)
    return []
  }

  return data || []
}

export async function getAIInsightById(id: number): Promise<AIInsightWithProject | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("ai_insights")
    .select(`
      *,
      project:projects(*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching AI insight:", error)
    return null
  }

  return data
}

export async function updateAIInsight(id: number, updates: Partial<AIInsightWithProject>) {
  // Use service client to bypass RLS for development
  const supabase = await createServiceClient()
  
  const { data, error } = await supabase
    .from("ai_insights")
    .update(updates)
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error updating AI insight:", error)
    return { data: null, error: error.message }
  }

  if (!data || data.length === 0) {
    console.error("No AI insight found with id:", id)
    return { data: null, error: "AI insight not found" }
  }

  revalidatePath("/ai-insights")
  return { data: data[0], error: null }
}

export async function deleteAIInsight(id: number) {
  // Use service client to bypass RLS for development
  const supabase = await createServiceClient()
  
  const { error } = await supabase
    .from("ai_insights")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting AI insight:", error)
    return { error: error.message }
  }

  console.log(`Deleted AI insight ${id}`)
  revalidatePath("/ai-insights")
  return { error: null }
}