'use server'

import { createClient } from '@/lib/supabase/server'

export type Subcontractor = {
  id: number
  company_name: string | null
  contact_first_name: string | null
  contact_last_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  specialties: string[] | null
  license_number: string | null
  insurance_carrier: string | null
  insurance_policy_number: string | null
  insurance_expiry_date: string | null
  w9_on_file: boolean
  status: 'active' | 'inactive' | 'pending' | null
  rating: number | null
  hourly_rate: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export async function getSubcontractors(): Promise<Subcontractor[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('subcontractors')
    .select('*')
    .order('company_name', { ascending: true })

  if (error) {
    console.error('Error fetching subcontractors:', error)
    return []
  }

  return data || []
}

export async function getSubcontractor(id: number): Promise<Subcontractor | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('subcontractors')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching subcontractor:', error)
    return null
  }

  return data
}

export async function updateSubcontractor(id: number, updates: Partial<Subcontractor>): Promise<Subcontractor | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('subcontractors')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating subcontractor:', error)
    return null
  }

  return data
}

export async function createSubcontractor(subcontractor: Omit<Subcontractor, 'id' | 'created_at' | 'updated_at'>): Promise<Subcontractor | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('subcontractors')
    .insert({
      ...subcontractor,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating subcontractor:', error)
    return null
  }

  return data
}

export async function deleteSubcontractor(id: number): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('subcontractors')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting subcontractor:', error)
    return false
  }

  return true
}

export async function getActiveSubcontractors(): Promise<Subcontractor[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('subcontractors')
    .select('*')
    .eq('status', 'active')
    .order('company_name', { ascending: true })

  if (error) {
    console.error('Error fetching active subcontractors:', error)
    return []
  }

  return data || []
}

export async function getSubcontractorsBySpecialty(specialty: string): Promise<Subcontractor[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('subcontractors')
    .select('*')
    .contains('specialties', [specialty])
    .order('rating', { ascending: false })

  if (error) {
    console.error('Error fetching subcontractors by specialty:', error)
    return []
  }

  return data || []
}