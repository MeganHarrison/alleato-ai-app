"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { Database } from "@/types/database.types"
import { revalidatePath } from "next/cache"

// Document metadata type matching component expectations exactly
export type DocumentMetadata = {
  id: number
  filename: string | null
  file_path: string | null
  file_type: string | null
  file_size: number | null
  upload_date: string | null
  processed_date: string | null
  status: string | null
  error_message: string | null
  chunk_count: number | null
  created_at: string
  updated_at: string | null
}

export async function getDocumentMetadata(): Promise<DocumentMetadata[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("document_metadata")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching document metadata:", error)
    return []
  }

  return data || []
}

export async function getDocumentMetadataById(id: number): Promise<DocumentMetadata | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("document_metadata")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching document metadata:", error)
    return null
  }

  return data
}

export async function updateDocumentMetadata(id: number, updates: Partial<DocumentMetadata>) {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from("document_metadata")
    .update(updates)
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error updating document metadata:", error)
    return { data: null, error: error.message }
  }

  if (!data || data.length === 0) {
    console.error("No document metadata found with id:", id)
    return { data: null, error: "Document metadata not found" }
  }

  revalidatePath("/document-metadata")
  return { data: data[0], error: null }
}

export async function deleteDocumentMetadata(id: number) {
  const supabase = createServiceClient()
  
  const { error } = await supabase
    .from("document_metadata")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting document metadata:", error)
    return { error: error.message }
  }

  console.log(`Deleted document metadata ${id}`)
  revalidatePath("/document-metadata")
  return { error: null }
}