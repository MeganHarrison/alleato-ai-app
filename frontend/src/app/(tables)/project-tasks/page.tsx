import { ProjectTasksDataTable } from "@/components/tables/project-tasks-data-table"
import { getProjectTasks } from "@/app/actions/project-tasks-actions"

export const dynamic = "force-dynamic"

export default async function ProjectTasksPage() {
  const tasks = await getProjectTasks()

  return <ProjectTasksDataTable tasks={tasks} />
}