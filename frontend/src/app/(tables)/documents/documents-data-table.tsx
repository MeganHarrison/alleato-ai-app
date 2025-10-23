"use client";

import { DataTable } from "@/components/tables/database-table";
// Define Document type based on expected structure
type Document = {
  id: string;
  title: string | null;
  url: string | null;
  created_at: string | null;
  schema: string | null;
};

function formatDateMMDDYYYY(dateString?: string) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

export function DocumentsDataTable({ documents }: { documents: Document[] }) {
  const columns = [
    {
      key: "title",
      label: "Title",
      format: (value: unknown) => {
        const strValue = String(value);
        // Find the document with this title to get the url
        const doc = documents.find((d) => d.title === strValue);
        return doc && doc.url ? (
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {strValue || "-"}
          </a>
        ) : (
          strValue || "-"
        );
      },
    },
    {
      key: "created_at",
      label: "Created",
      format: (value: unknown) => (value ? formatDateMMDDYYYY(String(value)) : "-"),
    },
  ];

  return <DataTable data={documents} columns={columns} pageSize={15} />;
}
