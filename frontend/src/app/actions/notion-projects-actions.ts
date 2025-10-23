"use server";

import { getNotionProjects } from "@/utils/notion/projects";
import { 
  NotionEnvSchema, 
  NotionProjectsResponseSchema,
  type NotionProjectsResponse 
} from "@/utils/notion/schemas";

// Re-export type for backward compatibility
export type { NotionProjectsResponse };

/**
 * Server action to fetch Notion projects with comprehensive validation.
 * 
 * Validates environment variables and provides secure error handling.
 * Uses NOTION_DATABASE_ID or NOTION_PROJECTS_DATABASE_ID from environment.
 * 
 * @returns Promise resolving to validated NotionProjectsResponse
 */
export async function fetchNotionProjects(): Promise<NotionProjectsResponse> {
  try {
    // Check if required environment variables exist before validation
    if (!process.env.NOTION_TOKEN) {
      return NotionProjectsResponseSchema.parse({
        projects: [],
        error: "Notion integration not configured. Please add NOTION_TOKEN to your environment variables.",
      });
    }

    if (!process.env.NOTION_DATABASE_ID && !process.env.NOTION_PROJECTS_DATABASE_ID) {
      return NotionProjectsResponseSchema.parse({
        projects: [],
        error: "Notion database not configured. Please add NOTION_DATABASE_ID to your environment variables.",
      });
    }

    // Validate environment variables using Zod schema
    const env = NotionEnvSchema.parse({
      NOTION_TOKEN: process.env.NOTION_TOKEN,
      NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID,
      NOTION_PROJECTS_DATABASE_ID: process.env.NOTION_PROJECTS_DATABASE_ID,
    });

    // Get the appropriate database ID
    const databaseId = env.NOTION_DATABASE_ID || env.NOTION_PROJECTS_DATABASE_ID;
    
    if (!databaseId) {
      return NotionProjectsResponseSchema.parse({
        projects: [],
        error: "Database ID configuration error. Please check your environment variables.",
      });
    }

    // Fetch and validate projects
    const projects = await getNotionProjects(databaseId);
    
    // Validate response structure
    const response = NotionProjectsResponseSchema.parse({
      projects,
    });
    
    return response;
  } catch (error) {
    console.error("Error in fetchNotionProjects:", error);
    
    // Provide safe, generic error messages for security
    let userFriendlyMessage = "Unable to fetch Notion projects.";
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === "ZodError") {
        userFriendlyMessage = "Configuration error. Please check environment variables.";
      } else if (error.message.includes("NOTION_TOKEN")) {
        userFriendlyMessage = "Authentication error. Please check NOTION_TOKEN.";
      } else if (error.message.includes("database")) {
        userFriendlyMessage = "Database configuration error. Please check NOTION_DATABASE_ID.";
      } else if (error.message.includes("Invalid data format")) {
        userFriendlyMessage = "Data validation error. Please check your Notion database structure.";
      }
    }
    
    return NotionProjectsResponseSchema.parse({
      projects: [],
      error: userFriendlyMessage,
    });
  }
}