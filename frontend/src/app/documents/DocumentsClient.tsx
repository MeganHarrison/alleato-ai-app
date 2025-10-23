// app/documents/DocumentsClient.tsx

"use client";

import { DataTable } from "@/components/tables/database-table";
import { PageHeader } from "@/components/page-header";
// import { DocumentsUploadModal } from "@/components/docs/documents-upload-modal";

interface Document {
  id: number;
  title: string;
  content: string;
  author_id: number;
  created_at: string;
}

export function DocumentsClient({ documents }: { documents: Document[] }) {
  const columns = ["title", "content", "author_id", "created_at"];

  return (
    <div className="w-[90%] mx-auto">
      <PageHeader
        title="Documents"
        description="Manage your document library"
        // action={{
        //   label: "Add Document",
        //   component: <DocumentsUploadModal />,
        // }}
      />
      <DataTable
        data={documents.filter(
          (doc) =>
            "content" in doc &&
            "embedding" in doc &&
            "metadata" in doc &&
            typeof doc.id === "number"
        )}
        columns={columns}
      />
    </div>
  );
}
