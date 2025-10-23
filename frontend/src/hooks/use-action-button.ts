"use client"

import React from "react"

// Context to pass action button from page to layout
const ActionButtonContext = React.createContext<{
  setActionButton: (button: React.ReactNode) => void
} | null>(null)

export function useActionButton() {
  const context = React.useContext(ActionButtonContext)
  if (!context) {
    throw new Error('useActionButton must be used within TablesLayout')
  }
  return context
}

export { ActionButtonContext }