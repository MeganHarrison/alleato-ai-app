'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  FileText,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'

type DocumentMetadata = Database['public']['Tables']['document_metadata']['Row']

export default function MeetingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [meeting, setMeeting] = useState<DocumentMetadata | null>(null)
  const [transcript, setTranscript] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMeetingData()
  }, [params.id])

  const fetchMeetingData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch meeting metadata
      const { data: meetingData, error: meetingError } = await supabase
        .from('document_metadata')
        .select('*')
        .eq('id', params.id as string)
        .single()

      if (meetingError) throw meetingError

      setMeeting(meetingData)

      // If there's a URL, fetch the transcript
      if (meetingData?.url) {
        try {
          const response = await fetch(meetingData.url)
          if (response.ok) {
            const text = await response.text()
            setTranscript(text)
          } else {
            setTranscript('Unable to load transcript from the provided URL.')
          }
        } catch (fetchError) {
          console.error('Error fetching transcript:', fetchError)
          setTranscript('Error loading transcript. The document may not be accessible.')
        }
      } else if (meetingData?.content) {
        // Use content field if available
        setTranscript(meetingData.content)
      } else {
        setTranscript('No transcript available for this meeting.')
      }
    } catch (err: any) {
      console.error('Error fetching meeting:', err)
      setError(err.message || 'Failed to load meeting')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Date not available'
    try {
      return format(new Date(dateString), 'MMMM d, yyyy')
    } catch {
      return dateString
    }
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-semibold text-white mb-2">Meeting Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The requested meeting could not be found.'}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="px-12 py-8">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-6 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                {meeting.project_name || 'MEETING TRANSCRIPT'}
              </p>
              <h1 className="text-4xl font-light text-white mb-4">
                {meeting.title || 'Untitled Meeting'}
              </h1>
            </div>

            {/* Meeting Metadata */}
            <div className="flex flex-wrap gap-6 text-sm">
              {meeting.date && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  {formatDate(meeting.date)}
                </div>
              )}
              {meeting.duration_minutes && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="h-4 w-4 text-gray-500" />
                  {formatDuration(meeting.duration_minutes)}
                </div>
              )}
              {meeting.participants && Array.isArray(meeting.participants) && meeting.participants.length > 0 && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Users className="h-4 w-4 text-gray-500" />
                  {meeting.participants.length} Participants
                </div>
              )}
              {meeting.source && (
                <Badge variant="outline" className="text-gray-300">
                  {meeting.source}
                </Badge>
              )}
            </div>

            {/* External Links */}
            <div className="flex gap-4">
              {meeting.fireflies_link && (
                <a
                  href={meeting.fireflies_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  View in Fireflies
                </a>
              )}
              {meeting.url && (
                <a
                  href={meeting.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Original Document
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="px-12 py-10 space-y-10">
        {/* Summary Section */}
        {meeting.summary && (
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              SUMMARY
            </h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="text-gray-300 leading-relaxed">{meeting.summary}</p>
            </div>
          </div>
        )}

        {/* Action Items */}
        {meeting.action_items && Array.isArray(meeting.action_items) && meeting.action_items.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              ACTION ITEMS
            </h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <ul className="space-y-3">
                {meeting.action_items.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Key Topics */}
        {meeting.topics && Array.isArray(meeting.topics) && meeting.topics.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              KEY TOPICS
            </h2>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex flex-wrap gap-2">
                {meeting.topics.map((topic: string, idx: number) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="bg-gray-700 text-gray-300"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Transcript Section */}
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            TRANSCRIPT
          </h2>
          <ScrollArea className="h-[600px] bg-gray-800 rounded-lg">
            <div className="p-6">
              <pre className="text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
                {transcript}
              </pre>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}