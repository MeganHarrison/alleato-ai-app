"use client";

import { useState, useMemo } from "react";
import { updateDocument, deleteDocument } from "@/app/actions/documents-full-actions";
import { DocumentDetailsSheet } from "@/components/documents/document-details-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pencil,
  Trash2,
  Check,
  X,
  Columns3,
  Search,
  Sparkles,
  Eye,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Document {
  id: string;
  content: string;
  title: string | null;
  project: string | null;
  project_id: number | null;
  file_date: string | null;
  file_id: string;
  category: string | null;
  action_items: string | null;
  tags: string[] | null;
  metadata: any | null;
  created_at: string | null;
  updated_at: string | null;
  source: string | null;
  url: string | null;
  fireflies_id: string | null;
  fireflies_link: string | null;
  processing_status: string | null;
  storage_object_id: string | null;
  created_by: string | null;
  embedding?: string | null;
}

interface EditableDocumentsTableProps {
  documents: Document[];
}

// Helper functions to extract data from document
const extractTitle = (doc: Document): string => {
  // Use direct title field if available
  if (doc.title) return doc.title;
  // Try to extract title from metadata or content
  if (doc.metadata?.title) return doc.metadata.title;
  if (doc.metadata?.file_path) {
    const parts = doc.metadata.file_path.split('/');
    return parts[parts.length - 1].replace(/\.[^/.]+$/, '');
  }
  if (doc.content) {
    // Extract first line or heading
    const firstLine = doc.content.split('\n')[0];
    return firstLine.substring(0, 100);
  }
  return `Document ${doc.id}`;
};

const extractProject = (doc: Document): string => {
  // Use direct project field if available
  if (doc.project) return doc.project;
  if (doc.metadata?.project) return doc.metadata.project;
  if (doc.metadata?.project_name) return doc.metadata.project_name;
  if (doc.metadata?.project_id) return `Project ${doc.metadata.project_id}`;
  return '';
};

const extractDate = (doc: Document): string => {
  // Use file_date field
  if (doc.file_date) return doc.file_date;
  if (doc.metadata?.date) return doc.metadata.date;
  if (doc.created_at) return doc.created_at;
  if (doc.metadata?.created_at) return doc.metadata.created_at;
  if (doc.metadata?.timestamp) return doc.metadata.timestamp;
  return '';
};

const extractSummary = (doc: Document): string => {
  // Check for action items first
  if (doc.action_items) return doc.action_items;
  // Check for AI-generated insights or summaries
  if (doc.metadata?.ai_insights?.summary) return doc.metadata.ai_insights.summary;
  if (doc.metadata?.ai_summary) return doc.metadata.ai_summary;
  if (doc.metadata?.summary) return doc.metadata.summary;
  if (doc.metadata?.description) return doc.metadata.description;
  
  // If no summary and has content, return first 200 characters
  if (doc.content) {
    return doc.content.substring(0, 200) + (doc.content.length > 200 ? '...' : '');
  }
  return '';
};

const hasAIInsights = (doc: Document): boolean => {
  return !!(
    doc.metadata?.ai_insights || 
    doc.metadata?.ai_summary || 
    doc.metadata?.ai_generated
  );
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return format(date, 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
};

export function EditableDocumentsTable({ documents }: EditableDocumentsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedDocument, setEditedDocument] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isGeneratingInsights] = useState(false);
  const [generatingDocIds, setGeneratingDocIds] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    date: true,
    summary: true,
    project: true,
    insights: true,
    actions: true
  });
  // Check if any documents are missing AI insights
  const documentsWithoutInsights = useMemo(() => {
    return documents.filter(doc => !hasAIInsights(doc));
  }, [documents]);

  // Filter documents based on search and type
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = 
        searchQuery === "" ||
        extractTitle(doc).toLowerCase().includes(searchQuery.toLowerCase()) ||
        extractProject(doc).toLowerCase().includes(searchQuery.toLowerCase()) ||
        extractSummary(doc).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.content?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [documents, searchQuery, typeFilter]);

  // Get unique categories for filter
  const documentCategories = useMemo(() => {
    const categories = new Set(documents.map(doc => doc.category).filter(Boolean));
    return Array.from(categories);
  }, [documents]);

  const handleEdit = (document: Document) => {
    setEditingId(document.id);
    setEditedDocument({ ...document });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedDocument(null);
  };

  const handleSave = async () => {
    if (!editedDocument) return;

    try {
      const { error } = await updateDocument(editedDocument.id, {
        content: editedDocument.content,
        category: editedDocument.category,
        title: editedDocument.title,
        project: editedDocument.project,
        metadata: editedDocument.metadata,
      });

      if (error) {
        toast.error(`Failed to update document: ${error}`);
      } else {
        toast.success("Document updated successfully");
        setEditingId(null);
        setEditedDocument(null);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error updating document:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const { error } = await deleteDocument(id);

      if (error) {
        toast.error(`Failed to delete document: ${error}`);
      } else {
        toast.success("Document deleted successfully");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error deleting document:", error);
    }
  };

  const handleGenerateInsights = async (documentId?: string) => {
    const docsToProcess = documentId 
      ? [documents.find(d => d.id === documentId)].filter(Boolean)
      : documentsWithoutInsights;

    if (docsToProcess.length === 0) {
      toast.info("No documents to process");
      return;
    }

    setIsGeneratingInsights(true);
    const processingIds = new Set(docsToProcess.map(d => d!.id));
    setGeneratingDocIds(processingIds);

    try {
      // Call the API endpoint to generate insights
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds: docsToProcess.map(doc => doc!.id)
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate insights: ${response.statusText}`);
      }

      const result = await response.json();
      
      toast.success(`Generated AI insights for ${result.processed || docsToProcess.length} document(s)`);
      
      // Refresh the page to show updated documents
      window.location.reload();
    } catch (error) {
      console.error("Error generating insights:", error);
      toast.error("Failed to generate AI insights. Please try again.");
    } finally {
      setIsGeneratingInsights(false);
      setGeneratingDocIds(new Set());
    }
  };

  const renderTableView = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.name && <TableHead>Name</TableHead>}
            {visibleColumns.date && <TableHead className="w-[120px]">Date</TableHead>}
            {visibleColumns.summary && <TableHead>Summary</TableHead>}
            {visibleColumns.project && <TableHead className="w-[150px]">Project</TableHead>}
            {visibleColumns.insights && <TableHead className="w-[100px]">AI Insights</TableHead>}
            {visibleColumns.actions && <TableHead className="w-[120px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDocuments.map((document) => {
            const isEditing = editingId === document.id;
            const isGenerating = generatingDocIds.has(document.id);
            const hasInsights = hasAIInsights(document);

            return (
              <TableRow key={document.id} className={cn(isEditing && "bg-muted/50")}>
                {visibleColumns.name && (
                  <TableCell>
                    <DocumentDetailsSheet
                      document={document}
                      trigger={
                        <Button 
                          variant="link" 
                          className="w-fit px-0 text-left text-foreground font-medium h-auto justify-start"
                        >
                          {extractTitle(document)}
                        </Button>
                      }
                    />
                  </TableCell>
                )}
                
                {visibleColumns.date && (
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(extractDate(document))}
                    </div>
                  </TableCell>
                )}
                
                {visibleColumns.summary && (
                  <TableCell>
                    <div className="max-w-[400px] line-clamp-2 text-sm">
                      {extractSummary(document) || <span className="text-muted-foreground italic">No summary available</span>}
                    </div>
                  </TableCell>
                )}
                
                {visibleColumns.project && (
                  <TableCell>
                    <div className="text-sm">
                      {extractProject(document) || <span className="text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                )}
                
                {visibleColumns.insights && (
                  <TableCell>
                    {isGenerating ? (
                      <Badge variant="secondary" className="gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating
                      </Badge>
                    ) : hasInsights ? (
                      <Badge variant="default" className="gap-1">
                        <Check className="h-3 w-3" />
                        Generated
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateInsights(document.id)}
                        className="h-7 text-xs gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        Generate
                      </Button>
                    )}
                  </TableCell>
                )}
                
                {visibleColumns.actions && (
                  <TableCell>
                    <div className="flex gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleSave}
                            className="h-8 w-8"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleCancel}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <DocumentDetailsSheet
                            document={document}
                            trigger={
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(document)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(document.id)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
          {filteredDocuments.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={Object.values(visibleColumns).filter(Boolean).length}
                className="text-center py-8 text-muted-foreground"
              >
                No documents found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Alert for documents without insights */}
      {documentsWithoutInsights.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900">AI Insights Available</p>
              <p className="text-sm text-amber-700">
                {documentsWithoutInsights.length} document{documentsWithoutInsights.length !== 1 ? 's' : ''} can be enhanced with AI-generated insights
              </p>
            </div>
          </div>
          <Button
            onClick={() => handleGenerateInsights()}
            disabled={isGeneratingInsights}
            className="gap-2"
          >
            {isGeneratingInsights ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Insights...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate All Insights
              </>
            )}
          </Button>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {documentCategories.map((category) => (
                <SelectItem key={category} value={category!}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="h-4 w-4 mr-2" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(visibleColumns).map(([key, value]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={value}
                  onCheckedChange={(checked) =>
                    setVisibleColumns((prev) => ({ ...prev, [key]: checked }))
                  }
                >
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredDocuments.length} of {documents.length} documents
      </div>

      {/* Table Content */}
      {renderTableView()}
    </div>
  );
}