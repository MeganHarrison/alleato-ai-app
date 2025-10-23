"use server"

import { createClient } from "@/utils/supabase/client"

export interface Company {
  id: string
  name: string | null
  industry: string | null
  size: string | null
  location: string | null
  website: string | null
  description: string | null
  contact_email: string | null
  phone: string | null
  status: string | null
  created_at: string | null
  updated_at: string | null
}

export async function getCompanies(): Promise<{ companies: Company[]; error?: string }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching companies:', error)
      return { 
        companies: [], 
        error: `Failed to fetch companies: ${error.message}` 
      }
    }

    return { companies: data || [] }
  } catch (error) {
    console.error('Unexpected error fetching companies:', error)
    return { 
      companies: [], 
      error: 'An unexpected error occurred while fetching companies' 
    }
  }
}

export async function createCompany(companyData: Partial<Company>): Promise<{ company?: Company; error?: string }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single()

    if (error) {
      console.error('Error creating company:', error)
      return { error: `Failed to create company: ${error.message}` }
    }

    return { company: data }
  } catch (error) {
    console.error('Unexpected error creating company:', error)
    return { error: 'An unexpected error occurred while creating company' }
  }
}

export async function updateCompany(id: string, updates: Partial<Company>): Promise<{ company?: Company; error?: string }> {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating company:', error)
      return { error: `Failed to update company: ${error.message}` }
    }

    return { company: data }
  } catch (error) {
    console.error('Unexpected error updating company:', error)
    return { error: 'An unexpected error occurred while updating company' }
  }
}

export async function deleteCompany(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting company:', error)
      return { error: `Failed to delete company: ${error.message}` }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deleting company:', error)
    return { error: 'An unexpected error occurred while deleting company' }
  }
}