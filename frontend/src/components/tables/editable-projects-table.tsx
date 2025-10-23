"use client"

import { useState } from "react"
import { updateProjectField } from "@/app/actions/project-actions"
import { formatDate } from "@/utils/format"
import { Input } from "@/components/ui/input"

interface EditableProjectsTableProps {
  projects: unknown[]
}

export function EditableProjectsTable({ projects }: EditableProjectsTableProps) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null)
  const [tempValue, setTempValue] = useState<string>("")

  const handleCellClick = (rowId: string, field: string, value: unknown) => {
    if (field === "created_at") return // Don't allow editing created_at
    setEditingCell({ rowId, field })
    setTempValue(value || "")
  }

  const handleSave = async (rowId: string, field: string) => {
    try {
      await updateProjectField(rowId, field, tempValue || null)
      setEditingCell(null)
    } catch (error) {
      console.error("Failed to update:", error)
    }
  }

  const handleCancel = () => {
    setEditingCell(null)
    setTempValue("")
  }

  const handleKeyDown = (e: React.KeyboardEvent, rowId: string, field: string) => {
    if (e.key === "Enter") {
      handleSave(rowId, field)
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }


  const renderEditableCell = (project: unknown, field: string, value: unknown) => {
    const isEditing = editingCell?.rowId === project.id && editingCell?.field === field

    if (field === "created_at") {
      return <span>{value ? formatDate(value) : "—"}</span>
    }

    if (isEditing) {
      return (
        <Input
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, project.id, field)}
          onBlur={() => handleSave(project.id, field)}
          className="h-8"
          autoFocus
        />
      )
    }

    return (
      <span
        className="cursor-pointer hover:bg-muted px-2 py-1 rounded inline-block min-w-[50px]"
        onClick={() => handleCellClick(project.id, field, value)}
      >
        {value || "—"}
      </span>
    )
  }

  return (
    <div className="rounded-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 font-medium w-48">Project Name</th>
            <th className="text-left p-3 font-medium w-32">Description</th>
            <th className="text-left p-3 font-medium">Client</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-b hover:bg-muted/20">
              <td className="p-3 w-48">{renderEditableCell(project, "name", project.name)}</td>
              <td className="p-3 w-32">
                <div className="max-w-32 text-xs text-gray-600 truncate">
                  {renderEditableCell(project, "description", project.description)}
                </div>
              </td>
              <td className="p-3">{renderEditableCell(project, "client", project.client)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}