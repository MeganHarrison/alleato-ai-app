"use server"

import { createClient } from "@/utils/supabase/server"
import { createServiceClient } from "@/utils/supabase/service"

export async function getMeetingInsights() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("meeting_insights") 
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching meeting insights:", error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error in getMeetingInsights:", error)
    return { data: [], error: "Failed to fetch meeting insights" }
  }
}

export async function createMeetingInsight(insight: any) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from("meeting_insights")
      .insert(insight)
      .select()

    if (error) {
      console.error("Error creating meeting insight:", error)
      return { data: null, error: error.message }
    }

    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error("Error in createMeetingInsight:", error)
    return { data: null, error: "Failed to create meeting insight" }
  }
}

export async function getProjectMeetingInsights(projectId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("meeting_insights")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching project meeting insights:", error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error in getProjectMeetingInsights:", error)
    return { data: [], error: "Failed to fetch project meeting insights" }
  }
}