"use client";

import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { updateMeeting, deleteMeeting } from "@/app/actions/meeting-actions";
import { getProjects } from "@/app/actions/project-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pencil,
  Trash2,
  Check,
  X,
  Calendar,
  Clock,
  Filter,
  Columns3,
  LayoutGrid,
  List,
  ChevronDown,
  Search,
  ExternalLink,
  FileText,
  Download,
  ChevronUp,
  ChevronsUpDown,
  Eye,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MeetingDetailsSheet } from "../meetings/meeting-details-sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Meeting {
  id: string;
  project_id?: number | null;
  date: string;
  title?: string | null;
  summary?: string | null;
  duration_minutes?: number | null;
  participants?: string[] | null;
  tags?: string[] | null;
  category?: string | null;
  sentiment_score?: number | null;
  storage_bucket_path?: string | null;
  transcript_url?: string | null;
  projects?: {
    id: number;
    name: string | null;
  } | null;
}

interface EditableMeetingsTableProps {
  meetings: Meeting[];
}

const COLUMNS = [
  { id: "title", label: "Title", defaultVisible: true },
  { id: "date", label: "Date & Time", defaultVisible: true },
  { id: "project", label: "Project", defaultVisible: true },
  { id: "category", label: "Category", defaultVisible: true },
  { id: "summary", label: "Summary", defaultVisible: true },
  { id: "links", label: "Links", defaultVisible: true },
];

export function EditableMeetingsTable({
  meetings,
}: EditableMeetingsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Meeting>>({});
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchQuery] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(COLUMNS.filter((col) => col.defaultVisible).map((col) => col.id))
  );
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [projects, setProjects] = useState<any[]>([]);

  // Get unique years and categories for filters
  const years = useMemo(() => {
    const yearSet = new Set(
      meetings.map((m) => new Date(m.date).getFullYear().toString())
    );
    return [
      "all",
      ...Array.from(yearSet).sort((a, b) => parseInt(b) - parseInt(a)),
    ];
  }, [meetings]);

  const categories = useMemo(() => {
    const catSet = new Set(meetings.map((m) => m.category).filter((cat): cat is string => Boolean(cat)));
    return ["all", ...Array.from(catSet).sort()];
  }, [meetings]);

  // Filter and sort meetings
  const filteredMeetings = useMemo(() => {
    const filtered = meetings.filter((meeting) => {
      // Year filter
      if (selectedYear !== "all") {
        const meetingYear = new Date(meeting.date).getFullYear().toString();
        if (meetingYear !== selectedYear) return false;
      }

      // Category filter
      if (selectedCategory !== "all" && meeting.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          meeting.title?.toLowerCase().includes(query) ||
          meeting.summary?.toLowerCase().includes(query) ||
          meeting.category?.toLowerCase().includes(query) ||
          meeting.projects?.name?.toLowerCase().includes(query)
        );
      }

      return true;
    });

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue: unknown;
        let bValue: unknown;

        switch (sortColumn) {
          case "title":
            aValue = a.title?.toLowerCase() || "";
            bValue = b.title?.toLowerCase() || "";
            break;
          case "date":
            aValue = new Date(a.date).getTime();
            bValue = new Date(b.date).getTime();
            break;
          case "project":
            aValue = a.projects?.name?.toLowerCase() || "";
            bValue = b.projects?.name?.toLowerCase() || "";
            break;
          case "category":
            aValue = a.category?.toLowerCase() || "";
            bValue = b.category?.toLowerCase() || "";
            break;
          case "duration":
            aValue = a.duration_minutes || 0;
            bValue = b.duration_minutes || 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by date descending
      filtered.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }

    return filtered;
  }, [
    meetings,
    selectedYear,
    selectedCategory,
    searchQuery,
    sortColumn,
    sortDirection,
  ]);

  // Load projects when component mounts
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const { projects } = await getProjects();
    setProjects(projects || []);
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingId(meeting.id);
    setEditData({
      title: meeting.title,
      summary: meeting.summary,
      date: meeting.date,
      duration_minutes: meeting.duration_minutes,
      category: meeting.category,
      project_id: meeting.project_id,
    });
  };

  const handleSave = async (id: string) => {
    const { error } = await updateMeeting(id, editData);
    if (error) {
      toast.error(`Failed to update meeting: ${error}`);
    } else {
      toast.success("Meeting updated successfully");
      setEditingId(null);
      setEditData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    const { error } = await deleteMeeting(id);
    if (error) {
      toast.error(`Failed to delete meeting: ${error}`);
    } else {
      toast.success("Meeting deleted successfully");
    }
    setIsDeleting(null);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "h:mm a");
    } catch {
      return "";
    }
  };

  // Compact one-line date + time, matching target design
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d yyyy, h:mm a");
    } catch {
      return dateString;
    }
  };

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes) return "—";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
    }
    return `${mins}m`;
  };

  const getCategoryColor = (category: string | null | undefined) => {
    if (!category) return "bg-gray-100 text-gray-700 border-gray-200";
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes("planning"))
      return "bg-blue-50 text-blue-700 border-blue-200";
    if (lowerCategory.includes("review"))
      return "bg-purple-50 text-purple-700 border-purple-200";
    if (lowerCategory.includes("standup") || lowerCategory.includes("daily"))
      return "bg-green-50 text-green-700 border-green-200";
    if (lowerCategory.includes("retro"))
      return "bg-orange-50 text-orange-700 border-orange-200";
    if (lowerCategory.includes("client"))
      return "bg-pink-50 text-pink-700 border-pink-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  // Generate project-specific colors based on project ID
  const getProjectColor = (projectId: number | null | undefined) => {
    if (!projectId) return "bg-gray-100 text-gray-700";

    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-purple-100 text-purple-800",
      "bg-emerald-100 text-emerald-800",
      "bg-orange-100 text-orange-800",
      "bg-pink-100 text-pink-800",
      "bg-teal-100 text-teal-800",
      "bg-indigo-100 text-indigo-800",
      "bg-green-100 text-green-800",
      "bg-amber-100 text-amber-800",
      "bg-cyan-100 text-cyan-800",
      "bg-rose-100 text-rose-800",
      "bg-violet-100 text-violet-800",
    ];

    return colors[projectId % colors.length];
  };

  const toggleColumn = (columnId: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnId)) {
      newVisible.delete(columnId);
    } else {
      newVisible.add(columnId);
    }
    setVisibleColumns(newVisible);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  const CardView = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredMeetings.map((meeting) => {
        const isEditing = editingId === meeting.id;
        return (
          <Card
            key={meeting.id}
            className={cn(
              "group bg-white hover:shadow-lg hover:border-gray-300 transition-all duration-200",
              isEditing && "ring-2 ring-blue-500"
            )}
          >
            <CardContent className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={editData.title || ""}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="Meeting title"
                      className="font-medium mb-2"
                    />
                  ) : meeting.storage_bucket_path ? (
                    <a
                      href={meeting.storage_bucket_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-base line-clamp-1 hover:text-blue-600 hover:underline cursor-pointer"
                    >
                      {meeting.title || "Untitled"}
                    </a>
                  ) : (
                    <h3 className="font-medium text-base line-clamp-1">
                      {meeting.title || "Untitled"}
                    </h3>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDateTime(meeting.date)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSave(meeting.id)}
                        className="h-7 w-7 p-0"
                      >
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancel}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(meeting)}
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(meeting.id)}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {isEditing ? (
                  <Select
                    value={editData.project_id?.toString() || "none"}
                    onValueChange={(value) =>
                      setEditData((prev) => ({
                        ...prev,
                        project_id: value === "none" ? null : parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger className="h-7 text-xs w-auto min-w-[120px]">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem
                          key={project.id}
                          value={project.id.toString()}
                        >
                          {project.name || `Project ${project.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : meeting.projects?.name ? (
                  <Link
                    href={`/projects/${meeting.project_id}`}
                    className="inline-flex items-center hover:opacity-80 transition-opacity"
                  >
                    <div
                      className={cn(
                        "text-xs font-medium px-2.5 py-1 rounded-full",
                        getProjectColor(meeting.project_id)
                      )}
                    >
                      {meeting.projects.name.toLowerCase() ===
                      "internal team project"
                        ? "Internal"
                        : meeting.projects.name}
                    </div>
                  </Link>
                ) : (
                  <div className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                    No Project
                  </div>
                )}
                {meeting.duration_minutes && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(meeting.duration_minutes)}</span>
                  </div>
                )}
                {isEditing ? (
                  <Input
                    value={editData.category || ""}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    placeholder="Category"
                    className="h-6 text-xs"
                  />
                ) : meeting.category ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium border px-2 py-1 rounded-md",
                      getCategoryColor(meeting.category)
                    )}
                  >
                    {meeting.category}
                  </Badge>
                ) : null}
              </div>

              {/* Summary */}
              {isEditing ? (
                <Textarea
                  value={editData.summary || ""}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      summary: e.target.value,
                    }))
                  }
                  placeholder="Summary"
                  className="min-h-[60px] text-xs"
                />
              ) : (
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {meeting.summary || "No summary"}
                </p>
              )}

              {/* Links Section */}
              {(meeting.storage_bucket_path || meeting.transcript_url) && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  {meeting.storage_bucket_path && (
                    <a
                      href={meeting.storage_bucket_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      title={
                        meeting.storage_bucket_path.endsWith(".md")
                          ? "View transcript"
                          : "Download file"
                      }
                    >
                      {meeting.storage_bucket_path.endsWith(".md") ? (
                        <>
                          <FileText className="h-3 w-3" />
                          <span>Transcript</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3 w-3" />
                          <span>File</span>
                        </>
                      )}
                    </a>
                  )}
                  {meeting.transcript_url && (
                    <a
                      href={meeting.transcript_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                      title="View Fireflies transcript"
                    >
                      <Image
                        src="/ff-logo.png"
                        alt="Fireflies"
                        width={16}
                        height={16}
                        className="opacity-70 hover:opacity-100 transition-opacity"
                      />
                      <span className="text-gray-600">Transcript</span>
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const TableView = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-gray-200">
            {visibleColumns.has("title") && (
              <TableHead className="w-[350px] font-medium text-gray-700 bg-gray-50 h-12">
                <button
                  className="flex items-center hover:text-gray-900 transition-colors"
                  onClick={() => handleSort("title")}
                >
                  Meeting Title
                  {getSortIcon("title")}
                </button>
              </TableHead>
            )}
            {visibleColumns.has("date") && (
              <TableHead className="w-[160px] font-medium text-gray-700 bg-gray-50 h-12">
                <button
                  className="flex items-center hover:text-gray-900 transition-colors"
                  onClick={() => handleSort("date")}
                >
                  Date & Time
                  {getSortIcon("date")}
                </button>
              </TableHead>
            )}
            {visibleColumns.has("project") && (
              <TableHead className="w-[280px] font-medium text-gray-700 bg-gray-50 h-12">
                <button
                  className="flex items-center hover:text-gray-900 transition-colors"
                  onClick={() => handleSort("project")}
                >
                  Project
                  {getSortIcon("project")}
                </button>
              </TableHead>
            )}
            {visibleColumns.has("category") && (
              <TableHead className="font-medium text-gray-700 bg-gray-50 h-12">
                <button
                  className="flex items-center hover:text-gray-900 transition-colors"
                  onClick={() => handleSort("category")}
                >
                  Category
                  {getSortIcon("category")}
                </button>
              </TableHead>
            )}
            {visibleColumns.has("summary") && (
              <TableHead className="font-medium text-gray-700 bg-gray-50 h-12">
                Summary
              </TableHead>
            )}
            {visibleColumns.has("links") && (
              <TableHead className="w-[100px] font-medium text-gray-700 bg-gray-50 h-12">
                Links
              </TableHead>
            )}
            <TableHead className="w-[100px] font-medium text-gray-700 bg-gray-50 h-12">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMeetings.map((meeting) => {
            const isEditing = editingId === meeting.id;
            return (
              <TableRow
                key={meeting.id}
                className="group hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                {visibleColumns.has("title") && (
                  <TableCell className="py-4">
                    {isEditing ? (
                      <Input
                        value={editData.title || ""}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="Title"
                        className="h-8"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <MeetingDetailsSheet
                          meeting={{
                            id: meeting.id,
                            title: meeting.title || "Untitled Meeting",
                            meeting_date: meeting.date,
                            duration_minutes: meeting.duration_minutes || 0,
                            participants: meeting.participants || [],
                            fireflies_id: meeting.id,
                            fireflies_link: meeting.transcript_url || undefined,
                            storage_path: meeting.storage_bucket_path || "",
                            summary: meeting.summary || undefined,
                            project: meeting.projects
                              ? {
                                  id: meeting.projects.id.toString(),
                                  name: meeting.projects.name || "",
                                }
                              : undefined,
                          }}
                          trigger={
                            <div className="font-semibold text-gray-900 leading-tight hover:text-brand-500 hover:underline cursor-pointer transition-colors">
                              {meeting.title || "Untitled Meeting"}
                            </div>
                          }
                        />
                        {meeting.duration_minutes && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-md">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDuration(meeting.duration_minutes)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </TableCell>
                )}
                {visibleColumns.has("date") && (
                  <TableCell className="font-medium py-4 whitespace-nowrap">
                    {isEditing ? (
                      <Input
                        type="datetime-local"
                        value={editData.date?.slice(0, 16) || ""}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                        className="h-8 text-sm"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        {formatDateTime(meeting.date)}
                      </div>
                    )}
                  </TableCell>
                )}
                {visibleColumns.has("project") && (
                  <TableCell className="py-4">
                    {isEditing ? (
                      <Select
                        value={editData.project_id?.toString() || "none"}
                        onValueChange={(value) =>
                          setEditData((prev) => ({
                            ...prev,
                            project_id:
                              value === "none" ? null : parseInt(value),
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No project</SelectItem>
                          {projects.map((project) => (
                            <SelectItem
                              key={project.id}
                              value={project.id.toString()}
                            >
                              {project.name || `Project ${project.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : meeting.projects?.name ? (
                      <Link
                        href={`/projects/${meeting.project_id}`}
                        className="inline-flex items-center hover:opacity-80 transition-opacity"
                      >
                        <div
                          className={cn(
                            "text-xs font-medium px-3 py-1 rounded-full transition-all hover:shadow-sm",
                            getProjectColor(meeting.project_id)
                          )}
                        >
                          {meeting.projects.name.toLowerCase() ===
                          "internal team project"
                            ? "Internal"
                            : meeting.projects.name}
                        </div>
                      </Link>
                    ) : (
                      <div className="inline-flex text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                        No Project
                      </div>
                    )}
                  </TableCell>
                )}
                {visibleColumns.has("category") && (
                  <TableCell className="py-4">
                    {isEditing ? (
                      <Input
                        value={editData.category || ""}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        className="h-8"
                        placeholder="Category"
                      />
                    ) : meeting.category ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-medium border px-2 py-1 rounded-md",
                          getCategoryColor(meeting.category)
                        )}
                      >
                        {meeting.category}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                )}
                {visibleColumns.has("summary") && (
                  <TableCell className="max-w-[300px] py-4">
                    {isEditing ? (
                      <Textarea
                        value={editData.summary || ""}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            summary: e.target.value,
                          }))
                        }
                        className="min-h-[60px]"
                      />
                    ) : (
                      <div className="line-clamp-2 text-sm text-muted-foreground">
                        {meeting.summary || "No summary available"}
                      </div>
                    )}
                  </TableCell>
                )}
                {visibleColumns.has("links") && (
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      {meeting.storage_bucket_path && (
                        <a
                          href={meeting.storage_bucket_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors"
                          title={
                            meeting.storage_bucket_path.endsWith(".md")
                              ? "View transcript"
                              : "Download file"
                          }
                        >
                          {meeting.storage_bucket_path.endsWith(".md") ? (
                            <FileText className="h-4 w-4 text-gray-600" />
                          ) : (
                            <Download className="h-4 w-4 text-gray-600" />
                          )}
                        </a>
                      )}
                      {meeting.transcript_url && (
                        <a
                          href={meeting.transcript_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors"
                          title="View Fireflies transcript"
                        >
                          <Image
                            src="/ff-logo.png"
                            alt="Fireflies"
                            width={20}
                            height={20}
                            className="opacity-70 hover:opacity-100 transition-opacity"
                          />
                        </a>
                      )}
                      {!meeting.storage_bucket_path &&
                        !meeting.transcript_url && (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                    </div>
                  </TableCell>
                )}
                <TableCell className="py-4">
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSave(meeting.id)}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancel}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(meeting)}
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
                        >
                          <Pencil className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(meeting.id)}
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
                        >
                          <Trash2 className="h-4 w-4 text-gray-600" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>

            {/* Filters */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 px-4 border-gray-200 hover:bg-gray-50"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Filter by Year</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {years.map((year) => (
                  <DropdownMenuCheckboxItem
                    key={year}
                    checked={selectedYear === year}
                    onCheckedChange={() => setSelectedYear(year)}
                  >
                    {year === "all" ? "All Years" : year}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.map((cat) => (
                  <DropdownMenuCheckboxItem
                    key={cat}
                    checked={selectedCategory === cat}
                    onCheckedChange={() => setSelectedCategory(cat)}
                  >
                    {cat === "all" ? "All Categories" : cat}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Column Selection */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 px-4 border-gray-200 hover:bg-gray-50"
                >
                  <Columns3 className="mr-2 h-4 w-4" />
                  Columns
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {COLUMNS.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={visibleColumns.has(column.id)}
                    onCheckedChange={() => toggleColumn(column.id)}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-500 font-medium">
            {filteredMeetings.length}{" "}
            {filteredMeetings.length === 1 ? "meeting" : "meetings"}
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs defaultValue="table" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-gray-100 p-1">
            <TabsTrigger
              value="table"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <List className="h-4 w-4 mr-2" />
              Table View
            </TabsTrigger>
            <TabsTrigger
              value="card"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Card View
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="table" className="mt-0">
          {filteredMeetings.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12">
              <div className="flex flex-col items-center justify-center">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900">
                  No meetings found
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your filters or search query
                </p>
              </div>
            </div>
          ) : (
            <TableView />
          )}
        </TabsContent>

        <TabsContent value="card" className="mt-0">
          {filteredMeetings.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12">
              <div className="flex flex-col items-center justify-center">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900">
                  No meetings found
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Try adjusting your filters or search query
                </p>
              </div>
            </div>
          ) : (
            <CardView />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
