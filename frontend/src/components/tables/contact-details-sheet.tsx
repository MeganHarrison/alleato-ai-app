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
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone 
} from "lucide-react"
import type { Database } from "@/types/database.types"

type Contact = Database["public"]["Tables"]["contacts"]["Row"]
type Company = Database["public"]["Tables"]["companies"]["Row"]

interface ContactWithCompany extends Contact {
  company?: Company | null
}

interface ContactDetailsSheetProps {
  contact: ContactWithCompany
  trigger: React.ReactNode
}

export function ContactDetailsSheet({ contact, trigger }: ContactDetailsSheetProps) {
  const fullName = `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || "Unnamed Contact"
  
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="flex flex-col w-[400px] sm:w-[540px]">
        <SheetHeader className="gap-1">
          <SheetTitle>{fullName}</SheetTitle>
          <SheetDescription>
            Contact Details
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4 text-sm">
          <div className="space-y-4">
            {/* Contact Information */}
            <div>
              <h3 className="font-semibold mb-2">Contact Information</h3>
              <div className="space-y-2">
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    <a 
                      href={`mailto:${contact.email}`}
                      className="text-blue-500 hover:underline"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-muted-foreground" />
                    <a 
                      href={`tel:${contact.phone}`}
                      className="text-blue-500 hover:underline"
                    >
                      {contact.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Company & Role */}
            <div>
              <h3 className="font-semibold mb-2">Professional Information</h3>
              <div className="space-y-2">
                {contact.company && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Company:</span>
                    <span>{contact.company.name}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />


            {/* Notes */}
            {contact.notes && (
              <>
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <div className="bg-muted p-2 rounded">
                    <p className="text-sm">{contact.notes}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Edit Form */}
            <form className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input 
                    id="first_name" 
                    defaultValue={contact.first_name || ""} 
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input 
                    id="last_name" 
                    defaultValue={contact.last_name || ""} 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue={contact.email || ""} 
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  defaultValue={contact.phone || ""} 
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