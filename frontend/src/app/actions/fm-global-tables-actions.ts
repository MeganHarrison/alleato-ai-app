"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { Database } from "@/types/database.types"
import { revalidatePath } from "next/cache"

type FMGlobalTable = Database["public"]["Tables"]["fm_global_tables"]["Row"]

export async function getFMGlobalTables(): Promise<FMGlobalTable[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("fm_global_tables")
    .select("*")
    .order("table_number", { ascending: true })

  if (error) {
    console.error("Error fetching FM Global tables:", error)
    return []
  }

  return data || []
}

export async function getFMGlobalTableById(id: number): Promise<FMGlobalTable | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("fm_global_tables")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching FM Global table:", error)
    return null
  }

  return data
}

export async function updateFMGlobalTable(id: number, updates: Partial<FMGlobalTable>) {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from("fm_global_tables")
    .update(updates)
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error updating FM Global table:", error)
    return { data: null, error: error.message }
  }

  if (!data || data.length === 0) {
    console.error("No FM Global table found with id:", id)
    return { data: null, error: "FM Global table not found" }
  }

  revalidatePath("/fm-global-tables")
  return { data: data[0], error: null }
}

export async function deleteFMGlobalTable(id: number) {
  const supabase = createServiceClient()
  
  const { error } = await supabase
    .from("fm_global_tables")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting FM Global table:", error)
    return { error: error.message }
  }

  console.log(`Deleted FM Global table ${id}`)
  revalidatePath("/fm-global-tables")
  return { error: null }
}