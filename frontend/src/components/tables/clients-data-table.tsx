'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search,
  Filter,
  Download,
  Columns3,
  ChevronDown,
  Mail,
  Phone,
  Building2,
  Calendar,
  MapPin,
  Globe,
  User,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Building,
  Briefcase
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { updateClient, deleteClient, ClientWithCompany } from '@/app/actions/clients-actions'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface ClientsDataTableProps {
  clients: ClientWithCompany[]
}

const COLUMNS = [
  { id: "name", label: "Client", defaultVisible: true },
  { id: "contact", label: "Contact", defaultVisible: true },
  { id: "company", label: "Company", defaultVisible: true },
  { id: "location", label: "Location", defaultVisible: true },
  { id: "industry", label: "Industry", defaultVisible: true },
  { id: "status", label: "Status", defaultVisible: true },
  { id: "created", label: "Created", defaultVisible: true },
]

export function ClientsDataTable({ clients: initialClients }: ClientsDataTableProps) {
  const [clients, setClients] = useState(initialClients)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(COLUMNS.filter(col => col.defaultVisible).map(col => col.id))
  )
  const [editingClient, setEditingClient] = useState<ClientWithCompany | null>(null)
  const [editData, setEditData] = useState<Partial<ClientWithCompany>>({})
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  // Get unique industries for filter
  const industries = useMemo(() => {
    const industrySet = new Set(clients.map(c => c.industry).filter(Boolean))
    return ["all", ...Array.from(industrySet).sort()]
  }, [clients])

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = 
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.city?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter
      const matchesIndustry = industryFilter === 'all' || client.industry === industryFilter

      return matchesSearch && matchesStatus && matchesIndustry
    })
  }, [clients, searchTerm, statusFilter, industryFilter])

  const getInitials = (name: string | null) => {
    if (!name) return '??'
    const parts = name.split(' ')
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2)
  }

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'prospect': return 'outline'
      default: return 'secondary'
    }
  }

  const handleEdit = (client: ClientWithCompany) => {
    setEditingClient(client)
    setEditData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      city: client.city,
      state: client.state,
      zip: client.zip,
      website: client.website,
      industry: client.industry,
      status: client.status,
    })
  }

  const handleSave = async () => {
    if (!editingClient) return

    const { data, error } = await updateClient(editingClient.id, editData)
    if (data) {
      setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...editData } : c))
      toast.success("Client updated successfully")
      setEditingClient(null)
      setEditData({})
    } else {
      toast.error(`Failed to update client: ${error}`)
    }
  }

  const handleDelete = async (id: number) => {
    setIsDeleting(id)
    const { error } = await deleteClient(id)
    if (!error) {
      setClients(prev => prev.filter(c => c.id !== id))
      toast.success("Client deleted successfully")
    } else {
      toast.error(`Failed to delete client: ${error}`)
    }
    setIsDeleting(null)
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'City', 'State', 'Industry', 'Status']
    const rows = filteredClients.map(c => [
      c.name || '',
      c.email || '',
      c.phone || '',
      c.company?.name || '',
      c.city || '',
      c.state || '',
      c.industry || '',
      c.status || ''
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clients-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="prospect">Prospect</SelectItem>
            </SelectContent>
          </Select>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-[200px]">
              <Briefcase className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.slice(1).filter(industry => industry).map(industry => (
                <SelectItem key={industry} value={industry!}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Columns3 className="h-4 w-4 mr-2" />
                Columns
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {COLUMNS.map(column => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.has(column.id)}
                  onCheckedChange={(checked) => {
                    const newColumns = new Set(visibleColumns)
                    if (checked) {
                      newColumns.add(column.id)
                    } else {
                      newColumns.delete(column.id)
                    }
                    setVisibleColumns(newColumns)
                  }}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.has('name') && <TableHead>Client</TableHead>}
                {visibleColumns.has('contact') && <TableHead>Contact</TableHead>}
                {visibleColumns.has('company') && <TableHead>Company</TableHead>}
                {visibleColumns.has('location') && <TableHead>Location</TableHead>}
                {visibleColumns.has('industry') && <TableHead>Industry</TableHead>}
                {visibleColumns.has('status') && <TableHead>Status</TableHead>}
                {visibleColumns.has('created') && <TableHead>Created</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No clients found
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                    {visibleColumns.has('name') && (
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(client.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{client.name || 'Unnamed'}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {client.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.has('contact') && (
                      <TableCell>
                        <div className="space-y-1">
                          {client.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <a href={`mailto:${client.email}`} className="hover:underline">
                                {client.email}
                              </a>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <a href={`tel:${client.phone}`} className="hover:underline">
                                {client.phone}
                              </a>
                            </div>
                          )}
                          {client.website && (
                            <div className="flex items-center gap-2 text-sm">
                              <Globe className="h-3 w-3 text-muted-foreground" />
                              <a href={client.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                Website
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.has('company') && (
                      <TableCell>
                        {client.company && (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{client.company.name}</span>
                          </div>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.has('location') && (
                      <TableCell>
                        {(client.city || client.state) && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span>
                              {[client.city, client.state].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.has('industry') && (
                      <TableCell>
                        {client.industry && (
                          <Badge variant="secondary" className="font-normal">
                            <Briefcase className="h-3 w-3 mr-1" />
                            {client.industry}
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.has('status') && (
                      <TableCell>
                        <Badge variant={getStatusColor(client.status)}>
                          {client.status || 'Unknown'}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.has('created') && (
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(client.created_at), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => handleEdit(client)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-destructive"
                            onClick={() => handleDelete(client.id)}
                            disabled={isDeleting === client.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Make changes to the client information below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Industry</label>
                <Input
                  value={editData.industry || ''}
                  onChange={(e) => setEditData({ ...editData, industry: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={editData.email || ''}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={editData.phone || ''}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input
                value={editData.address || ''}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Input
                  value={editData.city || ''}
                  onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">State</label>
                <Input
                  value={editData.state || ''}
                  onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Zip</label>
                <Input
                  value={editData.zip || ''}
                  onChange={(e) => setEditData({ ...editData, zip: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Website</label>
                <Input
                  value={editData.website || ''}
                  onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={editData.status || 'active'}
                  onValueChange={(value) => setEditData({ ...editData, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClient(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}