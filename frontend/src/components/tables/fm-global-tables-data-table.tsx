'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search,
  Download,
  Columns3,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Table2,
  Shield,
  Droplets,
  Package
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateFMGlobalTable, deleteFMGlobalTable } from '@/app/actions/fm-global-tables-actions'
import { toast } from 'sonner'

export type FMGlobalTable = {
  id: number
  table_number: string | null
  title: string | null
  asrs_type: string | null
  protection_scheme: string | null
  commodity_types: string | null
  ceiling_height_min_ft: number | null
  ceiling_height_max_ft: number | null
  sprinkler_specifications: any | null
  design_parameters: any | null
  special_conditions: string | null
  created_at: string
  updated_at: string | null
}

interface FMGlobalTablesDataTableProps {
  tables: FMGlobalTable[]
}

const COLUMNS = [
  { id: "table_number", label: "Table #", defaultVisible: true },
  { id: "title", label: "Title", defaultVisible: true },
  { id: "asrs_type", label: "ASRS Type", defaultVisible: true },
  { id: "protection_scheme", label: "Protection", defaultVisible: true },
  { id: "commodity_types", label: "Commodities", defaultVisible: true },
  { id: "ceiling_height", label: "Height Range", defaultVisible: true },
  { id: "special_conditions", label: "Conditions", defaultVisible: false },
]

export function FMGlobalTablesDataTable({ tables }: FMGlobalTablesDataTableProps) {
  const [search, setSearch] = useState("")
  const [asrsFilter, setAsrsFilter] = useState("all")
  const [protectionFilter, setProtectionFilter] = useState("all")
  const [visibleColumns, setVisibleColumns] = useState(
    COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: col.defaultVisible }), {})
  )

  // Get unique values for filters
  const uniqueAsrsTypes = useMemo(() => {
    const types = tables.map(tbl => tbl.asrs_type).filter(Boolean)
    return [...new Set(types)]
  }, [tables])

  const uniqueProtectionSchemes = useMemo(() => {
    const schemes = tables.map(tbl => tbl.protection_scheme).filter(Boolean)
    return [...new Set(schemes)]
  }, [tables])

  // Filter and search tables
  const filteredTables = useMemo(() => {
    return tables.filter(tbl => {
      const matchesSearch = !search || 
        tbl.table_number?.toLowerCase().includes(search.toLowerCase()) ||
        tbl.title?.toLowerCase().includes(search.toLowerCase()) ||
        tbl.commodity_types?.toLowerCase().includes(search.toLowerCase())
      
      const matchesAsrs = asrsFilter === "all" || tbl.asrs_type === asrsFilter
      const matchesProtection = protectionFilter === "all" || tbl.protection_scheme === protectionFilter
      
      return matchesSearch && matchesAsrs && matchesProtection
    })
  }, [tables, search, asrsFilter, protectionFilter])

  const getProtectionBadge = (scheme: string | null) => {
    switch (scheme?.toLowerCase()) {
      case 'wet':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Wet</Badge>
      case 'dry':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Dry</Badge>
      case 'ceiling-only':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ceiling-Only</Badge>
      case 'in-rack':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">In-Rack</Badge>
      case 'combined':
        return <Badge variant="default" className="bg-red-100 text-red-800">Combined</Badge>
      default:
        return scheme ? <Badge variant="outline">{scheme}</Badge> : <span className="text-muted-foreground">N/A</span>
    }
  }

  const formatHeightRange = (minFt: number | null, maxFt: number | null) => {
    if (!minFt && !maxFt) return 'N/A'
    if (minFt && maxFt) return `${minFt}-${maxFt} ft`
    if (minFt) return `${minFt}+ ft`
    if (maxFt) return `≤${maxFt} ft`
    return 'N/A'
  }

  const handleAction = async (action: string, table: FMGlobalTable) => {
    try {
      switch (action) {
        case 'delete':
          const result = await deleteFMGlobalTable(table.id)
          if (result.error) {
            toast.error(`Failed to delete table: ${result.error}`)
          } else {
            toast.success('Table deleted successfully')
          }
          break
        default:
          toast.info(`Action "${action}" not implemented yet`)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">FM Global Tables</h2>
          <p className="text-muted-foreground">
            Browse and manage FM Global 8-34 ASRS sprinkler design tables
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={asrsFilter} onValueChange={setAsrsFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="ASRS Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ASRS</SelectItem>
            {uniqueAsrsTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={protectionFilter} onValueChange={setProtectionFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Protection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Protection</SelectItem>
            {uniqueProtectionSchemes.map(scheme => (
              <SelectItem key={scheme} value={scheme}>{scheme}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Columns3 className="mr-2 h-4 w-4" />
              Columns
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COLUMNS.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={visibleColumns[column.id]}
                onCheckedChange={(value) =>
                  setVisibleColumns(prev => ({
                    ...prev,
                    [column.id]: !!value,
                  }))
                }
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.table_number && <TableHead>Table #</TableHead>}
              {visibleColumns.title && <TableHead>Title</TableHead>}
              {visibleColumns.asrs_type && <TableHead>ASRS Type</TableHead>}
              {visibleColumns.protection_scheme && <TableHead>Protection</TableHead>}
              {visibleColumns.commodity_types && <TableHead>Commodities</TableHead>}
              {visibleColumns.ceiling_height && <TableHead>Height Range</TableHead>}
              {visibleColumns.special_conditions && <TableHead>Conditions</TableHead>}
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Table2 className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No tables found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTables.map((table) => (
                <TableRow key={table.id}>
                  {visibleColumns.table_number && (
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Table2 className="h-4 w-4 text-muted-foreground" />
                        <span>{table.table_number || 'N/A'}</span>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.title && (
                    <TableCell className="max-w-[300px]">
                      <div className="truncate" title={table.title || ''}>
                        {table.title || 'Untitled'}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.asrs_type && (
                    <TableCell>
                      <Badge variant="secondary">{table.asrs_type || 'All'}</Badge>
                    </TableCell>
                  )}
                  {visibleColumns.protection_scheme && (
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        {getProtectionBadge(table.protection_scheme)}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.commodity_types && (
                    <TableCell className="max-w-[200px]">
                      <div className="flex items-center space-x-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div className="truncate" title={table.commodity_types || ''}>
                          {table.commodity_types || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.ceiling_height && (
                    <TableCell>
                      {formatHeightRange(table.ceiling_height_min_ft, table.ceiling_height_max_ft)}
                    </TableCell>
                  )}
                  {visibleColumns.special_conditions && (
                    <TableCell className="max-w-[200px]">
                      <div className="truncate" title={table.special_conditions || ''}>
                        {table.special_conditions || 'None'}
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <button
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                          onClick={() => handleAction('view', table)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </button>
                        <button
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                          onClick={() => handleAction('edit', table)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </button>
                        <button
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 flex items-center text-red-600"
                          onClick={() => handleAction('delete', table)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </button>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Showing {filteredTables.length} of {tables.length} tables
        </p>
      </div>
    </div>
  )
}