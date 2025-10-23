"use server"

import { createClient } from "@/utils/supabase/server"
import { Database } from "@/types/database.types"

type Document = Database["public"]["Tables"]["documents"]["Row"]

export async function getDocuments(): Promise<Document[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("id", { ascending: false })

  if (error) {
    console.error("Error fetching documents:", error)
    return []
  }

  return data || []
}

export async function getDocumentById(id: number): Promise<Document | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching document:", error)
    return null
  }

  return data
}