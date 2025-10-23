'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Loader2,
  File as FileIcon
} from 'lucide-react'
import Link from 'next/link'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean
    message: string
    documentId?: string
  } | null>(null)
  const [processingEmbeddings, setProcessingEmbeddings] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    
    if (!selectedFile) return

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Please select a file smaller than 10MB',
        variant: 'destructive',
      })
      return
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a PDF, Text, CSV, Word, or Excel file',
        variant: 'destructive',
      })
      return
    }

    setFile(selectedFile)
    setUploadResult(null)
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('You must be logged in to upload files')
      }

      // Create unique file name with timestamp
      const timestamp = new Date().getTime()
      const fileName = `${timestamp}_${file.name}`
      const filePath = `${user.id}/${fileName}`

      // Upload file to Supabase Storage
      setUploadProgress(30)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        // If bucket doesn't exist, create it
        if (uploadError.message.includes('bucket')) {
          const { error: createBucketError } = await supabase.storage
            .createBucket('documents', {
              public: false,
              allowedMimeTypes: ALLOWED_FILE_TYPES,
              fileSizeLimit: MAX_FILE_SIZE
            })
          
          if (createBucketError && !createBucketError.message.includes('already exists')) {
            throw createBucketError
          }

          // Retry upload after creating bucket
          const { data: retryData, error: retryError } = await supabase.storage
            .from('documents')
            .upload(filePath, file)

          if (retryError) {
            throw retryError
          }
        } else {
          throw uploadError
        }
      }

      setUploadProgress(50)

      // For private buckets, create a signed URL for viewing (7-day expiry)
      const { data: signedData, error: signedUrlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 60 * 60 * 24 * 7)
      
      if (signedUrlError) {
        throw signedUrlError
      }
      
      const signedUrl = signedData?.signedUrl

      // Create metadata entry with both signed URL and storage path
      const documentId = crypto.randomUUID()
      const { error: metadataError } = await supabase
        .from('document_metadata')
        .insert({
          id: documentId,
          title: file.name,
          url: signedUrl,
          storage_bucket: 'documents',
          storage_path: filePath,
          type: 'uploaded',
          project: 'User Upload',
          date: new Date().toISOString(),
          summary: `Uploaded file: ${file.name}`
        })

      if (metadataError) {
        throw metadataError
      }

      setUploadProgress(70)

      // Trigger RAG pipeline processing
      setProcessingEmbeddings(true)
      
      // Call backend API to process the file
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/api/process-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          document_id: documentId,
          file_path: filePath,
          file_name: file.name,
          mime_type: file.type
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        throw new Error(errorData.detail || 'Failed to process document')
      }

      setUploadProgress(100)

      setUploadResult({
        success: true,
        message: 'File uploaded and processed successfully!',
        documentId
      })

      toast({
        title: 'Success',
        description: 'File uploaded and embedding pipeline triggered',
      })

      // Clear the file input after successful upload
      setFile(null)
      
    } catch (error) {
      console.error('Upload error:', error)
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload file'
      })
      
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      setProcessingEmbeddings(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Upload Document
          </h1>
          <Link href="/documents">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Documents
            </Button>
          </Link>
        </div>

        {/* Upload Card */}
        <Card className="bg-gray-800/50 backdrop-blur border-gray-700 p-8">
          <div className="space-y-6">
            {/* File Input Area */}
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              
              <Input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.txt,.md,.csv,.xls,.xlsx,.doc,.docx"
                disabled={uploading}
              />
              
              <label
                htmlFor="file-upload"
                className="cursor-pointer"
              >
                <p className="text-lg text-white mb-2">
                  {file ? file.name : 'Click to select a file'}
                </p>
                <p className="text-sm text-gray-400">
                  Supported formats: PDF, TXT, MD, CSV, Word, Excel (max 10MB)
                </p>
              </label>

              {file && (
                <div className="mt-4 flex items-center justify-center gap-2 text-purple-400">
                  <FileIcon className="h-5 w-5" />
                  <span className="text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>
                    {processingEmbeddings ? 'Processing embeddings...' : 'Uploading...'}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Upload Result */}
            {uploadResult && (
              <Alert className={uploadResult.success ? 'border-green-500' : 'border-red-500'}>
                {uploadResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertTitle>
                  {uploadResult.success ? 'Upload Complete' : 'Upload Failed'}
                </AlertTitle>
                <AlertDescription>
                  {uploadResult.message}
                  {uploadResult.success && uploadResult.documentId && (
                    <div className="mt-2">
                      <Link href="/documents">
                        <Button variant="link" className="p-0 h-auto text-purple-400">
                          View in Documents →
                        </Button>
                      </Link>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {processingEmbeddings ? 'Processing...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>

            {/* Information */}
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-semibold text-white mb-2">What happens next?</h3>
              <ul className="space-y-1 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  Your document will be securely stored in Supabase
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  The RAG pipeline will automatically generate embeddings
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  The document will be searchable in the chat interface
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">•</span>
                  You can view and manage it in the Documents page
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}