'use client'

import { useEffect, useState } from 'react'
import { StandardizedTable, TableColumn } from "@/components/tables/standardized-table"
import { getCompanies, Company } from "@/app/actions/companies-actions"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

const columns: TableColumn<Company>[] = [
  {
    id: "name",
    label: "Company Name",
    accessor: (item) => item.name,
    defaultVisible: true,
    sortable: true,
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
    id: "size",
    label: "Size",
    accessor: (item) => item.size,
    defaultVisible: true,
    sortable: true,
    filterable: true,
    renderCell: (value) => value ? (
      <Badge variant="outline">{value}</Badge>
    ) : <span className="text-muted-foreground">-</span>
  },
  {
    id: "location",
    label: "Location",
    accessor: (item) => item.location,
    defaultVisible: true,
    sortable: true,
  },
  {
    id: "contact_email",
    label: "Email",
    accessor: (item) => item.contact_email,
    defaultVisible: true,
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
    defaultVisible: false,
    renderCell: (value) => value ? (
      <a href={`tel:${value}`} className="text-blue-600 hover:underline">
        {value}
      </a>
    ) : <span className="text-muted-foreground">-</span>
  },
  {
    id: "website",
    label: "Website",
    accessor: (item) => item.website,
    defaultVisible: true,
    renderCell: (value) => value ? (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
        {new URL(value).hostname}
      </a>
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
                      value === "inactive" ? "secondary" :
                      value === "prospect" ? "outline" : "secondary"
      return value ? (
        <Badge variant={variant}>{value}</Badge>
      ) : <span className="text-muted-foreground">-</span>
    }
  },
  {
    id: "description",
    label: "Description",
    accessor: (item) => item.description,
    defaultVisible: false,
    renderCell: (value) => value ? (
      <span className="line-clamp-2 max-w-xs">{value}</span>
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

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    setLoading(true)
    const { companies: data } = await getCompanies()
    setCompanies(data)
    setLoading(false)
  }

  // Get unique values for filter options
  const industries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean)))
  const sizes = Array.from(new Set(companies.map(c => c.size).filter(Boolean)))
  const statuses = Array.from(new Set(companies.map(c => c.status).filter(Boolean)))

  const handleAdd = async (data: Partial<Company>) => {
    const supabase = createClient()

    const { error } = await supabase
      .from("companies")
      .insert([data])

    if (error) {
      throw new Error(error.message)
    }

    await loadCompanies()
  }

  const handleUpdate = async (id: string | number, data: Partial<Company>) => {
    const supabase = createClient()

    const { error } = await supabase
      .from("companies")
      .update(data)
      .eq("id", id)

    if (error) {
      throw new Error(error.message)
    }

    await loadCompanies()
  }

  const handleDelete = async (id: string | number) => {
    const supabase = createClient()

    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id)

    if (error) {
      throw new Error(error.message)
    }

    await loadCompanies()
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading companies...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <StandardizedTable
        data={companies}
        columns={columns}
        tableName="Company"
        primaryKey="id"
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onRefresh={loadCompanies}
        searchableFields={["name", "industry", "location", "description"]}
        filterOptions={[
          {
            field: "industry",
            label: "Industry",
            options: industries.map(i => ({ value: i!, label: i! }))
          },
          {
            field: "size",
            label: "Size",
            options: sizes.map(s => ({ value: s!, label: s! }))
          },
          {
            field: "status",
            label: "Status",
            options: statuses.map(s => ({ value: s!, label: s! }))
          }
        ]}
        emptyMessage="No companies found. Add your first company to get started."
      />
    </div>
  )
}