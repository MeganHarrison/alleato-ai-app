"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { Database } from "@/types/database.types"
import { revalidatePath } from "next/cache"

type Project = Database["public"]["Tables"]["projects"]["Row"]

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching projects:", error)
    return []
  }

  return data || []
}

export async function getProjectById(id: number): Promise<Project | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching project:", error)
    return null
  }

  return data
}

export async function updateProject(id: number, updates: Partial<Project>) {
  // Use service client to bypass RLS for development
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error updating project:", error)
    return { data: null, error: error.message }
  }

  if (!data || data.length === 0) {
    console.error("No project found with id:", id)
    return { data: null, error: "Project not found" }
  }

  revalidatePath("/projects")
  return { data: data[0], error: null }
}

export async function deleteProject(id: number) {
  // Use service client to bypass RLS for development
  const supabase = createServiceClient()
  
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting project:", error)
    return { error: error.message }
  }

  console.log(`Deleted project ${id}`)
  revalidatePath("/projects")
  return { error: null }
}