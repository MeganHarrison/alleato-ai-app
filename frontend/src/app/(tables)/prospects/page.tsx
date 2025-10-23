'use client'

import { useEffect, useState } from 'react'
import { StandardizedTable, TableColumn } from "@/components/tables/standardized-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface Prospect {
  id: number
  full_name: string | null
  email: string | null
  phone: string | null
  company: string | null
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost'
  source: string | null
  estimated_value: number | null
  notes: string | null
  created_at: string
  updated_at: string | null
}

const columns: TableColumn<Prospect>[] = [
  {
    id: "full_name",
    label: "Name",
    accessor: (item) => item.full_name,
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
    accessor: (item) => item.company,
    defaultVisible: true,
    sortable: true,
    renderCell: (value) => value || <span className="text-muted-foreground">-</span>
  },
  {
    id: "status",
    label: "Status",
    accessor: (item) => item.status,
    defaultVisible: true,
    sortable: true,
    filterable: true,
    renderCell: (value) => {
      const statusColors = {
        'New': 'default',
        'Contacted': 'secondary',
        'Qualified': 'outline',
        'Proposal': 'default',
        'Negotiation': 'secondary',
        'Closed Won': 'default',
        'Closed Lost': 'destructive'
      }
      const variant = statusColors[value as keyof typeof statusColors] || 'outline'
      return (
        <Badge variant={variant as any}>{value}</Badge>
      )
    }
  },
  {
    id: "source",
    label: "Source",
    accessor: (item) => item.source,
    defaultVisible: false,
    sortable: true,
    filterable: true,
    renderCell: (value) => value ? (
      <Badge variant="outline">{value}</Badge>
    ) : <span className="text-muted-foreground">-</span>
  },
  {
    id: "estimated_value",
    label: "Est. Value",
    accessor: (item) => item.estimated_value,
    defaultVisible: true,
    sortable: true,
    renderCell: (value) => value ? (
      <span className="font-medium">${value.toLocaleString()}</span>
    ) : <span className="text-muted-foreground">-</span>
  },
  {
    id: "notes",
    label: "Notes",
    accessor: (item) => item.notes,
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

// Mock data for demonstration
const mockProspects: Prospect[] = [
  {
    id: 1,
    full_name: "John Smith",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    company: "Acme Inc",
    status: "New",
    source: "Website",
    estimated_value: 50000,
    notes: "Interested in enterprise plan",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: null
  },
  {
    id: 2,
    full_name: "Sarah Johnson",
    email: "sarah.j@techcorp.com",
    phone: "(555) 987-6543",
    company: "TechCorp",
    status: "Contacted",
    source: "Referral",
    estimated_value: 75000,
    notes: "Had initial call, scheduling demo",
    created_at: "2024-01-03T14:30:00Z",
    updated_at: "2024-01-05T09:00:00Z"
  },
  {
    id: 3,
    full_name: "Michael Brown",
    email: "m.brown@globalinc.com",
    phone: "(555) 456-7890",
    company: "Global Inc",
    status: "Qualified",
    source: "Trade Show",
    estimated_value: 120000,
    notes: "Large enterprise opportunity",
    created_at: "2024-01-05T09:15:00Z",
    updated_at: "2024-01-08T11:00:00Z"
  },
  {
    id: 4,
    full_name: "Emily Davis",
    email: "emily.d@innovate.co",
    phone: "(555) 234-5678",
    company: "Innovate Co",
    status: "Proposal",
    source: "Cold Outreach",
    estimated_value: 35000,
    notes: "Sent proposal, awaiting response",
    created_at: "2024-01-07T16:45:00Z",
    updated_at: "2024-01-10T14:00:00Z"
  },
  {
    id: 5,
    full_name: "Robert Wilson",
    email: "r.wilson@megacorp.org",
    phone: "(555) 876-5432",
    company: "MegaCorp",
    status: "Negotiation",
    source: "Partner Referral",
    estimated_value: 200000,
    notes: "In final negotiations",
    created_at: "2024-01-10T11:20:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  }
]

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProspects()
  }, [])

  const loadProspects = async () => {
    setLoading(true)
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))
    setProspects(mockProspects)
    setLoading(false)
  }

  // Get unique values for filter options
  const statuses = Array.from(new Set(prospects.map(p => p.status)))
  const sources = Array.from(new Set(prospects.map(p => p.source).filter(Boolean)))

  const handleAdd = async (data: Partial<Prospect>) => {
    // In a real app, this would call an API
    const newProspect: Prospect = {
      id: prospects.length + 1,
      full_name: data.full_name || null,
      email: data.email || null,
      phone: data.phone || null,
      company: data.company || null,
      status: data.status || 'New',
      source: data.source || null,
      estimated_value: data.estimated_value || null,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: null
    }
    setProspects([...prospects, newProspect])
  }

  const handleUpdate = async (id: string | number, data: Partial<Prospect>) => {
    // In a real app, this would call an API
    setProspects(prospects.map(p =>
      p.id === Number(id)
        ? { ...p, ...data, updated_at: new Date().toISOString() }
        : p
    ))
  }

  const handleDelete = async (id: string | number) => {
    // In a real app, this would call an API
    setProspects(prospects.filter(p => p.id !== Number(id)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading prospects...</div>
      </div>
    )
  }

  return (
    <StandardizedTable
      data={prospects}
      columns={columns}
      tableName="Prospect"
      primaryKey="id"
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onRefresh={loadProspects}
      searchableFields={["full_name", "email", "company", "notes"]}
      filterOptions={[
        {
          field: "status",
          label: "Status",
          options: statuses.map(s => ({ value: s, label: s }))
        },
        {
          field: "source",
          label: "Source",
          options: sources.map(s => ({ value: s!, label: s! }))
        }
      ]}
      emptyMessage="No prospects found. Add your first prospect to get started."
    />
  )
}