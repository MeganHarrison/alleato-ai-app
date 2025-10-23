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

type Company = Database["public"]["Tables"]["companies"]["Row"]

interface CompanyDetailsSheetProps {
  company: Company
  trigger: React.ReactNode
}

export function CompanyDetailsSheet({ company, trigger }: CompanyDetailsSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="flex flex-col w-[400px] sm:w-[540px]">
        <SheetHeader className="gap-1">
          <SheetTitle>{company.name}</SheetTitle>
          <SheetDescription>
            {company.title || "Company Details"}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm">
          <div className="space-y-4">
            {/* Company Overview */}
            <div>
              <h3 className="font-semibold mb-2">Company Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span>{company.name}</span>
                </div>
                {company.website && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Website:</span>
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
                {company.title && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Title:</span>
                    <span>{company.title}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Location Information */}
            {(company.address || company.city || company.state) && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <div className="space-y-2">
                    {company.address && (
                      <div>
                        <span className="text-muted-foreground">Address:</span>
                        <p className="mt-1">{company.address}</p>
                      </div>
                    )}
                    {(company.city || company.state) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">City/State:</span>
                        <span>
                          {company.city}{company.city && company.state && ", "}{company.state}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Notes */}
            {company.notes && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm whitespace-pre-wrap">{company.notes}</p>
                </div>
                <Separator />
              </>
            )}

            {/* Timestamps */}
            <div>
              <h3 className="font-semibold mb-2">Timestamps</h3>
              <div className="space-y-2">
                {company.created_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{new Date(company.created_at).toLocaleDateString()}</span>
                  </div>
                )}
                {company.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated:</span>
                    <span>{new Date(company.updated_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Edit Form */}
            <form className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="name">Company Name</Label>
                <Input id="name" defaultValue={company.name} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="website">Website</Label>
                <Input id="website" type="url" defaultValue={company.website} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="title">Title</Label>
                <Input id="title" defaultValue={company.title || ""} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" defaultValue={company.city || ""} />
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" defaultValue={company.state || ""} />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="address">Address</Label>
                <Input id="address" defaultValue={company.address || ""} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  defaultValue={company.notes || ""} 
                  className="min-h-[100px]"
                />
              </div>
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