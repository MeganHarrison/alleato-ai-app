/**
 * MEETING ACTIONS - Complete meeting management system
 * 
 * PURPOSE: Full CRUD operations for meetings with project associations
 * FUNCTIONALITY:
 *   - Meeting listing with project information
 *   - Meeting creation and updates
 *   - Meeting deletion with cleanup
 *   - Project-filtered meeting queries
 * DEPENDENCIES:
 *   - Supabase client (both regular and service for RLS bypass)
 *   - Next.js cache revalidation
 *   - Database types for TypeScript safety
 * USAGE: Core meeting management throughout the application
 * CONNECTIONS:
 *   - /components/editable-meetings-table.tsx (CRUD operations)
 *   - /components/add-meeting-button.tsx (creation)
 *   - /components/project-details-with-meetings.tsx (project filtering)
 *   - /app/(project-manager)/meetings/page.tsx (listing)
 * 
 * NOTE: Uses service client to bypass RLS in development mode
 */

"use server"

import { createClient } from "@/utils/supabase/server"
import { createServiceClient } from "@/utils/supabase/service"
import { revalidatePath } from "next/cache"
import type { Tables, TablesInsert } from "@/types/database.types"

export async function getMeetings() {
  // Use service client to bypass RLS for development
  const supabase = createServiceClient()
  
  const { data: meetings, error } = await supabase
    .from("meetings")
    .select(`
      *,
      projects (
        id,
        name
      )
    `)
    .order("date", { ascending: false })

  if (error) {
    console.error("Error fetching meetings:", error)
    return { meetings: [], error: error.message }
  }

  return { meetings: meetings || [], error: null }
}

export async function createMeeting(meeting: TablesInsert<"meetings">) {
  // Use service client to bypass RLS for development
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from("meetings")
    .insert(meeting)
    .select()
    .single()

  if (error) {
    console.error("Error creating meeting:", error)
    return { data: null, error: error.message }
  }

  revalidatePath("/meetings")
  return { data, error: null }
}

export async function updateMeeting(id: string, updates: Partial<Tables<"meetings">>) {
  // Use service client to bypass RLS for development
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from("meetings")
    .update(updates)
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error updating meeting:", error)
    return { data: null, error: error.message }
  }

  if (!data || data.length === 0) {
    console.error("No meeting found with id:", id)
    return { data: null, error: "Meeting not found" }
  }

  revalidatePath("/meetings")
  return { data: data[0], error: null }
}

export async function deleteMeeting(id: string) {
  // Use service client to bypass RLS for development
  const supabase = createServiceClient()
  
  // Now try to delete it
  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting meeting:", error)
    return { error: error.message }
  }

  console.log(`Deleted meeting ${id}`)
  revalidatePath("/meetings")
  return { error: null }
}

export async function getMeetingsByProject(projectId: number) {
  const supabase = createServiceClient()
  
  const { data: meetings, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("project_id", projectId)
    .order("date", { ascending: false })

  if (error) {
    console.error("Error fetching meetings for project:", error)
    return { meetings: [], error: error.message }
  }

  return { meetings: meetings || [], error: null }
}