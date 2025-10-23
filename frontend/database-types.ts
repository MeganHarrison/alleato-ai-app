export interface DocumentMetadata {
  id: string
  title: string
  type?: string
  project?: string
  date?: string
  summary?: string
  fireflies_link?: string
  speakers?: string[]
  transcript?: string
  content?: string
  embedding?: number[]
  created_at: string
  updated_at: string
}