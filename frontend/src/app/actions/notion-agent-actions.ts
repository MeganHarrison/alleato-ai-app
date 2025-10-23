"use server"

import { createPage, updatePage, createDatabase, updateDatabase } from "@/utils/notion/client"

export async function createNotionPage(databaseId: string, properties: unknown) {
  try {
    const data = await createPage(databaseId, properties)
    return { success: true, data }
  } catch (error) {
    console.error("Error creating Notion page:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateNotionPage(pageId: string, properties: unknown) {
  try {
    const data = await updatePage(pageId, properties)
    return { success: true, data }
  } catch (error) {
    console.error("Error updating Notion page:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function createNotionDatabase(parentPageId: string, title: string, properties: unknown) {
  try {
    const data = await createDatabase(parentPageId, title, properties)
    return { success: true, data }
  } catch (error) {
    console.error("Error creating Notion database:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateNotionDatabase(databaseId: string, properties: unknown) {
  try {
    const data = await updateDatabase(databaseId, properties)
    return { success: true, data }
  } catch (error) {
    console.error("Error updating Notion database:", error)
    return { success: false, error: (error as Error).message }
  }
}
