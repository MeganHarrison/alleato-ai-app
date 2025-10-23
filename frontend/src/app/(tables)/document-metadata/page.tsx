import { DocumentMetadataDataTable } from "@/components/tables/document-metadata-data-table"
import { getDocumentMetadata } from "@/app/actions/document-metadata-actions"

export const dynamic = "force-dynamic"

export default async function DocumentMetadataPage() {
  const documentMetadata = await getDocumentMetadata()

  return <DocumentMetadataDataTable documentMetadata={documentMetadata} />
}