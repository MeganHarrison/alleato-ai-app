'use client'

import { useEffect, useState } from 'react'
import { StandardizedTable, TableColumn } from "@/components/tables/standardized-table"
import { getClients, updateClient, deleteClient, ClientWithCompany } from "@/app/actions/clients-actions"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

const columns: TableColumn<ClientWithCompany>[] = [
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
    id: "industry",
    label: "Industry",
    accessor: (item) => item.industry,
    defaultVisible: true,
    sortable: true,
    filterable: true,
    renderCell: (value) => value ? (
      <Badge variant="secondary">{value}</Badge>
    ) : <span className="text-muted-foreground">-</span>
  },
  {
    id: "status",
    label: "Status",
    accessor: (item) => item.status,
    defaultVisible: true,
    sortable: true,
    filterable: true,
    renderCell: (value) => {
      const variant = value === "active" ? "default" :
                      value === "inactive" ? "secondary" : "outline"
      return value ? (
        <Badge variant={variant}>{value}</Badge>
      ) : <span className="text-muted-foreground">-</span>
    }
  },
  {
    id: "city",
    label: "City",
    accessor: (item) => item.city,
    defaultVisible: false,
    sortable: true,
  },
  {
    id: "state",
    label: "State",
    accessor: (item) => item.state,
    defaultVisible: false,
    sortable: true,
  },
  {
    id: "website",
    label: "Website",
    accessor: (item) => item.website,
    defaultVisible: false,
    renderCell: (value) => value ? (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
        {new URL(value).hostname}
      </a>
    ) : <span className="text-muted-foreground">-</span>
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

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithCompany[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    setLoading(true)
    const data = await getClients()
    setClients(data)
    setLoading(false)
  }

  // Get unique industries and statuses for filter options
  const industries = Array.from(new Set(clients.map(c => c.industry).filter(Boolean)))
  const statuses = Array.from(new Set(clients.map(c => c.status).filter(Boolean)))

  const handleAdd = async (data: Partial<ClientWithCompany>) => {
    const supabase = createClient()

    const { error } = await supabase
      .from("clients")
      .insert([data])

    if (error) {
      throw new Error(error.message)
    }

    await loadClients()
  }

  const handleUpdate = async (id: string | number, data: Partial<ClientWithCompany>) => {
    const result = await updateClient(Number(id), data)
    if (result.error) {
      throw new Error(result.error)
    }
    await loadClients()
  }

  const handleDelete = async (id: string | number) => {
    const result = await deleteClient(Number(id))
    if (result.error) {
      throw new Error(result.error)
    }
    await loadClients()
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading clients...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <StandardizedTable
        data={clients}
        columns={columns}
        tableName="Client"
        primaryKey="id"
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onRefresh={loadClients}
        searchableFields={["name", "email", "phone", "city", "state"]}
        filterOptions={[
          {
            field: "industry",
            label: "Industry",
            options: industries.map(i => ({ value: i!, label: i! }))
          },
          {
            field: "status",
            label: "Status",
            options: statuses.map(s => ({ value: s!, label: s! }))
          }
        ]}
        emptyMessage="No clients found. Add your first client to get started."
      />
    </div>
  )
}