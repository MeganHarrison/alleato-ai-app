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
  User,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Brain,
  Target,
  TrendingUp,
  AlertTriangle,
  Zap,
  Users,
  DollarSign,
  Calendar as CalendarIcon,
  MessageSquare,
  Settings,
  Lightbulb,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateAIInsight, deleteAIInsight, AIInsightWithProject } from '@/app/actions/ai-insights-actions'
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

interface AIInsightsDataTableProps {
  insights: AIInsightWithProject[]
}

const COLUMNS = [
  { id: "insight", label: "Insight", defaultVisible: true },
  { id: "type", label: "Type", defaultVisible: true },
  { id: "project", label: "Project", defaultVisible: true },
  { id: "severity", label: "Priority", defaultVisible: true },
  { id: "status", label: "Status", defaultVisible: true },
  { id: "assigned", label: "Assigned", defaultVisible: true },
  { id: "due", label: "Due Date", defaultVisible: true },
  { id: "created", label: "Created", defaultVisible: true },
]

const INSIGHT_TYPES = {
  action_item: { label: "Action Item", icon: Target, color: "bg-blue-100 text-blue-800 border-blue-200" },
  decision: { label: "Decision", icon: CheckCircle, color: "bg-green-100 text-green-800 border-green-200" },
  risk: { label: "Risk", icon: AlertTriangle, color: "bg-red-100 text-red-800 border-red-200" },
  milestone: { label: "Milestone", icon: TrendingUp, color: "bg-purple-100 text-purple-800 border-purple-200" },
  blocker: { label: "Blocker", icon: XCircle, color: "bg-red-100 text-red-800 border-red-200" },
  dependency: { label: "Dependency", icon: Users, color: "bg-orange-100 text-orange-800 border-orange-200" },
  budget_update: { label: "Budget Update", icon: DollarSign, color: "bg-green-100 text-green-800 border-green-200" },
  timeline_change: { label: "Timeline Change", icon: CalendarIcon, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  stakeholder_feedback: { label: "Stakeholder Feedback", icon: MessageSquare, color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  technical_issue: { label: "Technical Issue", icon: Settings, color: "bg-gray-100 text-gray-800 border-gray-200" },
  opportunity: { label: "Opportunity", icon: Lightbulb, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  concern: { label: "Concern", icon: HelpCircle, color: "bg-amber-100 text-amber-800 border-amber-200" }
}

export function AIInsightsDataTable({ insights: initialInsights }: AIInsightsDataTableProps) {
  const [insights, setInsights] = useState(initialInsights)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [resolvedFilter, setResolvedFilter] = useState<string>('all')
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(COLUMNS.filter(col => col.defaultVisible).map(col => col.id))
  )
  const [editingInsight, setEditingInsight] = useState<AIInsightWithProject | null>(null)
  const [editData, setEditData] = useState<Partial<AIInsightWithProject>>({})
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  // Get unique types for filter
  const types = useMemo(() => {
    const typeSet = new Set(insights.map(i => i.insight_type).filter(Boolean))
    return ["all", ...Array.from(typeSet).sort()]
  }, [insights])

  // Filter insights
  const filteredInsights = useMemo(() => {
    return insights.filter(insight => {
      const matchesSearch = 
        insight.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insight.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insight.project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insight.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesType = typeFilter === 'all' || insight.insight_type === typeFilter
      const matchesSeverity = severityFilter === 'all' || insight.severity === severityFilter
      const matchesStatus = statusFilter === 'all' || insight.status === statusFilter
      const matchesResolved = resolvedFilter === 'all' || 
        (resolvedFilter === 'resolved' && insight.resolved) ||
        (resolvedFilter === 'unresolved' && !insight.resolved)

      return matchesSearch && matchesType && matchesSeverity && matchesStatus && matchesResolved
    })
  }, [insights, searchTerm, typeFilter, severityFilter, statusFilter, resolvedFilter])

  const getSeverityColor = (severity: string | null | undefined) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_progress': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getInsightTypeInfo = (type: string) => {
    return INSIGHT_TYPES[type as keyof typeof INSIGHT_TYPES] || {
      label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: Brain,
      color: "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleEdit = (insight: AIInsightWithProject) => {
    setEditingInsight(insight)
    setEditData({
      title: insight.title,
      description: insight.description,
      severity: insight.severity,
      status: insight.status,
      assigned_to: insight.assigned_to,
      due_date: insight.due_date,
      resolved: insight.resolved,
    })
  }

  const handleSave = async () => {
    if (!editingInsight) return

    const { data, error } = await updateAIInsight(editingInsight.id, editData)
    if (data) {
      setInsights(prev => prev.map(i => i.id === editingInsight.id ? { ...i, ...editData } : i))
      toast.success("AI Insight updated successfully")
      setEditingInsight(null)
      setEditData({})
    } else {
      toast.error(`Failed to update AI insight: ${error}`)
    }
  }

  const handleDelete = async (id: number) => {
    setIsDeleting(id)
    const { error } = await deleteAIInsight(id)
    if (!error) {
      setInsights(prev => prev.filter(i => i.id !== id))
      toast.success("AI Insight deleted successfully")
    } else {
      toast.error(`Failed to delete AI insight: ${error}`)
    }
    setIsDeleting(null)
  }

  const exportToCSV = () => {
    const headers = ['Title', 'Type', 'Description', 'Severity', 'Status', 'Project', 'Assigned To', 'Due Date', 'Created']
    const rows = filteredInsights.map(i => [
      i.title || '',
      i.insight_type || '',
      i.description || '',
      i.severity || '',
      i.status || '',
      i.project?.name || i.project_name || '',
      i.assigned_to || i.assignee || '',
      i.due_date ? format(new Date(i.due_date), 'yyyy-MM-dd') : '',
      format(new Date(i.created_at), 'yyyy-MM-dd')
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-insights-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search insights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <Brain className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.slice(1).map(type => (
                <SelectItem key={type} value={type}>
                  {getInsightTypeInfo(type).label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[150px]">
              <AlertCircle className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={resolvedFilter} onValueChange={setResolvedFilter}>
            <SelectTrigger className="w-[150px]">
              <CheckCircle className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Resolution" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
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
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.has('insight') && <TableHead>Insight</TableHead>}
                {visibleColumns.has('type') && <TableHead>Type</TableHead>}
                {visibleColumns.has('project') && <TableHead>Project</TableHead>}
                {visibleColumns.has('severity') && <TableHead>Priority</TableHead>}
                {visibleColumns.has('status') && <TableHead>Status</TableHead>}
                {visibleColumns.has('assigned') && <TableHead>Assigned</TableHead>}
                {visibleColumns.has('due') && <TableHead>Due Date</TableHead>}
                {visibleColumns.has('created') && <TableHead>Created</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInsights.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No AI insights found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInsights.map((insight) => {
                  const typeInfo = getInsightTypeInfo(insight.insight_type)
                  const TypeIcon = typeInfo.icon
                  
                  return (
                    <TableRow key={insight.id} className="cursor-pointer hover:bg-muted/50">
                      {visibleColumns.has('insight') && (
                        <TableCell>
                          <div className="space-y-1 max-w-md">
                            <div className="font-medium text-sm">
                              {insight.title || 'Untitled Insight'}
                            </div>
                            {insight.description && (
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                {insight.description.length > 100 
                                  ? `${insight.description.substring(0, 100)}...`
                                  : insight.description
                                }
                              </div>
                            )}
                            {insight.confidence_score && (
                              <div className="text-xs text-muted-foreground">
                                Confidence: {Math.round(insight.confidence_score * 100)}%
                              </div>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.has('type') && (
                        <TableCell>
                          <Badge variant="outline" className={cn("font-normal", typeInfo.color)}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.has('project') && (
                        <TableCell>
                          {(insight.project?.name || insight.project_name) && (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {insight.project?.name || insight.project_name}
                              </span>
                            </div>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.has('severity') && (
                        <TableCell>
                          <Badge variant="outline" className={cn("font-normal", getSeverityColor(insight.severity))}>
                            {insight.severity?.toUpperCase() || 'UNKNOWN'}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.has('status') && (
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline" className={cn("font-normal", getStatusColor(insight.status))}>
                              {insight.status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'}
                            </Badge>
                            {insight.resolved && (
                              <div className="text-xs text-green-600">✓ Resolved</div>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.has('assigned') && (
                        <TableCell>
                          {(insight.assigned_to || insight.assignee) && (
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {insight.assigned_to || insight.assignee}
                              </span>
                            </div>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.has('due') && (
                        <TableCell>
                          {insight.due_date && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {format(new Date(insight.due_date), 'MMM d, yyyy')}
                            </div>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.has('created') && (
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(insight.created_at), 'MMM d, yyyy')}
                          </div>
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
                              onClick={() => handleEdit(insight)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-destructive"
                              onClick={() => handleDelete(insight.id)}
                              disabled={isDeleting === insight.id}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingInsight} onOpenChange={() => setEditingInsight(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit AI Insight</DialogTitle>
            <DialogDescription>
              Make changes to the AI insight information below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={editData.severity || 'medium'}
                  onValueChange={(value) => setEditData({ ...editData, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={editData.status || 'open'}
                  onValueChange={(value) => setEditData({ ...editData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Assigned To</label>
                <Input
                  value={editData.assigned_to || ''}
                  onChange={(e) => setEditData({ ...editData, assigned_to: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={editData.due_date ? editData.due_date.split('T')[0] : ''}
                  onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={editData.resolved || false}
                onChange={(e) => setEditData({ ...editData, resolved: e.target.checked })}
                className="rounded border-input"
              />
              <label className="text-sm font-medium">Mark as resolved</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingInsight(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}