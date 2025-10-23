"use server"

import { supabase } from "@/lib/supabase/client"

export interface Document {
  id: string
  title: string | null
  content: string
  project: string | null
  project_id: number | null
  file_date: string | null
  file_id: string
  category: string | null
  action_items: string | null
  tags: string[] | null
  metadata: any | null
  created_at: string | null
  updated_at: string | null
  source: string | null
  url: string | null
  fireflies_id: string | null
  fireflies_link: string | null
  processing_status: string | null
  storage_object_id: string | null
  created_by: string | null
  embedding?: string | null
}

export async function getDocuments(): Promise<{ documents: Document[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      return { 
        documents: [], 
        error: `Failed to fetch documents: ${error.message}` 
      }
    }

    return { documents: data || [] }
  } catch (error) {
    console.error('Unexpected error fetching documents:', error)
    return { 
      documents: [], 
      error: 'An unexpected error occurred while fetching documents' 
    }
  }
}

export async function createDocument(documentData: Partial<Document>): Promise<{ document?: Document; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single()

    if (error) {
      console.error('Error creating document:', error)
      return { error: `Failed to create document: ${error.message}` }
    }

    return { document: data }
  } catch (error) {
    console.error('Unexpected error creating document:', error)
    return { error: 'An unexpected error occurred while creating document' }
  }
}

export async function updateDocument(id: string, updates: Partial<Document>): Promise<{ document?: Document; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating document:', error)
      return { error: `Failed to update document: ${error.message}` }
    }

    return { document: data }
  } catch (error) {
    console.error('Unexpected error updating document:', error)
    return { error: 'An unexpected error occurred while updating document' }
  }
}

export async function deleteDocument(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting document:', error)
      return { error: `Failed to delete document: ${error.message}` }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting document:', error)
    return { error: 'An unexpected error occurred while deleting document' }
  }
}