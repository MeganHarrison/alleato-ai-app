"use client";

import { useState, useMemo } from "react";
import { Subcontractor } from "@/app/actions/subcontractors-actions";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Filter,
  Phone,
  Mail,
  MoreHorizontal,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Shield,
  FileCheck,
  Star,
  Building2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SubcontractorsDataTableProps {
  subcontractors: Subcontractor[];
}

export default function SubcontractorsDataTable({ subcontractors }: SubcontractorsDataTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get unique statuses for filter
  const statuses = useMemo(() => {
    const statusSet = new Set(subcontractors.map((sub) => sub.status).filter(Boolean));
    return Array.from(statusSet).sort();
  }, [subcontractors]);

  // Get unique specialties for filter
  const specialties = useMemo(() => {
    const specialtySet = new Set<string>();
    subcontractors.forEach((sub) => {
      if (sub.specialties && Array.isArray(sub.specialties)) {
        sub.specialties.forEach((specialty) => specialtySet.add(specialty));
      }
    });
    return Array.from(specialtySet).sort();
  }, [subcontractors]);

  // Filter and search subcontractors
  const filteredSubcontractors = useMemo(() => {
    let filtered = [...subcontractors];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }

    // Apply specialty filter
    if (specialtyFilter !== "all") {
      filtered = filtered.filter((sub) => 
        sub.specialties && sub.specialties.includes(specialtyFilter)
      );
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (sub) =>
          sub.company_name?.toLowerCase().includes(query) ||
          sub.contact_first_name?.toLowerCase().includes(query) ||
          sub.contact_last_name?.toLowerCase().includes(query) ||
          sub.email?.toLowerCase().includes(query) ||
          sub.phone?.includes(query) ||
          sub.city?.toLowerCase().includes(query) ||
          sub.license_number?.toLowerCase().includes(query) ||
          sub.specialties?.some(s => s.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [subcontractors, searchQuery, statusFilter, specialtyFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredSubcontractors.length / itemsPerPage);
  const paginatedSubcontractors = filteredSubcontractors.slice(
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
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRatingStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3 w-3",
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            )}
          />
        ))}
        <span className="ml-1 text-xs text-muted-foreground">({rating})</span>
      </div>
    );
  };

  const isInsuranceExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const handleExport = () => {
    // Create CSV content
    const headers = [
      "Company Name",
      "Contact Name",
      "Email",
      "Phone",
      "Address",
      "City",
      "State",
      "ZIP",
      "Specialties",
      "License Number",
      "Insurance Carrier",
      "Insurance Policy",
      "Insurance Expiry",
      "W9 on File",
      "Status",
      "Rating",
      "Hourly Rate",
      "Notes",
    ];

    const csvData = filteredSubcontractors.map((sub) => [
      sub.company_name || "",
      `${sub.contact_first_name || ""} ${sub.contact_last_name || ""}`.trim(),
      sub.email || "",
      sub.phone || "",
      sub.address || "",
      sub.city || "",
      sub.state || "",
      sub.zip_code || "",
      sub.specialties?.join("; ") || "",
      sub.license_number || "",
      sub.insurance_carrier || "",
      sub.insurance_policy_number || "",
      sub.insurance_expiry_date || "",
      sub.w9_on_file ? "Yes" : "No",
      sub.status || "",
      sub.rating || "",
      sub.hourly_rate || "",
      sub.notes || "",
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
    a.download = `subcontractors-${format(new Date(), "yyyy-MM-dd")}.csv`;
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
            placeholder="Search company, contact, city, license, specialties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status || 'null'} value={status || ''}>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Building2 className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All Specialties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {specialties.map((specialty) => (
              <SelectItem key={specialty} value={specialty}>
                {specialty}
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
            <Plus className="h-4 w-4 mr-2" />
            Add Subcontractor
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedSubcontractors.length} of {filteredSubcontractors.length} subcontractors
        {searchQuery && ` matching "${searchQuery}"`}
        {statusFilter !== "all" && ` with status: ${statusFilter}`}
        {specialtyFilter !== "all" && ` in ${specialtyFilter}`}
      </div>

      {/* Data Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Specialties</TableHead>
              <TableHead>Certifications</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSubcontractors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all" || specialtyFilter !== "all"
                      ? "No subcontractors found matching your criteria"
                      : "No subcontractors found"}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedSubcontractors.map((subcontractor) => (
                <TableRow key={subcontractor.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{subcontractor.company_name || "-"}</div>
                      {subcontractor.contact_first_name && (
                        <div className="text-sm text-muted-foreground">
                          {subcontractor.contact_first_name} {subcontractor.contact_last_name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {subcontractor.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <a
                            href={`mailto:${subcontractor.email}`}
                            className="hover:underline"
                          >
                            {subcontractor.email}
                          </a>
                        </div>
                      )}
                      {subcontractor.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a
                            href={`tel:${subcontractor.phone}`}
                            className="hover:underline"
                          >
                            {formatPhoneNumber(subcontractor.phone)}
                          </a>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(subcontractor.city || subcontractor.state) && (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>
                          {[subcontractor.city, subcontractor.state]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                    {!subcontractor.city && !subcontractor.state && "-"}
                  </TableCell>
                  <TableCell>
                    {subcontractor.specialties && subcontractor.specialties.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {subcontractor.specialties.slice(0, 2).map((specialty, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {subcontractor.specialties.length > 2 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="secondary" className="text-xs">
                                  +{subcontractor.specialties.length - 2}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  {subcontractor.specialties.slice(2).join(", ")}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {subcontractor.license_number && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Licensed
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                License: {subcontractor.license_number}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {subcontractor.insurance_expiry_date && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  isInsuranceExpired(subcontractor.insurance_expiry_date) &&
                                  "border-red-500 text-red-700"
                                )}
                              >
                                {isInsuranceExpired(subcontractor.insurance_expiry_date) ? (
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <Shield className="h-3 w-3 mr-1" />
                                )}
                                {isInsuranceExpired(subcontractor.insurance_expiry_date) ? "Expired" : "Insured"}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs space-y-1">
                                {subcontractor.insurance_carrier && (
                                  <div>Carrier: {subcontractor.insurance_carrier}</div>
                                )}
                                {subcontractor.insurance_policy_number && (
                                  <div>Policy: {subcontractor.insurance_policy_number}</div>
                                )}
                                <div>
                                  Expires: {format(new Date(subcontractor.insurance_expiry_date), "MMM d, yyyy")}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {subcontractor.w9_on_file && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="outline" className="text-xs">
                                <FileCheck className="h-3 w-3 mr-1" />
                                W9
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">W9 on file</div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getRatingStars(subcontractor.rating)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {subcontractor.hourly_rate
                      ? `${formatCurrency(subcontractor.hourly_rate)}/hr`
                      : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(subcontractor.status)}</TableCell>
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
                        <DropdownMenuItem>Edit Subcontractor</DropdownMenuItem>
                        <DropdownMenuItem>Update Insurance</DropdownMenuItem>
                        <DropdownMenuItem>View Projects</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Remove Subcontractor
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