"use server"

import { createClient } from "@/utils/supabase/server"
import { createServiceClient } from "@/utils/supabase/service"

export async function getProjectDocuments(projectId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching project documents:", error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error in getProjectDocuments:", error)
    return { data: [], error: "Failed to fetch project documents" }
  }
}

export async function createProjectDocument(document: any) {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from("documents")
      .insert(document)
      .select()

    if (error) {
      console.error("Error creating project document:", error)
      return { data: null, error: error.message }
    }

    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error("Error in createProjectDocument:", error)
    return { data: null, error: "Failed to create project document" }
  }
}

export async function getProjectInsights(projectId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("insights")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching project insights:", error)
      return { data: [], error: error.message }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error("Error in getProjectInsights:", error)
    return { data: [], error: "Failed to fetch project insights" }
  }
}