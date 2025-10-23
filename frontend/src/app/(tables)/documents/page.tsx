import { EditableDocumentsTable } from "@/components/tables/editable-documents-table";
import { getDocuments } from "@/app/actions/documents-full-actions";
import { DocumentsClientWrapper } from "./documents-client-wrapper";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  // This is now a server component that can properly await server actions
  const result = await getDocuments();
  
  // Provide safe defaults if the result is undefined or malformed
  const documents = result?.documents || [];
  const error = result?.error || undefined;

  return <DocumentsClientWrapper documents={documents} error={error} />;
}
