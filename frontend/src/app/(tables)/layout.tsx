"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { ActionButtonContext } from "@/hooks/use-action-button"
import { matchTableRoute } from "./table-route-config"

interface TablesLayoutHeaderProps {
  actionButton?: React.ReactNode
}

function TablesLayoutHeader({ actionButton }: TablesLayoutHeaderProps) {
  const pathname = usePathname()
  
  // Extract the main route from pathname (e.g., "/companies" from "/companies/upload")
  const matchedRoute = matchTableRoute(pathname)
  const config = matchedRoute ? matchedRoute[1] : null
  
  // Fallback for unknown routes
  if (!config) {
    const routeName = pathname.split('/').pop() || 'Data'
    const title = routeName.charAt(0).toUpperCase() + routeName.slice(1).replace(/-/g, ' ')
    return (
      <div className="flex items-start justify-between mb-8 pb-6">
        <PageHeader 
          title={title}
          description="Manage and view data in the system"
        />
        {actionButton && (
          <div className="flex-shrink-0 ml-6">
            {actionButton}
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="flex items-start justify-between pb-4 mb-6">
      <div className="flex-1">
        <PageHeader
          title={config.title}
          description={config.description}
        />
      </div>
      {actionButton && (
        <div className="flex-shrink-0 ml-6">
          {actionButton}
        </div>
      )}
    </div>
  )
}


export default function TablesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [actionButton, setActionButton] = React.useState<React.ReactNode>(null)

  return (
    <ActionButtonContext.Provider value={{ setActionButton }}>
      <div className="space-y-6">
        <TablesLayoutHeader actionButton={actionButton} />
        {children}
      </div>
    </ActionButtonContext.Provider>
  )
}