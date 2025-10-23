import { z } from "zod";

// Environment validation schema
export const NotionEnvSchema = z.object({
  NOTION_TOKEN: z.string().min(1, "NOTION_TOKEN is required"),
  NOTION_DATABASE_ID: z.string().optional(),
  NOTION_PROJECTS_DATABASE_ID: z.string().optional(),
});

// Notion project structure schema
export const NotionProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string().optional(),
  priority: z.string().optional(),
  description: z.string().optional(),
  created_time: z.string().optional(),
  last_edited_time: z.string().optional(),
  url: z.string().optional(),
  properties: z.record(z.any()).optional(),
});

// Response schema for notion projects
export const NotionProjectsResponseSchema = z.object({
  projects: z.array(NotionProjectSchema),
  error: z.string().optional(),
});

// Export types
export type NotionEnv = z.infer<typeof NotionEnvSchema>;
export type NotionProject = z.infer<typeof NotionProjectSchema>;
export type NotionProjectsResponse = z.infer<typeof NotionProjectsResponseSchema>;