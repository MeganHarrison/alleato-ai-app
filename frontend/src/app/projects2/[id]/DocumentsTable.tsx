"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import {
  Calendar,
  Download,
  Edit,
  FileText,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Document {
  id: number;
  title?: string | null;
  date?: string | null;
  summary?: string | null;
  project?: string | null;
  project_id?: number | null;
  content: string | null;
  document_type: string | null;
  embedding: string | null;
  metadata: unknown;
  created_at?: string | null;
  updated_at?: string | null;
}

interface Project {
  id: number;
  name: string | null;
}

interface DocumentsTableProps {
  documents: Document[];
  projects?: Project[];
  projectId?: number;
  onDocumentsUpdate?: () => void;
}

export function DocumentsTable({
  documents: initialDocuments,
  projects = [],
  projectId,
  onDocumentsUpdate,
}: DocumentsTableProps) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedDocument, setEditedDocument] = useState<Partial<Document>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(
    null
  );
  const [supabase] = useState(() => createClient());

  const handleEdit = (document: Document) => {
    setEditingId(document.id);
    setEditedDocument({ ...document });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedDocument({});
  };

  const handleSave = async () => {
    if (!editingId || !editedDocument) return;

    try {
      if (!supabase) {
        throw new Error("Database connection not available");
      }

      const updateData: any = {
        title: editedDocument.title,
        date: editedDocument.date,
        project: editedDocument.project,
      };

      // Only include project_id if it's not already set by the parent
      if (!projectId && editedDocument.project_id !== undefined) {
        updateData.project_id = editedDocument.project_id;
      }

      const { error } = await supabase
        .from("documents")
        .update(updateData)
        .eq("id", editingId);

      if (error) throw error;

      // Update local state
      setDocuments((documents) =>
        documents.map((doc) =>
          doc.id === editingId ? { ...doc, ...editedDocument } : doc
        )
      );

      setEditingId(null);
      setEditedDocument({});
      toast.success("Document updated successfully");

      if (onDocumentsUpdate) {
        onDocumentsUpdate();
      }
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("Failed to update document");
    }
  };

  const handleFieldChange = (field: keyof Document, value: unknown) => {
    setEditedDocument((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      if (!supabase) {
        throw new Error("Database connection not available");
      }

      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentToDelete.id);

      if (error) throw error;

      // Update local state
      setDocuments((documents) =>
        documents.filter((doc) => doc.id !== documentToDelete.id)
      );

      toast.success("Document deleted successfully");

      if (onDocumentsUpdate) {
        onDocumentsUpdate();
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      if (document.content) {
        const blob = new Blob([document.content], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement("a");
        a.href = url;
        a.download = `${document.title || `document-${document.id}`}.txt`;
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(a);
        toast.success("Document downloaded successfully");
      } else {
        toast.error("No content available to download");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  return (
    <>
      <div className="overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="border-b border-gray-200 hover:bg-transparent">
              <TableHead className="w-[35%] font-semibold text-gray-900 px-6 py-4">
                Title
              </TableHead>
              <TableHead className="w-[20%] font-semibold text-gray-900 px-4 py-4">
                Date
              </TableHead>
              {!projectId && (
                <TableHead className="w-[25%] font-semibold text-gray-900 px-4 py-4">
                  Project
                </TableHead>
              )}
              <TableHead className="w-[20%] text-center font-semibold text-gray-900 px-6 py-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={projectId ? 3 : 4}
                  className="text-center py-12 text-gray-500"
                >
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-gray-300" />
                    <span className="text-sm font-medium">
                      No meetings found
                    </span>
                    <span className="text-xs text-gray-400">
                      Meeting documents for this project will appear here when
                      added
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((document) => {
                const isEditing = editingId === document.id;
                const currentDocument = isEditing ? editedDocument : document;

                return (
                  <TableRow
                    key={document.id}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell className="px-6 py-4">
                      {isEditing ? (
                        <Input
                          value={currentDocument.title || ""}
                          onChange={(e) =>
                            handleFieldChange("title", e.target.value)
                          }
                          className="w-full"
                          placeholder="Enter title..."
                        />
                      ) : (
                        <div className="font-semibold text-gray-900 text-sm">
                          {document.title || `Document ${document.id}`}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="px-4 py-4">
                      {isEditing ? (
                        <Input
                          type="date"
                          value={
                            currentDocument.date
                              ? new Date(currentDocument.date)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            handleFieldChange("date", e.target.value)
                          }
                          className="w-full text-xs"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="font-medium">
                            {document.date
                              ? format(new Date(document.date), "MMM d, yyyy")
                              : "No date"}
                          </span>
                        </div>
                      )}
                    </TableCell>

                    {!projectId && (
                      <TableCell className="px-4 py-4">
                        {isEditing ? (
                          <Input
                            value={currentDocument.project || ""}
                            onChange={(e) =>
                              handleFieldChange("project", e.target.value)
                            }
                            className="w-full"
                            placeholder="Enter project name..."
                          />
                        ) : (
                          <div className="text-sm">
                            {document.project ? (
                              <span className="font-medium text-gray-900">
                                {document.project}
                              </span>
                            ) : document.project_id ? (
                              <span className="font-medium text-gray-900">
                                {projects.find(
                                  (p) => p.id === document.project_id
                                )?.name || `Project ${document.project_id}`}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic text-xs">
                                No project
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                    )}

                    <TableCell className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSave}
                            className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600"
                            title="Save changes"
                          >
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(document)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 text-gray-500"
                            title="Edit document"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(document)}
                            className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 text-gray-500"
                            title="Download document"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(document)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 text-gray-500"
                            title="Delete document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;
              {documentToDelete?.title || `Document ${documentToDelete?.id}`}&quot;. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
