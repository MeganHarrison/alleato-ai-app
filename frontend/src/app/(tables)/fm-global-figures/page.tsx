import { FMGlobalFiguresDataTable } from "@/components/tables/fm-global-figures-data-table"
import { getFMGlobalFigures } from "@/app/actions/fm-global-figures-actions"

export const dynamic = "force-dynamic"

export default async function FMGlobalFiguresPage() {
  const figures = await getFMGlobalFigures()

  return <FMGlobalFiguresDataTable figures={figures} />
}