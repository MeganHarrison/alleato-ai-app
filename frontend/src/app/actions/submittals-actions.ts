"use server"

import { supabase } from "@/lib/supabase/client"

export interface Submittal {
  id: string
  created_at: string | null
  current_version: number | null
  description: string | null
  metadata: any | null
  priority: string | null
  project_id: number
  required_approval_date: string | null
  specification_id: string | null
  status: string | null
  submission_date: string | null
  submittal_number: string
  submittal_type_id: string
  submitted_by: string
  submitter_company: string | null
  title: string
  total_versions: number | null
  updated_at: string | null
  // View joins
  project_name?: string | null
  submittal_type_name?: string | null
  submitted_by_email?: string | null
  discrepancy_count?: number | null
  critical_discrepancies?: number | null
}

export async function getSubmittals(): Promise<{ items: Submittal[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Try to use the view first for enhanced data, fallback to table if needed
    let { data, error } = await supabase
      .from('active_submittals')
      .select('*')
      .order('submission_date', { ascending: false })

    // If view fails, try direct table
    if (error && error.code === '42P01') {
      const result = await supabase
        .from('submittals')
        .select(`
          *,
          projects!submittals_project_id_fkey (
            name
          )
        `)
        .order('submission_date', { ascending: false })
      
      data = result.data
      error = result.error
      
      // Map the joined data
      if (data) {
        data = data.map(item => ({
          ...item,
          project_name: item.projects?.name || null,
          projects: undefined
        }))
      }
    }

    if (error) {
      console.error('Error fetching submittals:', error)
      return { 
        items: [], 
        error: `Failed to fetch submittals: ${error.message}` 
      }
    }

    return { items: data || [] }
  } catch (error) {
    console.error('Unexpected error fetching submittals:', error)
    return { 
      items: [], 
      error: 'An unexpected error occurred while fetching submittals' 
    }
  }
}

export async function createSubmittal(itemData: Partial<Submittal>): Promise<{ item?: Submittal; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('submittals')
      .insert(itemData)
      .select()
      .single()

    if (error) {
      console.error('Error creating submittal:', error)
      return { error: `Failed to create submittal: ${error.message}` }
    }

    return { item: data }
  } catch (error) {
    console.error('Unexpected error creating submittal:', error)
    return { error: 'An unexpected error occurred while creating submittal' }
  }
}

export async function updateSubmittal(id: string, updates: Partial<Submittal>): Promise<{ item?: Submittal; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('submittals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating submittal:', error)
      return { error: `Failed to update submittal: ${error.message}` }
    }

    return { item: data }
  } catch (error) {
    console.error('Unexpected error updating submittal:', error)
    return { error: 'An unexpected error occurred while updating submittal' }
  }
}

export async function deleteSubmittal(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('submittals')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting submittal:', error)
      return { error: `Failed to delete submittal: ${error.message}` }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting submittal:', error)
    return { error: 'An unexpected error occurred while deleting submittal' }
  }
}