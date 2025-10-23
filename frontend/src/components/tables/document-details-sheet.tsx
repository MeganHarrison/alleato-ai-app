"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { Database } from "@/types/database.types"

type Document = Database["public"]["Tables"]["documents"]["Row"]

interface DocumentDetailsSheetProps {
  document: Document
  trigger: React.ReactNode
}

export function DocumentDetailsSheet({ document, trigger }: DocumentDetailsSheetProps) {
  const metadata = document.metadata as Record<string, any> || {}
  
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="flex flex-col w-[400px] sm:w-[540px]">
        <SheetHeader className="gap-1">
          <SheetTitle>Document #{document.id}</SheetTitle>
          <SheetDescription>
            {metadata.title || "Untitled Document"}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm">
          <div className="space-y-4">
            {/* Document Overview */}
            <div>
              <h3 className="font-semibold mb-2">Document Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <span>{document.id}</span>
                </div>
                {metadata.type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{metadata.type}</span>
                  </div>
                )}
                {metadata.size && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{metadata.size}</span>
                  </div>
                )}
                {metadata.created && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(metadata.created).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Content Preview */}
            {document.content && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Content Preview</h3>
                  <div className="bg-muted p-3 rounded-lg max-h-40 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">
                      {document.content.length > 500 
                        ? document.content.substring(0, 500) + "..." 
                        : document.content}
                    </p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Metadata */}
            {Object.keys(metadata).length > 0 && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Metadata</h3>
                  <div className="bg-muted p-3 rounded-lg">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(metadata, null, 2)}
                    </pre>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Edit Form */}
            <form className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  defaultValue={metadata.title || ""} 
                  placeholder="Document title"
                />
              </div>
              {document.content && (
                <div className="flex flex-col gap-3">
                  <Label htmlFor="content">Content</Label>
                  <Textarea 
                    id="content" 
                    defaultValue={document.content} 
                    className="min-h-[200px]"
                  />
                </div>
              )}
            </form>
          </div>
        </div>
        <SheetFooter className="mt-auto flex gap-2 sm:flex-col sm:space-x-0">
          <Button className="w-full">Save Changes</Button>
          <SheetClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}