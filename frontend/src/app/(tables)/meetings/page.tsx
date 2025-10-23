'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/utils/supabase-browser'
import { StandardizedTable, type TableColumn } from '@/components/tables/standardized-table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'

interface DocumentMetadata {
  id: string
  title: string | null
  date: string | null
  project: string | null
  project_id: number | null
  participants: string | null
  duration_minutes: number | null
  summary: string | null
  overview: string | null
  action_items: string | null
  bullet_points: string | null
  outline: string | null
  category: string | null
  type: string | null
  fireflies_link: string | null
  fireflies_id: string | null
  url: string | null
  created_at: string | null
  employee: string | null
  tags: string | null
  content: string | null
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<DocumentMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    loadMeetings()
  }, [])

  async function loadMeetings() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('document_metadata')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      setMeetings(data || [])
    } catch (error) {
      console.error('Error fetching meetings:', error)
      toast({
        title: "Error",
        description: "Failed to load meetings data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const columns: TableColumn<DocumentMetadata>[] = [
    {
      id: 'title',
      label: 'Title',
      accessor: (item) => item.title,
      sortable: true,
      renderCell: (value) => value || 'Untitled'
    },
    {
      id: 'date',
      label: 'Date',
      accessor: (item) => item.date,
      sortable: true,
      renderCell: (value) => value ? format(new Date(value), 'MMM dd, yyyy') : '-'
    },
    {
      id: 'project',
      label: 'Project',
      accessor: (item) => item.project,
      sortable: true,
      renderCell: (value) => value ? (
        <Badge variant="secondary">{value}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
    {
      id: 'participants',
      label: 'Participants',
      accessor: (item) => item.participants,
      renderCell: (value) => value || '-'
    },
    {
      id: 'duration_minutes',
      label: 'Duration',
      accessor: (item) => item.duration_minutes,
      sortable: true,
      renderCell: (value) => value ? `${value} min` : '-'
    },
    {
      id: 'type',
      label: 'Type',
      accessor: (item) => item.type || item.category,
      renderCell: (value) => value ? <Badge>{value}</Badge> : <Badge>Meeting</Badge>
    },
    {
      id: 'fireflies_link',
      label: 'Recording',
      accessor: (item) => item.fireflies_link,
      renderCell: (value) => value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          View
        </a>
      ) : '-'
    }
  ]

  async function handleUpdate(id: string, data: Partial<DocumentMetadata>) {
    try {
      const { error } = await supabase
        .from('document_metadata')
        .update(data)
        .eq('id', id)

      if (error) throw error

      await loadMeetings()
      toast({
        title: "Success",
        description: "Meeting updated successfully"
      })
      return { error: null }
    } catch (error) {
      console.error('Error updating meeting:', error)
      toast({
        title: "Error", 
        description: "Failed to update meeting",
        variant: "destructive"
      })
      return { error: error.message }
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('document_metadata')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadMeetings()
      toast({
        title: "Success",
        description: "Meeting deleted successfully"
      })
      return { error: null }
    } catch (error) {
      console.error('Error deleting meeting:', error)
      toast({
        title: "Error",
        description: "Failed to delete meeting",
        variant: "destructive"
      })
      return { error: error.message }
    }
  }

  return (
    <div className="mx-auto p-6">
      <StandardizedTable
        data={meetings}
        columns={columns}
        tableName="Meetings"
        primaryKey="id"
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onRefresh={loadMeetings}
        enableEdit={true}
        enableDelete={true}
        enableExport={true}
        emptyMessage="No meetings found. Your meeting documents will appear here once they are processed."
      />
    </div>
  )
}