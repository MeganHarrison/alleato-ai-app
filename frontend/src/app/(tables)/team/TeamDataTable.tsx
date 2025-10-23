"use client";

import { useState, useMemo } from "react";
import { Employee } from "@/app/actions/employees-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Phone,
  Mail,
  MoreHorizontal,
  UserPlus,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

interface TeamDataTableProps {
  employees: Employee[];
}

export default function TeamDataTable({ employees }: TeamDataTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = new Set(employees.map((emp) => emp.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [employees]);

  // Filter and search employees
  const filteredEmployees = useMemo(() => {
    let filtered = [...employees];

    // Apply department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter((emp) => emp.department === departmentFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.first_name?.toLowerCase().includes(query) ||
          emp.last_name?.toLowerCase().includes(query) ||
          emp.email?.toLowerCase().includes(query) ||
          emp.department?.toLowerCase().includes(query) ||
          emp.phone?.includes(query)
      );
    }

    return filtered;
  }, [employees, searchQuery, departmentFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return "-";
    // Format as (XXX) XXX-XXXX if it's a 10-digit number
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const handleExport = () => {
    // Create CSV content
    const headers = [
      "First Name",
      "Last Name",
      "Email",
      "Phone",
      "Department",
      "Salary",
      "Start Date",
      "Supervisor",
      "Company Card",
      "Truck Allowance",
      "Phone Allowance",
    ];

    const csvData = filteredEmployees.map((emp) => [
      emp.first_name || "",
      emp.last_name || "",
      emp.email || "",
      emp.phone || "",
      emp.department || "",
      emp.salery || "",
      emp.start_date || "",
      emp.supervisor || "",
      emp.company_card || "",
      emp.truck_allowance || "",
      emp.phone_allowance || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team-directory-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, email, phone, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept || 'null'} value={dept || ''}>
                {dept || 'Unknown'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedEmployees.length} of {filteredEmployees.length} employees
        {searchQuery && ` matching "${searchQuery}"`}
        {departmentFilter !== "all" && ` in ${departmentFilter}`}
      </div>

      {/* Data Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Supervisor</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead className="text-right">Salary</TableHead>
              <TableHead>Allowances</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {searchQuery || departmentFilter !== "all"
                      ? "No employees found matching your criteria"
                      : "No employees found"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {employee.first_name} {employee.last_name}
                      </div>
                      {employee.company_card && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {employee.company_card}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {employee.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <a
                            href={`mailto:${employee.email}`}
                            className="hover:underline"
                          >
                            {employee.email}
                          </a>
                        </div>
                      )}
                      {employee.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a
                            href={`tel:${employee.phone}`}
                            className="hover:underline"
                          >
                            {formatPhoneNumber(employee.phone)}
                          </a>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {employee.department ? (
                      <Badge variant="outline">{employee.department}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{employee.supervisor || "-"}</TableCell>
                  <TableCell>
                    {employee.start_date
                      ? format(new Date(employee.start_date), "MMM d, yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(employee.salery)}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {employee.truck_allowance && (
                        <div>Truck: {formatCurrency(employee.truck_allowance)}</div>
                      )}
                      {employee.phone_allowance && (
                        <div>Phone: {formatCurrency(employee.phone_allowance)}</div>
                      )}
                      {!employee.truck_allowance && !employee.phone_allowance && "-"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Employee</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Remove Employee
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}