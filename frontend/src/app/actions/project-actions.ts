/**
 * PROJECT ACTIONS - Complete CRUD operations for projects
 * 
 * PURPOSE: Full project management including create, read, update, delete operations
 * FUNCTIONALITY: 
 *   - Project listing with error handling
 *   - Project creation from form data
 *   - Project updates and deletions
 *   - Individual field updates for inline editing
 * DEPENDENCIES:
 *   - Supabase client for database operations
 *   - Next.js cache revalidation
 *   - Database types for TypeScript safety
 * USAGE: Used by project management tables, forms, and components
 * CONNECTIONS: 
 *   - /components/editable-projects-table.tsx (field updates)
 *   - /components/add-project-button.tsx (creation)
 *   - /components/add-meeting-button.tsx (project selection)
 * 
 * NOTE: This provides comprehensive project CRUD, distinct from dashboard-actions.ts
 * which only handles filtered read operations for dashboard display
 */

"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { Database } from "@/types/database.types"

// Type aliases for easier usage
type Project = Database["public"]["Tables"]["projects"]["Row"]
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"]

export async function getProjects(): Promise<{ projects: Project[]; error: string | null }> {
  const supabase = await createClient()

  try {
    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching projects:", error)
      return { projects: [], error: error.message }
    }

    return { projects: projects || [], error: null }
  } catch (err) {
    console.error("Unexpected error fetching projects:", err)
    return { projects: [], error: "Failed to fetch projects" }
  }
}

export async function createProject(formData: FormData) {
  const supabase = await createClient()

  try {
    const projectData: Partial<ProjectInsert> = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      phase: formData.get("phase") as string || "Planning",
      "start date": formData.get("start_date") as string || null,
      "est completion": formData.get("end_date") as string || null,
      category: formData.get("category") as string || null,
      budget: formData.get("budget") ? Number(formData.get("budget")) : null,
    }

    const { data, error } = await supabase.from("projects").insert(projectData).select().single()

    if (error) {
      console.error("Error creating project:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/projects-db")
    revalidatePath("/dashboard")
    return { success: true, data }
  } catch (err) {
    console.error("Unexpected error creating project:", err)
    return { success: false, error: "Failed to create project" }
  }
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createClient()

  const projectData: Partial<Project> = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    phase: formData.get("phase") as string,
    "start date": formData.get("start_date") as string,
    "est completion": (formData.get("end_date") as string) || null,
    category: formData.get("category") as string || null,
    budget: formData.get("budget") ? Number(formData.get("budget")) : null,
  }

  const { error } = await supabase.from("projects").update(projectData).eq("id", parseInt(id))

  if (error) {
    console.error("Error updating project:", error)
    throw new Error("Failed to update project")
  }

  revalidatePath("/projects-db")
  revalidatePath("/dashboard")
}

export async function deleteProject(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("projects").delete().eq("id", parseInt(id))

  if (error) {
    console.error("Error deleting project:", error)
    throw new Error("Failed to delete project")
  }

  revalidatePath("/projects-db")
}

export async function updateProjectField(id: string, field: string, value: unknown) {
  const supabase = await createClient()

  const updateData: Partial<Project> = {
    [field]: value,
  }

  const { error } = await supabase.from("projects").update(updateData).eq("id", parseInt(id))

  if (error) {
    console.error("Error updating project field:", error)
    throw new Error("Failed to update project field")
  }

  revalidatePath("/projects-db")
  revalidatePath("/dashboard")
}
