import { Client } from "@notionhq/client";
import { NotionProject } from "./schemas";

// Initialize Notion client with error handling
function getNotionClient(): Client | null {
  const token = process.env.NOTION_TOKEN;
  
  if (!token) {
    console.warn("NOTION_TOKEN not found in environment variables");
    return null;
  }
  
  return new Client({
    auth: token,
  });
}

/**
 * Fetch projects from a Notion database
 * @param databaseId - The Notion database ID
 * @returns Array of NotionProject objects
 */
export async function getNotionProjects(databaseId: string): Promise<NotionProject[]> {
  const notion = getNotionClient();
  
  if (!notion) {
    throw new Error("Notion client not initialized - check NOTION_TOKEN");
  }
  
  if (!databaseId) {
    throw new Error("Database ID is required");
  }
  
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 100,
    });
    
    const projects: NotionProject[] = response.results.map((page: any) => {
      // Extract title from properties
      let title = "Untitled";
      if (page.properties) {
        // Look for title property (could be named differently)
        const titleProperty = Object.values(page.properties).find((prop: any) => 
          prop.type === "title"
        ) as any;
        
        if (titleProperty?.title?.length > 0) {
          title = titleProperty.title[0].plain_text || "Untitled";
        }
      }
      
      // Extract other common properties
      const getPropertyValue = (propertyName: string) => {
        const prop = page.properties?.[propertyName];
        if (!prop) return undefined;
        
        switch (prop.type) {
          case "select":
            return prop.select?.name;
          case "multi_select":
            return prop.multi_select?.map((item: any) => item.name).join(", ");
          case "rich_text":
            return prop.rich_text?.[0]?.plain_text;
          case "number":
            return prop.number?.toString();
          case "date":
            return prop.date?.start;
          case "checkbox":
            return prop.checkbox;
          case "url":
            return prop.url;
          default:
            return undefined;
        }
      };
      
      return {
        id: page.id,
        title,
        status: getPropertyValue("Status"),
        priority: getPropertyValue("Priority"),
        description: getPropertyValue("Description"),
        created_time: page.created_time,
        last_edited_time: page.last_edited_time,
        url: page.url,
        properties: page.properties,
      };
    });
    
    return projects;
  } catch (error) {
    console.error("Error fetching Notion projects:", error);
    throw new Error("Failed to fetch projects from Notion database");
  }
}