"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, FileText, Edit, Save, X } from "lucide-react"
import { format } from "date-fns"

export interface Document {
  id: string
  title: string | null
  content: string | null
  project: string | null
  date: string | null
  summary: string | null
  document_type: string | null
  metadata: any | null
  created_at: string | null
  updated_at: string | null
}

interface DocumentDetailsSheetProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
  onUpdate?: (id: string, updates: Partial<Document>) => Promise<void>
}

export function DocumentDetailsSheet({ 
  document, 
  isOpen, 
  onClose, 
  onUpdate 
}: DocumentDetailsSheetProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedDocument, setEditedDocument] = useState<Partial<Document>>({})

  if (!document) return null

  const handleEdit = () => {
    setIsEditing(true)
    setEditedDocument(document)
  }

  const handleSave = async () => {
    if (onUpdate && editedDocument) {
      await onUpdate(document.id, editedDocument)
      setIsEditing(false)
      setEditedDocument({})
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedDocument({})
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date"
    try {
      return format(new Date(dateString), "PPP")
    } catch {
      return dateString
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SheetTitle className="text-left">
                {isEditing ? (
                  <Input
                    value={editedDocument.title || ""}
                    onChange={(e) => 
                      setEditedDocument({ ...editedDocument, title: e.target.value })
                    }
                    className="text-lg font-semibold"
                    placeholder="Document title"
                  />
                ) : (
                  document.title || "Untitled Document"
                )}
              </SheetTitle>
              <SheetDescription className="text-left mt-1">
                Document details and metadata
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" variant="outline" onClick={handleSave}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={handleEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Metadata Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Metadata</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project" className="text-xs text-muted-foreground">
                  Project
                </Label>
                {isEditing ? (
                  <Input
                    id="project"
                    value={editedDocument.project || ""}
                    onChange={(e) => 
                      setEditedDocument({ ...editedDocument, project: e.target.value })
                    }
                    placeholder="Project name"
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm mt-1">{document.project || "No project"}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="type" className="text-xs text-muted-foreground">
                  Type
                </Label>
                {isEditing ? (
                  <Input
                    id="type"
                    value={editedDocument.document_type || ""}
                    onChange={(e) => 
                      setEditedDocument({ ...editedDocument, document_type: e.target.value })
                    }
                    placeholder="Document type"
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1">
                    {document.document_type ? (
                      <Badge variant="secondary">{document.document_type}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">No type</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="date" className="text-xs text-muted-foreground">
                Date
              </Label>
              {isEditing ? (
                <Input
                  id="date"
                  type="date"
                  value={editedDocument.date?.split('T')[0] || ""}
                  onChange={(e) => 
                    setEditedDocument({ ...editedDocument, date: e.target.value })
                  }
                  className="mt-1"
                />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatDate(document.date)}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Summary Section */}
          <div className="space-y-3">
            <Label htmlFor="summary" className="text-sm font-medium">
              Summary
            </Label>
            {isEditing ? (
              <Textarea
                id="summary"
                value={editedDocument.summary || ""}
                onChange={(e) => 
                  setEditedDocument({ ...editedDocument, summary: e.target.value })
                }
                placeholder="Document summary"
                rows={4}
                className="resize-none"
              />
            ) : (
              <div className="text-sm text-muted-foreground leading-relaxed">
                {document.summary || "No summary available"}
              </div>
            )}
          </div>

          <Separator />

          {/* Content Section */}
          <div className="space-y-3">
            <Label htmlFor="content" className="text-sm font-medium">
              Content
            </Label>
            {isEditing ? (
              <Textarea
                id="content"
                value={editedDocument.content || ""}
                onChange={(e) => 
                  setEditedDocument({ ...editedDocument, content: e.target.value })
                }
                placeholder="Document content"
                rows={8}
                className="resize-none font-mono text-xs"
              />
            ) : (
              <div className="text-xs font-mono bg-muted p-3 rounded-md max-h-64 overflow-y-auto">
                {document.content || "No content available"}
              </div>
            )}
          </div>

          <Separator />

          {/* System Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">System Information</h3>
            
            <div className="grid grid-cols-1 gap-3 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{formatDate(document.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated:</span>
                <span>{formatDate(document.updated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>ID:</span>
                <span className="font-mono">{document.id}</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}