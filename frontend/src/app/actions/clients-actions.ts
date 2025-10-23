"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { Database } from "@/types/database.types"
import { revalidatePath } from "next/cache"

// Database types not used - using custom interfaces below

// Match the type expected by the component
export interface ClientWithCompany {
  id: number
  name: string | null
  email?: string | null
  phone?: string | null
  company_id?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  website?: string | null
  industry?: string | null
  status?: string | null
  created_at: string
  updated_at?: string
  company?: {
    id: string
    name: string | null
  } | null
}

export async function getClients(): Promise<ClientWithCompany[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("clients")
    .select(`
      *,
      company:companies(*)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching clients:", error)
    return []
  }

  return data || []
}

export async function getClientById(id: number): Promise<ClientWithCompany | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("clients")
    .select(`
      *,
      company:companies(*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching client:", error)
    return null
  }

  return data
}

export async function updateClient(id: number, updates: Partial<ClientWithCompany>) {
  // Use service client to bypass RLS for development
  const supabase = await createServiceClient()
  
  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error updating client:", error)
    return { data: null, error: error.message }
  }

  if (!data || data.length === 0) {
    console.error("No client found with id:", id)
    return { data: null, error: "Client not found" }
  }

  revalidatePath("/clients")
  return { data: data[0], error: null }
}

export async function deleteClient(id: number) {
  // Use service client to bypass RLS for development
  const supabase = await createServiceClient()
  
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting client:", error)
    return { error: error.message }
  }

  console.log(`Deleted client ${id}`)
  revalidatePath("/clients")
  return { error: null }
}