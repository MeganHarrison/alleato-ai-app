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
  Building,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  Truck,
  Smartphone,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { updateEmployee, deleteEmployee } from '@/app/actions/employees-actions'
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

export type Employee = {
  id: number
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  department: string | null
  salery: number | null
  start_date: string | null
  supervisor: string | null
  company_card: string | null
  truck_allowance: number | null
  phone_allowance: number | null
  created_at: string
  updated_at: string
}

interface EmployeesDataTableProps {
  employees: Employee[]
}

const COLUMNS = [
  { id: "name", label: "Employee", defaultVisible: true },
  { id: "email", label: "Email", defaultVisible: true },
  { id: "phone", label: "Phone", defaultVisible: true },
  { id: "department", label: "Department", defaultVisible: true },
  { id: "supervisor", label: "Supervisor", defaultVisible: true },
  { id: "salary", label: "Salary", defaultVisible: true },
  { id: "allowances", label: "Allowances", defaultVisible: true },
  { id: "start_date", label: "Start Date", defaultVisible: true },
]

export function EmployeesDataTable({ employees: initialEmployees }: EmployeesDataTableProps) {
  const [employees, setEmployees] = useState(initialEmployees)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(COLUMNS.filter(col => col.defaultVisible).map(col => col.id))
  )
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editData, setEditData] = useState<Partial<Employee>>({})
  const [isDeleting, setIsDeleting] = useState<number | null>(null)

  // Get unique departments for filter
  const departments = useMemo(() => {
    const deptSet = new Set(employees.map(e => e.department).filter((dept): dept is string => Boolean(dept)))
    return ["all", ...Array.from(deptSet).sort()]
  }, [employees])

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.toLowerCase()
      const matchesSearch = 
        fullName.includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.phone?.includes(searchTerm) ||
        employee.supervisor?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesDepartment = departmentFilter === 'all' || 
        employee.department === departmentFilter

      return matchesSearch && matchesDepartment
    })
  }, [employees, searchTerm, departmentFilter])

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '??'
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setEditData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      salery: employee.salery,
      supervisor: employee.supervisor,
      company_card: employee.company_card,
      truck_allowance: employee.truck_allowance,
      phone_allowance: employee.phone_allowance,
    })
  }

  const handleSave = async () => {
    if (!editingEmployee) return

    const updated = await updateEmployee(editingEmployee.id, editData)
    if (updated) {
      setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e))
      toast.success("Employee updated successfully")
      setEditingEmployee(null)
      setEditData({})
    } else {
      toast.error("Failed to update employee")
    }
  }

  const handleDelete = async (id: number) => {
    setIsDeleting(id)
    const success = await deleteEmployee(id)
    if (success) {
      setEmployees(prev => prev.filter(e => e.id !== id))
      toast.success("Employee deleted successfully")
    } else {
      toast.error("Failed to delete employee")
    }
    setIsDeleting(null)
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Department', 'Supervisor', 'Salary', 'Start Date']
    const rows = filteredEmployees.map(e => [
      `${e.first_name || ''} ${e.last_name || ''}`,
      e.email || '',
      e.phone || '',
      e.department || '',
      e.supervisor || '',
      e.salery || '',
      e.start_date || ''
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `employees-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}


        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.slice(1).map(dept => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
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
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Table */}
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.has('name') && <TableHead>Employee</TableHead>}
                {visibleColumns.has('email') && <TableHead>Email</TableHead>}
                {visibleColumns.has('department') && <TableHead>Department</TableHead>}
                {visibleColumns.has('supervisor') && <TableHead>Supervisor</TableHead>}
                {visibleColumns.has('start_date') && <TableHead>Start Date</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee) => (
                  <TableRow key={employee.id} className="cursor-pointer hover:bg-muted/50">
                    {visibleColumns.has('name') && (
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(employee.first_name, employee.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {employee.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.has('email') && (
                      <TableCell>
                        <div className="space-y-1">
                          {employee.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <a href={`mailto:${employee.email}`} className="hover:underline">
                                {employee.email}
                              </a>
                            </div>
                          )}
                          {employee.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <a href={`tel:${employee.phone}`} className="hover:underline">
                                {employee.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.has('department') && (
                      <TableCell>
                        {employee.department && (
                          <Badge variant="secondary" className="font-normal">
                            <Building className="h-3 w-3 mr-1" />
                            {employee.department}
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.has('supervisor') && (
                      <TableCell>
                        {employee.supervisor && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {employee.supervisor}
                          </div>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.has('salary') && (
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{formatCurrency(employee.salery)}</div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            {employee.truck_allowance && (
                              <span className="flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                {formatCurrency(employee.truck_allowance)}
                              </span>
                            )}
                            {employee.phone_allowance && (
                              <span className="flex items-center gap-1">
                                <Smartphone className="h-3 w-3" />
                                {formatCurrency(employee.phone_allowance)}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.has('start_date') && (
                      <TableCell>
                        {employee.start_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(employee.start_date), 'MMM d, yyyy')}
                          </div>
                        )}
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
                            onClick={() => handleEdit(employee)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-destructive"
                            onClick={() => handleDelete(employee.id)}
                            disabled={isDeleting === employee.id}
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
      <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Make changes to the employee information below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={editData.first_name || ''}
                  onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={editData.last_name || ''}
                  onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
                <Input
                  value={editData.department || ''}
                  onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Supervisor</label>
                <Input
                  value={editData.supervisor || ''}
                  onChange={(e) => setEditData({ ...editData, supervisor: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Salary</label>
                <Input
                  type="number"
                  value={editData.salery || ''}
                  onChange={(e) => setEditData({ ...editData, salery: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Truck Allowance</label>
                <Input
                  type="number"
                  value={editData.truck_allowance || ''}
                  onChange={(e) => setEditData({ ...editData, truck_allowance: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Allowance</label>
                <Input
                  type="number"
                  value={editData.phone_allowance || ''}
                  onChange={(e) => setEditData({ ...editData, phone_allowance: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEmployee(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}