"use client"

import { useState, type ReactElement } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, ChevronRight, Database } from "lucide-react"

interface Column {
  key: string
  label: string
  format?: (value: unknown) => string | ReactElement
}

interface DataTableProps {
  data: unknown[]
  columns: Column[] | string[]
  pageSize?: number
}

export function DataTable({ data = [], columns, pageSize = 10 }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : []

  // Normalize columns to always have the same structure
  const normalizedColumns: Column[] =
    Array.isArray(columns) && typeof columns[0] === "string"
      ? (columns as string[]).map((col) => ({
          key: col,
          label: col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, " "),
        }))
      : (columns as Column[])

  // Filter data based on search term
  const filteredData = safeData.filter((item) => {
    if (!searchTerm) return true

    return Object.values(item || {}).some(
      (value) =>
        value !== null && value !== undefined && value.toString().toLowerCase().includes(searchTerm.toLowerCase()),
    )
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1) // Reset to first page on search
            }}
            className="pl-8 h-9"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredData.length} {filteredData.length === 1 ? "item" : "items"}
        </div>
      </div>

      <div className="rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {normalizedColumns.map((column) => (
                <TableHead key={column.key} className="font-medium">
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex} className="hover:bg-gray-50">
                  {normalizedColumns.map((column) => (
                    <TableCell key={`${rowIndex}-${column.key}`}>
                      {column.format && row?.[column.key] !== undefined
                        ? column.format(row[column.key])
                        : row?.[column.key] !== undefined
                          ? row[column.key]
                          : "—"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={normalizedColumns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Database className="h-8 w-8 mb-2 opacity-30" />
                    <p>No results found.</p>
                    {searchTerm && (
                      <p className="text-sm mt-1">
                        Try adjusting your search or filters to find what you&apos;re looking for.
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous Page</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next Page</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}