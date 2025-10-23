import { readdir, stat } from "fs/promises"
import path from "path"
import Link from "next/link"

import { PageHeader } from "@/components/page-header"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getTableRouteMeta } from "../(tables)/table-route-config"

const TABLES_DIRECTORY_CANDIDATES = [
  path.join(process.cwd(), "src/app/(tables)"),
  path.join(process.cwd(), "app/(tables)"),
  path.join(process.cwd(), ".next/server/app/(tables)")
]
const TABLE_PAGE_FILES = ["page.tsx", "page.ts", "page.js", "page.mjs", "page.jsx", "page.cjs"]

type TablePage = {
  slug: string
  href: string
  title: string
  description: string
}

function isEnoent(error: unknown): error is NodeJS.ErrnoException {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  )
}

function formatTitleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map(part => (part.length <= 2 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ")
}

async function hasPageFile(directoryPath: string) {
  for (const fileName of TABLE_PAGE_FILES) {
    try {
      await stat(path.join(directoryPath, fileName))
      return true
    } catch (error) {
      if (!isEnoent(error)) {
        throw error
      }
    }
  }

  return false
}

async function findTablesDirectory() {
  for (const candidate of TABLES_DIRECTORY_CANDIDATES) {
    try {
      const stats = await stat(candidate)

      if (stats.isDirectory()) {
        return candidate
      }
    } catch (error) {
      if (!isEnoent(error)) {
        throw error
      }
    }
  }

  return null
}

async function getTablePages(): Promise<TablePage[]> {
  const tablesDirectory = await findTablesDirectory()

  if (!tablesDirectory) {
    return []
  }

  let entries: import("fs").Dirent[]

  try {
    entries = await readdir(tablesDirectory, { withFileTypes: true })
  } catch (error) {
    if (isEnoent(error)) {
      return []
    }

    throw error
  }
  const pages: TablePage[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const slug = entry.name
    const directoryPath = path.join(tablesDirectory, slug)

    if (!(await hasPageFile(directoryPath))) continue

    const href = `/${slug}`
    const config = getTableRouteMeta(href)
    const fallbackTitle = formatTitleFromSlug(slug)
    const title = config?.title ?? fallbackTitle
    const description = config?.description ?? `View and manage ${fallbackTitle.toLowerCase()} records.`

    pages.push({
      slug,
      href,
      title,
      description
    })
  }

  return pages.sort((a, b) => a.title.localeCompare(b.title))
}

export default async function TablesIndexPage() {
  const tablePages = await getTablePages()

  return (
    <div className="space-y-8">
      <PageHeader
        title="Data tables"
        description="Browse the available data tables across your workspace. This list updates automatically whenever new tables are added or removed."
      />

      {tablePages.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {tablePages.map(table => (
            <Link key={table.slug} href={table.href} className="group block h-full">
              <Card className="h-full transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-brand-500 group-focus-visible:ring-offset-2">
                <CardHeader className="space-y-3">
                  <CardTitle className="text-xl">{table.title}</CardTitle>
                  <CardDescription>{table.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          No tables are available yet. Add a page to <code>src/app/(tables)</code> to see it listed here.
        </div>
      )}
    </div>
  )
}
