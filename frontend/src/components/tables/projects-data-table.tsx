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
  Calendar,
  DollarSign,
  Folder,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Briefcase
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateProject, deleteProject } from '@/app/actions/projects-actions'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

// Type definition based on projects table structure
export type Project = {
  id: number
  name: string
  description: string | null
  category: string | null
  phase: string | null
  budget: number | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

interface ProjectsDataTableProps {
  projects: Project[]
}

const COLUMNS = [
  { id: "name", label: "Project Name", defaultVisible: true },
  { id: "category", label: "Category", defaultVisible: true },
  { id: "phase", label: "Phase", defaultVisible: true },
  { id: "budget", label: "Budget", defaultVisible: true },
  { id: "dates", label: "Dates", defaultVisible: true },
  { id: "created", label: "Created", defaultVisible: true },
]

export function ProjectsDataTable({ projects: initialProjects }: ProjectsDataTableProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [phaseFilter, setPhaseFilter] = useState<string>('all')
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(COLUMNS.filter(col => col.defaultVisible).map(col => col.id))
  )
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editData, setEditData] = useState<Partial<Project>>({})
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  // Get unique categories and phases for filters
  const categories = useMemo(() => {
    const categorySet = new Set(projects.map(p => p.category).filter(Boolean))
    return ["all", ...Array.from(categorySet).sort()]
  }, [projects])

  const phases = useMemo(() => {
    const phaseSet = new Set(projects.map(p => p.phase).filter(Boolean))
    return ["all", ...Array.from(phaseSet).sort()]
  }, [projects])

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = 
        project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.category?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter
      const matchesPhase = phaseFilter === 'all' || project.phase === phaseFilter

      return matchesSearch && matchesCategory && matchesPhase
    })
  }, [projects, searchTerm, categoryFilter, phaseFilter])

  const getPhaseColor = (phase: string | null | undefined) => {
    switch (phase) {
      case 'planning': return 'outline'
      case 'active': return 'default'
      case 'completed': return 'secondary'
      case 'on_hold': return 'destructive'
      default: return 'secondary'
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return format(new Date(date), 'MMM dd, yyyy')
  }

  const handleEdit = async (projectId: number, data: Partial<Project>) => {
    try {
      const result = await updateProject(projectId, data)
      if (result.error) {
        toast.error('Failed to update project', {
          description: result.error
        })
      } else {
        toast.success('Project updated successfully')
        setProjects(projects.map(p => p.id === projectId ? { ...p, ...data } : p))
        setEditingProject(null)
      }
    } catch (error) {
      toast.error('Failed to update project')
    }
  }

  const handleDelete = async (projectId: number) => {
    setIsDeleting(projectId)
    try {
      const result = await deleteProject(projectId)
      if (result.error) {
        toast.error('Failed to delete project', {
          description: result.error
        })
      } else {
        toast.success('Project deleted successfully')
        setProjects(projects.filter(p => p.id !== projectId))
      }
    } catch (error) {
      toast.error('Failed to delete project')
    } finally {
      setIsDeleting(null)
    }
  }

  const exportToCSV = () => {
    const headers = COLUMNS.filter(col => visibleColumns.has(col.id)).map(col => col.label)
    const csvContent = [
      headers.join(','),
      ...filteredProjects.map(project => [
        `"${project.name}"`,
        `"${project.category || ''}"`,
        `"${project.phase || ''}"`,
        project.budget || '',
        `"${formatDate(project.start_date)} - ${formatDate(project.end_date)}"`,
        `"${formatDate(project.created_at)}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'projects.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Header with title and stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            Manage and track all your projects
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Briefcase className="h-4 w-4" />
          {filteredProjects.length} of {projects.length} projects
        </div>
      </div>

      {/* Filters and controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={phaseFilter} onValueChange={setPhaseFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Phase" />
            </SelectTrigger>
            <SelectContent>
              {phases.map(phase => (
                <SelectItem key={phase} value={phase}>
                  {phase === 'all' ? 'All Phases' : phase}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
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
              {COLUMNS.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={visibleColumns.has(column.id)}
                  onCheckedChange={(checked) => {
                    const newVisibleColumns = new Set(visibleColumns)
                    if (checked) {
                      newVisibleColumns.add(column.id)
                    } else {
                      newVisibleColumns.delete(column.id)
                    }
                    setVisibleColumns(newVisibleColumns)
                  }}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.has('name') && (
                <TableHead>Project</TableHead>
              )}
              {visibleColumns.has('category') && (
                <TableHead>Category</TableHead>
              )}
              {visibleColumns.has('phase') && (
                <TableHead>Phase</TableHead>
              )}
              {visibleColumns.has('budget') && (
                <TableHead>Budget</TableHead>
              )}
              {visibleColumns.has('dates') && (
                <TableHead>Timeline</TableHead>
              )}
              {visibleColumns.has('created') && (
                <TableHead>Created</TableHead>
              )}
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={COLUMNS.filter(col => visibleColumns.has(col.id)).length + 1} 
                  className="h-24 text-center"
                >
                  No projects found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project) => (
                <TableRow key={project.id}>
                  {visibleColumns.has('name') && (
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Folder className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{project.name}</div>
                          {project.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {project.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.has('category') && (
                    <TableCell>
                      {project.category ? (
                        <Badge variant="outline">
                          {project.category}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.has('phase') && (
                    <TableCell>
                      {project.phase ? (
                        <Badge variant={getPhaseColor(project.phase)}>
                          {project.phase}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.has('budget') && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">
                          {formatCurrency(project.budget)}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.has('dates') && (
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {formatDate(project.start_date)} → {formatDate(project.end_date)}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.has('created') && (
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(project.created_at)}
                    </TableCell>
                  )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <button
                          className="flex w-full items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                          onClick={() => {
                            setEditingProject(project)
                            setEditData(project)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </button>
                        <button
                          className="flex w-full items-center px-2 py-1.5 text-sm text-destructive hover:bg-accent rounded-sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this project?')) {
                              handleDelete(project.id)
                            }
                          }}
                          disabled={isDeleting === project.id}
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

      {/* Edit Dialog */}
      {editingProject && (
        <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Make changes to the project information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right font-medium">
                  Name
                </label>
                <Input
                  id="name"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right font-medium">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={editData.description || ''}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="col-span-3"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="category" className="text-right font-medium">
                  Category
                </label>
                <Input
                  id="category"
                  value={editData.category || ''}
                  onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="phase" className="text-right font-medium">
                  Phase
                </label>
                <Select
                  value={editData.phase || ''}
                  onValueChange={(value) => setEditData({ ...editData, phase: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="budget" className="text-right font-medium">
                  Budget
                </label>
                <Input
                  id="budget"
                  type="number"
                  value={editData.budget || ''}
                  onChange={(e) => setEditData({ ...editData, budget: Number(e.target.value) || null })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingProject(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleEdit(editingProject.id, editData)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}