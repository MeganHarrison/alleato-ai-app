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
  Tag,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  Presentation,
  Upload,
  Link,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Type definition based on typical document structure
export type Document = {
  id: number
  title?: string | null
  content?: string | null
  document_type?: string | null
  metadata?: unknown | null
  embedding?: string | null
  created_at?: string
  updated_at?: string
  file_path?: string | null
  file_size?: number | null
  mime_type?: string | null
  tags?: string[] | null
  source?: string | null
  author?: string | null
  project_id?: number | null
  meeting_id?: string | null
}

interface DocumentsDataTableProps {
  documents: Document[]
}

const COLUMNS = [
  { id: "title", label: "Document", defaultVisible: true },
  { id: "type", label: "Type", defaultVisible: true },
  { id: "source", label: "Source", defaultVisible: true },
  { id: "author", label: "Author", defaultVisible: true },
  { id: "size", label: "Size", defaultVisible: true },
  { id: "tags", label: "Tags", defaultVisible: true },
  { id: "created", label: "Created", defaultVisible: true },
]

const getFileIcon = (mimeType: string | null | undefined, documentType: string | null | undefined) => {
  if (mimeType) {
    if (mimeType.includes('image')) return <FileImage className="h-4 w-4" />
    if (mimeType.includes('video')) return <FileVideo className="h-4 w-4" />
    if (mimeType.includes('audio')) return <FileAudio className="h-4 w-4" />
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <Presentation className="h-4 w-4" />
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />
  }
  
  if (documentType) {
    switch (documentType.toLowerCase()) {
      case 'meeting': return <FileText className="h-4 w-4" />
      case 'transcript': return <FileText className="h-4 w-4" />
      case 'report': return <FileText className="h-4 w-4" />
      case 'presentation': return <Presentation className="h-4 w-4" />
      case 'spreadsheet': return <FileSpreadsheet className="h-4 w-4" />
      default: return <File className="h-4 w-4" />
    }
  }
  
  return <File className="h-4 w-4" />
}

const formatFileSize = (bytes: number | null | undefined) => {
  if (!bytes) return '-'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
}

const getDocumentTypeColor = (type: string | null | undefined) => {
  switch (type?.toLowerCase()) {
    case 'meeting': return 'default'
    case 'transcript': return 'secondary'
    case 'report': return 'outline'
    case 'presentation': return 'default'
    case 'spreadsheet': return 'secondary'
    default: return 'secondary'
  }
}

export function DocumentsDataTable({ documents: initialDocuments }: DocumentsDataTableProps) {
  const [documents] = useState(initialDocuments)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(COLUMNS.filter(col => col.defaultVisible).map(col => col.id))
  )

  // Get unique types and sources for filters
  const documentTypes = useMemo(() => {
    const typeSet = new Set(documents.map(d => d.document_type).filter((type): type is string => Boolean(type)))
    return ["all", ...Array.from(typeSet).sort()]
  }, [documents])

  const sources = useMemo(() => {
    const sourceSet = new Set(documents.map(d => d.source).filter((source): source is string => Boolean(source)))
    return ["all", ...Array.from(sourceSet).sort()]
  }, [documents])

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(document => {
      const matchesSearch = 
        document.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        document.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        document.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        document.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesType = typeFilter === 'all' || document.document_type === typeFilter
      const matchesSource = sourceFilter === 'all' || document.source === sourceFilter

      return matchesSearch && matchesType && matchesSource
    })
  }, [documents, searchTerm, typeFilter, sourceFilter])

  const exportToCSV = () => {
    const headers = ['Title', 'Type', 'Source', 'Author', 'Size', 'Created']
    const rows = filteredDocuments.map(d => [
      d.title || '',
      d.document_type || '',
      d.source || '',
      d.author || '',
      formatFileSize(d.file_size),
      d.created_at ? format(new Date(d.created_at), 'yyyy-MM-dd') : ''
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `documents-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  const handleView = (document: Document) => {
    if (document.file_path) {
      // Open file in new tab if it has a path
      window.open(document.file_path, '_blank')
    } else if (document.content) {
      // Show content in a modal or new page
      toast.info('Document preview not yet implemented')
    } else {
      toast.error('No content available for this document')
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
          <p className="text-muted-foreground">
            Browse and manage your document library
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {documentTypes.slice(1).map(type => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[200px]">
            <Database className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {sources.slice(1).map(source => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns3 className="h-4 w-4 mr-2" />
              Columns
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COLUMNS.map(column => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={visibleColumns.has(column.id)}
                onCheckedChange={(checked) => {
                  const newColumns = new Set(visibleColumns)
                  if (checked) {
                    newColumns.add(column.id)
                  } else {
                    newColumns.delete(column.id)
                  }
                  setVisibleColumns(newColumns)
                }}
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.has('title') && <TableHead>Document</TableHead>}
              {visibleColumns.has('type') && <TableHead>Type</TableHead>}
              {visibleColumns.has('source') && <TableHead>Source</TableHead>}
              {visibleColumns.has('author') && <TableHead>Author</TableHead>}
              {visibleColumns.has('size') && <TableHead>Size</TableHead>}
              {visibleColumns.has('tags') && <TableHead>Tags</TableHead>}
              {visibleColumns.has('created') && <TableHead>Created</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No documents found
                </TableCell>
              </TableRow>
            ) : (
              filteredDocuments.map((document) => (
                <TableRow key={document.id} className="cursor-pointer hover:bg-muted/50">
                  {visibleColumns.has('title') && (
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">
                          {getFileIcon(document.mime_type, document.document_type)}
                        </div>
                        <div>
                          <div className="font-medium">
                            {document.title || 'Untitled Document'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {document.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.has('type') && (
                    <TableCell>
                      {document.document_type && (
                        <Badge variant={getDocumentTypeColor(document.document_type)}>
                          {document.document_type}
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.has('source') && (
                    <TableCell>
                      {document.source && (
                        <div className="flex items-center gap-2 text-sm">
                          <Database className="h-3 w-3 text-muted-foreground" />
                          {document.source}
                        </div>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.has('author') && (
                    <TableCell>
                      <div className="text-sm">{document.author || '-'}</div>
                    </TableCell>
                  )}
                  {visibleColumns.has('size') && (
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(document.file_size)}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.has('tags') && (
                    <TableCell>
                      {document.tags && document.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {document.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              <Tag className="h-2 w-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {document.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{document.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.has('created') && (
                    <TableCell>
                      {document.created_at && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(document.created_at), 'MMM d, yyyy')}
                        </div>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleView(document)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        {document.file_path && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => {
                              const link = window.document.createElement('a')
                              link.href = document.file_path!
                              link.download = document.title || 'document'
                              link.click()
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                        {document.file_path && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => {
                              navigator.clipboard.writeText(document.file_path!)
                              toast.success('Link copied to clipboard')
                            }}
                          >
                            <Link className="h-4 w-4 mr-2" />
                            Copy Link
                          </Button>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}