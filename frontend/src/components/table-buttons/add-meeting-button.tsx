"use client"

import { useState, useEffect } from "react"
import { createMeeting } from "@/app/actions/meeting-actions"
import { getProjects } from "@/app/actions/project-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Clock, Tag, FileText, Briefcase, Hash } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { value: "planning", label: "Planning", color: "bg-blue-100 text-blue-700" },
  { value: "review", label: "Review", color: "bg-purple-100 text-purple-700" },
  { value: "standup", label: "Daily Standup", color: "bg-green-100 text-green-700" },
  { value: "retrospective", label: "Retrospective", color: "bg-orange-100 text-orange-700" },
  { value: "client", label: "Client Meeting", color: "bg-pink-100 text-pink-700" },
  { value: "brainstorming", label: "Brainstorming", color: "bg-yellow-100 text-yellow-700" },
  { value: "training", label: "Training", color: "bg-indigo-100 text-indigo-700" },
  { value: "other", label: "Other", color: "bg-gray-100 text-gray-700" },
]

export function AddMeetingButton() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 16),
    summary: "",
    duration_minutes: "60",
    category: "",
    project_id: "",
  })

  useEffect(() => {
    if (open) {
      loadProjects()
    }
  }, [open])

  const loadProjects = async () => {
    const { projects } = await getProjects()
    setProjects(projects || [])
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const newTag = tagInput.trim()
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag])
        setTagInput("")
      }
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const meetingData = {
      title: formData.title || null,
      date: formData.date,
      summary: formData.summary || null,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      tags: tags.length > 0 ? tags : [],
      category: formData.category || null,
      project_id: formData.project_id ? parseInt(formData.project_id) : null,
    }

    const { error } = await createMeeting(meetingData)

    if (error) {
      toast.error(`Failed to create meeting: ${error}`)
    } else {
      toast.success("Meeting created successfully")
      setOpen(false)
      // Reset form
      setFormData({
        title: "",
        date: new Date().toISOString().slice(0, 16),
        summary: "",
        duration_minutes: "60",
        category: "",
        project_id: "",
      })
      setTags([])
      setTagInput("")
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Create New Meeting</DialogTitle>
          <DialogDescription>
            Record a new meeting with details and summary.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Meeting Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Q4 Planning Session"
              className="w-full"
            />
          </div>

          {/* Date and Duration Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Date & Time
              </Label>
              <Input
                id="date"
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Duration (minutes)
              </Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                placeholder="60"
                min="1"
                className="w-full"
              />
            </div>
          </div>

          {/* Project and Category Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project" className="flex items-center gap-2 text-sm font-medium">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Project (Optional)
              </Label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => setFormData({ ...formData, project_id: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name || `Project ${project.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-2 text-sm font-medium">
                <Hash className="h-4 w-4 text-muted-foreground" />
                Category
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.label}>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", cat.color)}>
                          {cat.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags Input */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="flex items-center gap-2 text-sm font-medium">
              <Tag className="h-4 w-4 text-muted-foreground" />
              Tags
            </Label>
            <div className="space-y-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type tag and press Enter"
                className="w-full"
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="px-2 py-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <span className="ml-1.5 text-xs">×</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary Textarea */}
          <div className="space-y-2">
            <Label htmlFor="summary" className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Meeting Summary
            </Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Key points discussed, decisions made, action items..."
              rows={4}
              className="w-full resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>Creating...</>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Meeting
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}