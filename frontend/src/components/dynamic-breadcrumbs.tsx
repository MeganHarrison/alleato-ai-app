"use client"

import React, { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

function formatSegment(segment: string): string {
  // Remove hyphens and capitalize each word
  return segment
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Check if a segment looks like a UUID
function isUUID(segment: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(segment)
}

export function DynamicBreadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const [meetingTitle, setMeetingTitle] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Check if we're on a meeting detail page and fetch meeting title
  useEffect(() => {
    const fetchMeetingTitle = async () => {
      // Check if this is a meeting detail page: /meetings/[uuid]
      if (segments.length >= 2 && segments[0] === 'meetings' && isUUID(segments[1])) {
        setLoading(true)
        try {
          const supabase = createClient()
          const { data: meeting, error } = await supabase
            .from('documents')
            .select('title')
            .eq('id', segments[1])
            .single()

          if (!error && meeting) {
            setMeetingTitle(meeting.title || 'Untitled Meeting')
          }
        } catch (error) {
          console.error('Error fetching meeting title:', error)
        } finally {
          setLoading(false)
        }
      } else {
        setMeetingTitle(null)
      }
    }

    fetchMeetingTitle()
  }, [pathname])

  if (segments.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Home</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/")
          const isLast = index === segments.length - 1
          let displayText = formatSegment(segment)

          // Use meeting title if this is a meeting UUID and we have the title
          if (isUUID(segment) && segments[index - 1] === 'meetings' && meetingTitle) {
            displayText = meetingTitle
          }

          return (
            <React.Fragment key={segment}>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>
                    {loading && isUUID(segment) && segments[index - 1] === 'meetings' 
                      ? 'Loading...' 
                      : displayText}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href} className="hidden md:block">
                    {displayText}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}