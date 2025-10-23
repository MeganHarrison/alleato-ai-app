"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@/lib/supabase/server"
import { Database } from "@/types/database.types"
import { revalidatePath } from "next/cache"

type FMGlobalFigure = Database["public"]["Tables"]["fm_global_figures"]["Row"]

export async function getFMGlobalFigures(): Promise<FMGlobalFigure[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("fm_global_figures")
    .select("*")
    .order("figure_number", { ascending: true })

  if (error) {
    console.error("Error fetching FM Global figures:", error)
    return []
  }

  return data || []
}

export async function getFMGlobalFigureById(id: number): Promise<FMGlobalFigure | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("fm_global_figures")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching FM Global figure:", error)
    return null
  }

  return data
}

export async function updateFMGlobalFigure(id: number, updates: Partial<FMGlobalFigure>) {
  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from("fm_global_figures")
    .update(updates)
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error updating FM Global figure:", error)
    return { data: null, error: error.message }
  }

  if (!data || data.length === 0) {
    console.error("No FM Global figure found with id:", id)
    return { data: null, error: "FM Global figure not found" }
  }

  revalidatePath("/fm-global-figures")
  return { data: data[0], error: null }
}

export async function deleteFMGlobalFigure(id: number) {
  const supabase = createServiceClient()
  
  const { error } = await supabase
    .from("fm_global_figures")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting FM Global figure:", error)
    return { error: error.message }
  }

  console.log(`Deleted FM Global figure ${id}`)
  revalidatePath("/fm-global-figures")
  return { error: null }
}