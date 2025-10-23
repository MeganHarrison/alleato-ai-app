"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, RefreshCw, Users, AlertCircle, Check, X, CheckCircle2, AlertTriangle, XCircle, MinusCircle } from "lucide-react"
import { format } from "date-fns"
import { Database } from "@/types/database.types"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Project = Database["public"]["Tables"]["projects"]["Row"]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null)
  const [editValue, setEditValue] = useState<string>("")
  const [activeTab, setActiveTab] = useState("current")
  const { toast } = useToast()

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      setProjects(data || [])
      
      // Debug: Log unique phases to console
      if (data && data.length > 0) {
        const phases = data.map(p => p.phase || p.current_phase).filter(Boolean)
        const uniquePhases = [...new Set(phases)]
        console.log("Unique project phases:", uniquePhases)
      }
    } catch (err: any) {
      console.error("Error fetching projects:", err)
      setError(err.message || "Failed to fetch projects")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const getProjectsByTab = (tab: string) => {
    // Debug: Log all projects and their phases
    console.log(`Getting projects for tab: ${tab}`)
    console.log(`Total projects: ${projects.length}`)
    projects.forEach(p => {
      console.log(`Project: ${p.name}, phase: ${p.phase}, current_phase: ${p.current_phase}`)
    })

    let filtered = projects.filter(project => {
      const searchLower = searchTerm.toLowerCase()
      return (
        project.name?.toLowerCase().includes(searchLower) ||
        project.client?.toLowerCase().includes(searchLower) ||
        project["job number"]?.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.state?.toLowerCase().includes(searchLower)
      )
    })

    console.log(`Filtered projects after search: ${filtered.length}`)

    let result: Project[] = []
    switch (tab) {
      case 'all':
        result = filtered
        break
      case 'current':
        result = filtered.filter(p => {
          const phase = (p.phase || p.current_phase)?.toLowerCase()
          const isIncluded = !phase || ['current', 'active', 'development', 'construction', 'in progress', 'testing', 'building', 'execution'].includes(phase)
          console.log(`Current tab - Project: ${p.name}, phase: ${phase}, included: ${isIncluded}`)
          return isIncluded
        })
        break
      case 'planning':
        result = filtered.filter(p => {
          const phase = (p.phase || p.current_phase)?.toLowerCase()
          return phase && ['planning', 'design', 'proposal', 'quoting'].includes(phase)
        })
        break
      case 'completing':
        result = filtered.filter(p => {
          const phase = (p.phase || p.current_phase)?.toLowerCase()
          return phase && ['deployment', 'on hold', 'finishing', 'closing'].includes(phase)
        })
        break
      case 'loss':
        result = filtered.filter(p => {
          const phase = (p.phase || p.current_phase)?.toLowerCase()
          return phase && ['lost', 'cancelled', 'completed', 'closed', 'finished'].includes(phase)
        })
        break
      default:
        result = filtered
    }
    
    console.log(`Projects in ${tab} tab: ${result.length}`)
    return result
  }

  const getHealthStatusIcon = (status: string | null) => {
    const statusLower = status?.toLowerCase()
    switch(statusLower) {
      case 'good':
      case 'healthy':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Healthy'
        }
      case 'warning':
      case 'at risk':
      case 'needs attention':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: 'Needs Attention'
        }
      case 'critical':
      case 'unhealthy':
      case 'blocked':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Critical'
        }
      default:
        return {
          icon: MinusCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          label: 'Unknown'
        }
    }
  }

  const getPhaseColor = (phase: string | null) => {
    switch(phase?.toLowerCase()) {
      case 'planning':
        return 'bg-purple-500'
      case 'design':
        return 'bg-blue-500'
      case 'development':
      case 'construction':
      case 'in progress':
        return 'bg-indigo-500'
      case 'testing':
        return 'bg-cyan-500'
      case 'deployment':
        return 'bg-green-500'
      case 'on hold':
        return 'bg-yellow-500'
      case 'completed':
        return 'bg-gray-500'
      case 'lost':
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch {
      return dateString
    }
  }

  const startEdit = (id: number, field: string, currentValue: any) => {
    setEditingCell({ id, field })
    setEditValue(currentValue?.toString() || "")
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const saveEdit = async () => {
    if (!editingCell) return

    try {
      const { id, field } = editingCell
      let updateValue: any = editValue

      // Parse numeric fields
      if (['budget', 'est revenue', 'completion_percentage'].includes(field)) {
        updateValue = parseFloat(editValue) || 0
      }

      const { error } = await supabase
        .from("projects")
        .update({ [field]: updateValue || null })
        .eq("id", id)

      if (error) throw error

      // Update local state
      setProjects(prev => prev.map(p =>
        p.id === id ? { ...p, [field]: updateValue } : p
      ))

      toast({
        title: "Success",
        description: "Project updated successfully",
      })

      cancelEdit()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update project",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>Error: {error}</p>
            </div>
            <Button
              onClick={fetchProjects}
              className="mt-4"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search projects by name, client, job number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchProjects} variant="outline" className="ml-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all" className="text-orange-600">
            All ({projects.length})
          </TabsTrigger>
          <TabsTrigger value="current">
            Current ({getProjectsByTab('current').length})
          </TabsTrigger>
          <TabsTrigger value="planning">
            Planning ({getProjectsByTab('planning').length})
          </TabsTrigger>
          <TabsTrigger value="completing">
            Completing ({getProjectsByTab('completing').length})
          </TabsTrigger>
          <TabsTrigger value="loss">
            Loss ({getProjectsByTab('loss').length})
          </TabsTrigger>
        </TabsList>

        {['all', 'current', 'planning', 'completing', 'loss'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job #</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Est. Revenue</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Est. Completion</TableHead>
                  <TableHead>Team</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const tabProjects = getProjectsByTab(tab)
                  if (tabProjects.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? "No projects found matching your search" : `No ${tab} projects`}
                        </TableCell>
                      </TableRow>
                    )
                  }
                  return tabProjects.map((project) => {
                    const isEditing = (field: string) =>
                      editingCell?.id === project.id && editingCell?.field === field

                    const renderEditableCell = (field: string, value: any, formatter?: (val: any) => string) => {
                      if (isEditing(field)) {
                        return (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit()
                                if (e.key === 'Escape') cancelEdit()
                              }}
                              className="h-8 w-full"
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" onClick={saveEdit} className="h-8 w-8 p-0">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      }
                      return (
                        <div
                          onClick={() => startEdit(project.id, field, value)}
                          className="cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1"
                        >
                          {formatter ? formatter(value) : (value || '-')}
                        </div>
                      )
                    }

                    const renderSelectableCell = (field: string, value: string | null, options: string[], colorFn?: (val: string | null) => string) => {
                      if (isEditing(field)) {
                        return (
                          <div className="flex items-center gap-1">
                            <Select value={editValue} onValueChange={setEditValue}>
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {options.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="ghost" onClick={saveEdit} className="h-8 w-8 p-0">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      }
                      return (
                        <div
                          onClick={() => startEdit(project.id, field, value)}
                          className="cursor-pointer"
                        >
                          {value && (
                            <Badge className={colorFn ? colorFn(value) : undefined}>
                              {value}
                            </Badge>
                          )}
                        </div>
                      )
                    }

                    const renderHealthStatus = (value: string | null) => {
                      if (isEditing('health_status')) {
                        return (
                          <div className="flex items-center gap-1">
                            <Select value={editValue} onValueChange={setEditValue}>
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {['Good', 'Healthy', 'Warning', 'At Risk', 'Needs Attention', 'Critical', 'Unhealthy', 'Blocked'].map((option) => {
                                  const statusInfo = getHealthStatusIcon(option)
                                  const Icon = statusInfo.icon
                                  return (
                                    <SelectItem key={option} value={option}>
                                      <div className="flex items-center gap-2">
                                        <Icon className={`h-4 w-4 ${statusInfo.color}`} />
                                        <span>{option}</span>
                                      </div>
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="ghost" onClick={saveEdit} className="h-8 w-8 p-0">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      }

                      const statusInfo = getHealthStatusIcon(value)
                      const Icon = statusInfo.icon
                      return (
                        <div
                          onClick={() => startEdit(project.id, 'health_status', value)}
                          className="cursor-pointer flex items-center justify-center"
                          title={statusInfo.label}
                        >
                          <div className={`inline-flex items-center justify-center rounded-full p-2 ${statusInfo.bgColor}`}>
                            <Icon className={`h-5 w-5 ${statusInfo.color}`} />
                          </div>
                        </div>
                      )
                    }

                    return (
                      <TableRow key={project.id}>
                        <TableCell className="font-mono">
                          {renderEditableCell('job number', project["job number"])}
                        </TableCell>
                        <TableCell className="font-medium">
                          {renderEditableCell('name', project.name)}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell('client', project.client)}
                        </TableCell>
                        <TableCell>
                          {renderSelectableCell(
                            'phase',
                            project.phase || project.current_phase,
                            ['Planning', 'Design', 'Development', 'Construction', 'In Progress', 'Testing', 'Deployment', 'On Hold', 'Completed', 'Lost', 'Cancelled'],
                            getPhaseColor
                          )}
                        </TableCell>
                        <TableCell>
                          {renderHealthStatus(project.health_status)}
                        </TableCell>
                        <TableCell>
                          {isEditing('completion_percentage') ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit()
                                  if (e.key === 'Escape') cancelEdit()
                                }}
                                className="h-8 w-20"
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" onClick={saveEdit} className="h-8 w-8 p-0">
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 w-8 p-0">
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              onClick={() => startEdit(project.id, 'completion_percentage', project.completion_percentage)}
                              className="cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${project.completion_percentage || 0}%` }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {project.completion_percentage || 0}%
                                </span>
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell('budget', project.budget, formatCurrency)}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell('est revenue', project["est revenue"], formatCurrency)}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell('start date', project["start date"], formatDate)}
                        </TableCell>
                        <TableCell>
                          {renderEditableCell('est completion', project["est completion"], formatDate)}
                        </TableCell>
                        <TableCell>
                          {project.team_members && project.team_members.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span className="text-sm">{project.team_members.length}</span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                })()}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}