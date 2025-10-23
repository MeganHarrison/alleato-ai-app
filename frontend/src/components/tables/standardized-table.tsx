'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
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
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  Filter,
  Download,
  Columns3,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Plus,
  RefreshCw
} from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

export interface TableColumn<T> {
  id: string
  label: string
  accessor: (item: T) => any
  defaultVisible?: boolean
  sortable?: boolean
  filterable?: boolean
  renderCell?: (value: any, item: T) => React.ReactNode
  renderEditField?: (value: any, onChange: (value: any) => void) => React.ReactNode
  width?: string
}

export interface StandardizedTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  tableName: string
  primaryKey?: string
  onAdd?: (data: Partial<T>) => Promise<void>
  onUpdate?: (id: string | number, data: Partial<T>) => Promise<void>
  onDelete?: (id: string | number) => Promise<void>
  onRefresh?: () => Promise<void>
  searchableFields?: string[]
  filterOptions?: {
    field: string
    label: string
    options: { value: string; label: string }[]
  }[]
  enableAdd?: boolean
  enableEdit?: boolean
  enableDelete?: boolean
  enableExport?: boolean
  emptyMessage?: string
}

export function StandardizedTable<T extends Record<string, any>>({
  data: initialData,
  columns,
  tableName,
  primaryKey = 'id',
  onAdd,
  onUpdate,
  onDelete,
  onRefresh,
  searchableFields = [],
  filterOptions = [],
  enableAdd = true,
  enableEdit = true,
  enableDelete = true,
  enableExport = true,
  emptyMessage = 'No data available'
}: StandardizedTableProps<T>) {
  const [data, setData] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.filter(col => col.defaultVisible !== false).map(col => col.id))
  )
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [editData, setEditData] = useState<Partial<T>>({})
  const [isDeleting, setIsDeleting] = useState<string | number | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newItemData, setNewItemData] = useState<Partial<T>>({})
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data]

    // Apply search
    if (searchTerm && searchableFields.length > 0) {
      filtered = filtered.filter(item =>
        searchableFields.some(field => {
          const value = item[field]
          if (!value) return false
          return String(value).toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value && value !== 'all') {
        filtered = filtered.filter(item => String(item[field]) === value)
      }
    })

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]

        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [data, searchTerm, searchableFields, filters, sortConfig])

  const handleSort = (columnId: string) => {
    setSortConfig(current => {
      if (current?.key === columnId) {
        if (current.direction === 'asc') {
          return { key: columnId, direction: 'desc' }
        } else if (current.direction === 'desc') {
          return null
        }
      }
      return { key: columnId, direction: 'asc' }
    })
  }

  const handleEdit = (item: T) => {
    setEditingItem(item)
    setEditData(item)
  }

  const handleSaveEdit = async () => {
    if (!editingItem || !onUpdate) return

    try {
      setIsLoading(true)
      await onUpdate(editingItem[primaryKey], editData)

      // Update local state
      setData(current =>
        current.map(item =>
          item[primaryKey] === editingItem[primaryKey]
            ? { ...item, ...editData }
            : item
        )
      )

      setEditingItem(null)
      setEditData({})
      toast.success(`${tableName} updated successfully`)
    } catch (error) {
      toast.error(`Failed to update ${tableName}`)
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string | number) => {
    if (!onDelete) return

    try {
      setIsDeleting(id)
      await onDelete(id)

      // Update local state
      setData(current => current.filter(item => item[primaryKey] !== id))

      toast.success(`${tableName} deleted successfully`)
    } catch (error) {
      toast.error(`Failed to delete ${tableName}`)
      console.error(error)
    } finally {
      setIsDeleting(null)
    }
  }

  const handleAdd = async () => {
    if (!onAdd) return

    try {
      setIsLoading(true)
      await onAdd(newItemData)

      // Refresh data if refresh function is provided
      if (onRefresh) {
        const refreshedData = await onRefresh()
        if (refreshedData) {
          setData(refreshedData as T[])
        }
      }

      setIsAddDialogOpen(false)
      setNewItemData({})
      toast.success(`${tableName} added successfully`)
    } catch (error) {
      toast.error(`Failed to add ${tableName}`)
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = () => {
    const csv = [
      // Headers
      columns.filter(col => visibleColumns.has(col.id)).map(col => col.label).join(','),
      // Data rows
      ...processedData.map(item =>
        columns
          .filter(col => visibleColumns.has(col.id))
          .map(col => {
            const value = col.accessor(item)
            // Escape values containing commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value ?? ''
          })
          .join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tableName.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported successfully')
  }

  const handleRefresh = async () => {
    if (!onRefresh) return

    try {
      setIsLoading(true)
      const refreshedData = await onRefresh()
      if (refreshedData) {
        setData(refreshedData as T[])
        toast.success('Data refreshed successfully')
      }
    } catch (error) {
      toast.error('Failed to refresh data')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const renderColumnValue = (column: TableColumn<T>, item: T) => {
    const value = column.accessor(item)

    if (column.renderCell) {
      return column.renderCell(value, item)
    }

    // Default rendering for common types
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>
    }

    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      )
    }

    if (value instanceof Date) {
      return format(value, 'PP')
    }

    if (typeof value === 'object') {
      return <pre className="text-xs">{JSON.stringify(value, null, 2)}</pre>
    }

    return String(value)
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${tableName.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {/* Filters */}
          {filterOptions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filterOptions.map(filter => (
                  <div key={filter.field} className="p-2">
                    <Label className="text-xs">{filter.label}</Label>
                    <Select
                      value={filters[filter.field] || 'all'}
                      onValueChange={(value) =>
                        setFilters(prev => ({ ...prev, [filter.field]: value }))
                      }
                    >
                      <SelectTrigger className="h-8 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {filter.options.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="mr-2 h-4 w-4" />
                Columns
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map(column => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.has(column.id)}
                  onCheckedChange={(checked) => {
                    const newVisible = new Set(visibleColumns)
                    if (checked) {
                      newVisible.add(column.id)
                    } else {
                      newVisible.delete(column.id)
                    }
                    setVisibleColumns(newVisible)
                  }}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export */}
          {enableExport && (
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}

          {/* Refresh */}
          {onRefresh && (
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={cn(
                "mr-2 h-4 w-4",
                isLoading && "animate-spin"
              )} />
              Refresh
            </Button>
          )}

          {/* Add New */}
          {enableAdd && onAdd && (
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add {tableName}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns
                .filter(col => visibleColumns.has(col.id))
                .map(column => (
                  <TableHead
                    key={column.id}
                    className={cn(
                      column.sortable !== false && "cursor-pointer select-none",
                      column.width
                    )}
                    onClick={() => column.sortable !== false && handleSort(column.id)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable !== false && sortConfig?.key === column.id && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              {(enableEdit || enableDelete) && (
                <TableHead className="w-[100px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.filter(col => visibleColumns.has(col.id)).length + 1}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              processedData.map((item, index) => (
                <TableRow key={item[primaryKey] || index}>
                  {columns
                    .filter(col => visibleColumns.has(col.id))
                    .map(column => (
                      <TableCell key={column.id} className={column.width}>
                        {renderColumnValue(column, item)}
                      </TableCell>
                    ))}
                  {(enableEdit || enableDelete) && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {enableEdit && onUpdate && (
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {enableDelete && onDelete && (
                            <DropdownMenuItem
                              onClick={() => handleDelete(item[primaryKey])}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      {editingItem && (
        <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {tableName}</DialogTitle>
              <DialogDescription>
                Make changes to the {tableName.toLowerCase()} below
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {columns.map(column => {
                const value = editData[column.id as keyof T]

                return (
                  <div key={column.id} className="grid gap-2">
                    <Label>{column.label}</Label>
                    {column.renderEditField ? (
                      column.renderEditField(
                        value,
                        (newValue) => setEditData(prev => ({ ...prev, [column.id]: newValue }))
                      )
                    ) : typeof value === 'boolean' ? (
                      <Select
                        value={String(value)}
                        onValueChange={(v) =>
                          setEditData(prev => ({ ...prev, [column.id]: v === 'true' as any }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : typeof value === 'string' && value.length > 100 ? (
                      <Textarea
                        value={value}
                        onChange={(e) =>
                          setEditData(prev => ({ ...prev, [column.id]: e.target.value as any }))
                        }
                        rows={4}
                      />
                    ) : (
                      <Input
                        type={typeof value === 'number' ? 'number' : 'text'}
                        value={value ?? ''}
                        onChange={(e) =>
                          setEditData(prev => ({
                            ...prev,
                            [column.id]: typeof value === 'number'
                              ? Number(e.target.value)
                              : e.target.value as any
                          }))
                        }
                      />
                    )}
                  </div>
                )
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Dialog */}
      {isAddDialogOpen && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New {tableName}</DialogTitle>
              <DialogDescription>
                Fill in the details for the new {tableName.toLowerCase()}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {columns
                .filter(col => col.id !== primaryKey) // Don't show primary key field
                .map(column => {
                  const value = newItemData[column.id as keyof T]

                  return (
                    <div key={column.id} className="grid gap-2">
                      <Label>{column.label}</Label>
                      {column.renderEditField ? (
                        column.renderEditField(
                          value,
                          (newValue) =>
                            setNewItemData(prev => ({ ...prev, [column.id]: newValue }))
                        )
                      ) : typeof value === 'boolean' ? (
                        <Select
                          value={String(value ?? false)}
                          onValueChange={(v) =>
                            setNewItemData(prev => ({ ...prev, [column.id]: v === 'true' as any }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={typeof value === 'number' ? 'number' : 'text'}
                          value={value ?? ''}
                          onChange={(e) =>
                            setNewItemData(prev => ({
                              ...prev,
                              [column.id]: typeof value === 'number'
                                ? Number(e.target.value)
                                : e.target.value as any
                            }))
                          }
                          placeholder={`Enter ${column.label.toLowerCase()}`}
                        />
                      )}
                    </div>
                  )
                })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={isLoading}>
                {isLoading ? 'Adding...' : 'Add ' + tableName}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleting && (
        <Dialog open={!!isDeleting} onOpenChange={() => setIsDeleting(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this {tableName.toLowerCase()}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleting(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (isDeleting) handleDelete(isDeleting)
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}