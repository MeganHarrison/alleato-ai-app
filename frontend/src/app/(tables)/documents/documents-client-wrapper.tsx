"use client"

import { useEffect } from "react"
import { EditableDocumentsTable } from "@/components/tables/editable-documents-table";
import { AddDocumentButton } from "@/components/table-buttons/add-document-button";
import { useActionButton } from "@/hooks/use-action-button";

interface DocumentsClientWrapperProps {
  documents: any[]
  error?: string
}

export function DocumentsClientWrapper({ documents, error }: DocumentsClientWrapperProps) {
  const { setActionButton } = useActionButton()

  useEffect(() => {
    setActionButton(<AddDocumentButton />)
    
    // Cleanup when component unmounts
    return () => setActionButton(null)
  }, [setActionButton])

  // Debug logging
  useEffect(() => {
    console.log('Documents loaded:', documents.length)
    if (documents.length > 0) {
      console.log('Sample document:', documents[0])
    }
  }, [documents])

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
        <h3 className="font-medium">Error loading documents</h3>
        <p className="text-sm mt-1">{error}</p>
        <p className="text-sm mt-2">
          Make sure the documents table exists in your Supabase database.
        </p>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
        <p className="text-sm text-gray-600 mb-4">
          Get started by adding your first document.
        </p>
        <AddDocumentButton />
      </div>
    )
  }

  return <EditableDocumentsTable documents={documents} />
}