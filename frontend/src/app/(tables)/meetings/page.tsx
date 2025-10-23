'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StandardizedTable, type TableColumn } from '@/components/tables/standardized-table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import type { Database } from '@/types/database.types'

type DocumentMetadata = Database['public']['Tables']['document_metadata']['Row']

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<DocumentMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadMeetings()
  }, [])

  async function loadMeetings() {
    setIsLoading(true)
    try {
      console.log('Fetching meetings from document_metadata table...')
      
      const { data, error } = await supabase
        .from('document_metadata')
        .select('*')
        .or('type.eq.meeting,type.eq.Meeting,category.eq.meeting,category.eq.Meeting,type.is.null')
        .order('date', { ascending: false })

      console.log('Query result:', { data, error })
      
      if (error) throw error
      
      setMeetings(data || [])
      console.log(`Loaded ${data?.length || 0} meetings`)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading meetings...</div>
      </div>
    )
  }

  return (
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
  )
}