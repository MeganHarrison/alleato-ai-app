import { FMGlobalTablesDataTable } from "@/components/tables/fm-global-tables-data-table"
import { getFMGlobalTables } from "@/app/actions/fm-global-tables-actions"

export const dynamic = "force-dynamic"

export default async function FMGlobalTablesPage() {
  const tables = await getFMGlobalTables()

  return <FMGlobalTablesDataTable tables={tables} />
}