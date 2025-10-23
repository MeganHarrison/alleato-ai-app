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
} from '@/components/ui/dropdown-menu'
import { 
  Search,
  Filter,
  Download,
  Columns3,
  ChevronDown,
  FileText,
  Calendar,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  File,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateDocumentMetadata, deleteDocumentMetadata } from '@/app/actions/document-metadata-actions'
import { toast } from 'sonner'

export type DocumentMetadata = {
  id: number
  filename: string | null
  file_path: string | null
  file_type: string | null
  file_size: number | null
  upload_date: string | null
  processed_date: string | null
  status: string | null
  error_message: string | null
  chunk_count: number | null
  created_at: string
  updated_at: string | null
}

interface DocumentMetadataDataTableProps {
  documentMetadata: DocumentMetadata[]
}

const COLUMNS = [
  { id: "filename", label: "Filename", defaultVisible: true },
  { id: "file_type", label: "Type", defaultVisible: true },
  { id: "file_size", label: "Size", defaultVisible: true },
  { id: "status", label: "Status", defaultVisible: true },
  { id: "chunk_count", label: "Chunks", defaultVisible: true },
  { id: "upload_date", label: "Uploaded", defaultVisible: true },
  { id: "processed_date", label: "Processed", defaultVisible: false },
]

export function DocumentMetadataDataTable({ documentMetadata }: DocumentMetadataDataTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [visibleColumns, setVisibleColumns] = useState(
    COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: col.defaultVisible }), {})
  )

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = documentMetadata.map(doc => doc.status).filter(Boolean)
    return [...new Set(statuses)]
  }, [documentMetadata])

  const uniqueTypes = useMemo(() => {
    const types = documentMetadata.map(doc => doc.file_type).filter(Boolean)
    return [...new Set(types)]
  }, [documentMetadata])

  // Filter and search documents
  const filteredDocuments = useMemo(() => {
    return documentMetadata.filter(doc => {
      const matchesSearch = !search || 
        doc.filename?.toLowerCase().includes(search.toLowerCase()) ||
        doc.file_path?.toLowerCase().includes(search.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter
      const matchesType = typeFilter === "all" || doc.file_type === typeFilter
      
      return matchesSearch && matchesStatus && matchesType
    })
  }, [documentMetadata, search, statusFilter, typeFilter])

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'processed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Processed</Badge>
      case 'processing':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Processing</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>
    }
  }

  const handleAction = async (action: string, doc: DocumentMetadata) => {
    try {
      switch (action) {
        case 'delete':
          const result = await deleteDocumentMetadata(doc.id)
          if (result.error) {
            toast.error(`Failed to delete document: ${result.error}`)
          } else {
            toast.success('Document deleted successfully')
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
          <h2 className="text-2xl font-bold tracking-tight">Document Metadata</h2>
          <p className="text-muted-foreground">
            Manage document metadata and processing status
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
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {uniqueStatuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
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
              {visibleColumns.filename && <TableHead>Filename</TableHead>}
              {visibleColumns.file_type && <TableHead>Type</TableHead>}
              {visibleColumns.file_size && <TableHead>Size</TableHead>}
              {visibleColumns.status && <TableHead>Status</TableHead>}
              {visibleColumns.chunk_count && <TableHead>Chunks</TableHead>}
              {visibleColumns.upload_date && <TableHead>Uploaded</TableHead>}
              {visibleColumns.processed_date && <TableHead>Processed</TableHead>}
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No documents found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((doc) => (
                <TableRow key={doc.id}>
                  {visibleColumns.filename && (
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <span>{doc.filename || 'Unknown'}</span>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.file_type && (
                    <TableCell>
                      <Badge variant="outline">{doc.file_type || 'N/A'}</Badge>
                    </TableCell>
                  )}
                  {visibleColumns.file_size && (
                    <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                  )}
                  {visibleColumns.status && (
                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  )}
                  {visibleColumns.chunk_count && (
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span>{doc.chunk_count || 0}</span>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.upload_date && (
                    <TableCell>
                      {doc.upload_date ? format(new Date(doc.upload_date), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                  )}
                  {visibleColumns.processed_date && (
                    <TableCell>
                      {doc.processed_date ? format(new Date(doc.processed_date), 'MMM dd, yyyy') : 'N/A'}
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
                          onClick={() => handleAction('view', doc)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </button>
                        <button
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 flex items-center"
                          onClick={() => handleAction('edit', doc)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </button>
                        <button
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 flex items-center text-red-600"
                          onClick={() => handleAction('delete', doc)}
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
          Showing {filteredDocuments.length} of {documentMetadata.length} documents
        </p>
      </div>
    </div>
  )
}