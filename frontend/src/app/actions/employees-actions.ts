'use server'

import { createClient } from '@/lib/supabase/server'

export type Employee = {
  id: number
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  department: string | null
  salery: number | null
  start_date: string | null
  supervisor: string | null
  company_card: string | null
  truck_allowance: number | null
  phone_allowance: number | null
  created_at: string
  updated_at: string
}

export async function getEmployees(): Promise<Employee[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('last_name', { ascending: true })

  if (error) {
    console.error('Error fetching employees:', error)
    return []
  }

  return data || []
}

export async function getEmployee(id: number): Promise<Employee | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching employee:', error)
    return null
  }

  return data
}

export async function updateEmployee(id: number, updates: Partial<Employee>): Promise<Employee | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating employee:', error)
    return null
  }

  return data
}

export async function createEmployee(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('employees')
    .insert({
      ...employee,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating employee:', error)
    return null
  }

  return data
}

export async function deleteEmployee(id: number): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting employee:', error)
    return false
  }

  return true
}