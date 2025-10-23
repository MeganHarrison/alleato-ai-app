'use client'

import { useEffect, useState } from 'react'
import { StandardizedTable, TableColumn } from "@/components/tables/standardized-table"
import { getContacts } from "@/app/actions/contacts-actions"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface ContactWithCompany {
  id: number
  name: string | null
  email: string | null
  phone: string | null
  company_id: string | null
  created_at: string
  updated_at?: string | null
  company?: {
    id: string
    name: string | null
  } | null
}

const columns: TableColumn<ContactWithCompany>[] = [
  {
    id: "name",
    label: "Name",
    accessor: (item) => item.name,
    defaultVisible: true,
    sortable: true,
  },
  {
    id: "email",
    label: "Email",
    accessor: (item) => item.email,
    defaultVisible: true,
    sortable: true,
    renderCell: (value) => value ? (
      <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
        {value}
      </a>
    ) : <span className="text-muted-foreground">-</span>
  },
  {
    id: "phone",
    label: "Phone",
    accessor: (item) => item.phone,
    defaultVisible: true,
    sortable: true,
    renderCell: (value) => value ? (
      <a href={`tel:${value}`} className="text-blue-600 hover:underline">
        {value}
      </a>
    ) : <span className="text-muted-foreground">-</span>
  },
  {
    id: "company",
    label: "Company",
    accessor: (item) => item.company?.name,
    defaultVisible: true,
    sortable: true,
    renderCell: (value) => value || <span className="text-muted-foreground">-</span>
  },
  {
    id: "created_at",
    label: "Created",
    accessor: (item) => item.created_at,
    defaultVisible: true,
    sortable: true,
    renderCell: (value) => value ? format(new Date(value), "PP") : "-"
  }
]

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactWithCompany[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    setLoading(true)
    const data = await getContacts()
    setContacts(data)
    setLoading(false)
  }

  const handleAdd = async (data: Partial<ContactWithCompany>) => {
    const supabase = createClient()

    const { error } = await supabase
      .from("contacts")
      .insert([data])

    if (error) {
      throw new Error(error.message)
    }

    await loadContacts()
  }

  const handleUpdate = async (id: string | number, data: Partial<ContactWithCompany>) => {
    const supabase = createClient()

    const { error } = await supabase
      .from("contacts")
      .update(data)
      .eq("id", id)

    if (error) {
      throw new Error(error.message)
    }

    await loadContacts()
  }

  const handleDelete = async (id: string | number) => {
    const supabase = createClient()

    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id)

    if (error) {
      throw new Error(error.message)
    }

    await loadContacts()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading contacts...</div>
      </div>
    )
  }

  return (
    <StandardizedTable
      data={contacts}
      columns={columns}
      tableName="Contact"
      primaryKey="id"
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onRefresh={loadContacts}
      searchableFields={["name", "email", "phone"]}
      emptyMessage="No contacts found. Add your first contact to get started."
    />
  )
}