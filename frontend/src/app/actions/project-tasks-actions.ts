"use server"

import { createClient } from "@/utils/supabase/server"
import { createServiceClient } from "@/utils/supabase/service"
import { Database } from "@/types/database.types"
import { revalidatePath } from "next/cache"

type ProjectTask = Database["public"]["Tables"]["project_tasks"]["Row"]
type Project = Database["public"]["Tables"]["projects"]["Row"]

interface ProjectTaskWithProject extends ProjectTask {
  project?: Project | null
}

export async function getProjectTasks(): Promise<ProjectTaskWithProject[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("project_tasks")
    .select(`
      *,
      project:projects(*)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching project tasks:", error)
    return []
  }

  return data || []
}

export async function getProjectTaskById(id: string): Promise<ProjectTaskWithProject | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("project_tasks")
    .select(`
      *,
      project:projects(*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching project task:", error)
    return null
  }

  return data
}

export async function updateProjectTask(id: string, updates: Partial<ProjectTask>) {
  // Use service client to bypass RLS for development
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from("project_tasks")
    .update(updates)
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error updating project task:", error)
    return { data: null, error: error.message }
  }

  if (!data || data.length === 0) {
    console.error("No project task found with id:", id)
    return { data: null, error: "Project task not found" }
  }

  revalidatePath("/project-tasks")
  return { data: data[0], error: null }
}

export async function deleteProjectTask(id: string) {
  // Use service client to bypass RLS for development
  const supabase = createServiceClient()
  
  const { error } = await supabase
    .from("project_tasks")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting project task:", error)
    return { error: error.message }
  }

  console.log(`Deleted project task ${id}`)
  revalidatePath("/project-tasks")
  return { error: null }
}

export async function createProjectTask(task: Omit<ProjectTask, 'id' | 'created_at' | 'updated_at'>) {
  // Use service client to bypass RLS for development
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from("project_tasks")
    .insert(task)
    .select()

  if (error) {
    console.error("Error creating project task:", error)
    return { data: null, error: error.message }
  }

  if (!data || data.length === 0) {
    console.error("No project task created")
    return { data: null, error: "Failed to create project task" }
  }

  console.log(`Created project task ${data[0].id}`)
  revalidatePath("/project-tasks")
  return { data: data[0], error: null }
}