"use server"

import { createClient } from "@/utils/supabase/server"
import { Database } from "@/types/database.types"

interface Contact {
  id: number
  name: string | null
  email: string | null
  phone: string | null
  company_id: string | null
  created_at: string
  updated_at?: string | null
}

interface Company {
  id: string
  name: string | null
}

interface ContactWithCompany extends Contact {
  company?: Company | null
}

export async function getContacts(): Promise<ContactWithCompany[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching contacts:", error)
    return []
  }

  return data || []
}

export async function getContactById(id: string): Promise<Contact | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", parseInt(id))
    .single()

  if (error) {
    console.error("Error fetching contact:", error)
    return null
  }

  return data
}

// Get contacts that are employees (have job titles)
export async function getEmployees(): Promise<Contact[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .not("job_title", "is", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching employees:", error)
    return []
  }

  return data || []
}