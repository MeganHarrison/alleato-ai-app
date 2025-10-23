'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { createBrowserClient } from '@/utils/supabase-browser';
import { format } from 'date-fns';
import {
  Search,
  Calendar,
  Clock,
  Users,
  Link2,
  FileText,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  RefreshCw,
  Download,
} from 'lucide-react';

interface DocumentMetadata {
  id: string;
  title: string | null;
  date: string | null;
  project: string | null;
  project_id: number | null;
  participants: string | null;
  duration_minutes: number | null;
  summary: string | null;
  overview: string | null;
  action_items: string | null;
  bullet_points: string | null;
  outline: string | null;
  category: string | null;
  type: string | null;
  fireflies_link: string | null;
  fireflies_id: string | null;
  url: string | null;
  created_at: string | null;
  employee: string | null;
  tags: string | null;
  content: string | null;
}

// Function to generate consistent color for each project name
const getProjectColor = (project: string | null): string => {
  if (!project) return '';

  // List of available colors for projects
  const colors = [
    'bg-blue-500 hover:bg-blue-600 text-white',
    'bg-green-500 hover:bg-green-600 text-white',
    'bg-purple-500 hover:bg-purple-600 text-white',
    'bg-orange-500 hover:bg-orange-600 text-white',
    'bg-pink-500 hover:bg-pink-600 text-white',
    'bg-yellow-500 hover:bg-yellow-600 text-white',
    'bg-indigo-500 hover:bg-indigo-600 text-white',
    'bg-red-500 hover:bg-red-600 text-white',
    'bg-teal-500 hover:bg-teal-600 text-white',
    'bg-cyan-500 hover:bg-cyan-600 text-white',
  ];

  // Generate a hash from the project name for consistent color assignment
  let hash = 0;
  for (let i = 0; i < project.length; i++) {
    hash = project.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to select a color
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export default function MeetingsPage() {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<keyof DocumentMetadata>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const supabase = createBrowserClient();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_metadata')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSort = (field: keyof DocumentMetadata) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getFilteredAndSortedDocuments = () => {
    let filtered = documents;

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.participants?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const exportData = () => {
    const csvContent = documents.map(doc =>
      `"${doc.title || ''}","${doc.date || ''}","${doc.project || ''}","${doc.participants || ''}","${doc.duration_minutes || ''}","${doc.fireflies_link || ''}"`
    ).join('\n');

    const blob = new Blob(
      [`"Title","Date","Project","Participants","Duration (min)","Link"\n${csvContent}`],
      { type: 'text/csv' }
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meetings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const TableHeader = ({ field, label }: { field: keyof DocumentMetadata; label: string }) => (
    <th
      className="text-left py-3 px-4 cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {sortField === field && (
          sortDirection === 'asc' ?
            <ChevronUp className="h-4 w-4" /> :
            <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 animate-spin mx-auto mb-4 text-blue-500" />
          <p>Loading meetings data...</p>
        </div>
      </div>
    );
  }

  const filteredDocuments = getFilteredAndSortedDocuments();

  return (
    <div className="mx-auto p-6 space-y-6">
      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{filteredDocuments.length} records</Badge>
              <Button variant="outline" size="icon" onClick={fetchDocuments}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search meetings..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <TableHeader field="title" label="Title" />
                  <TableHeader field="date" label="Date" />
                  <TableHeader field="project" label="Project" />
                  <TableHeader field="participants" label="Participants" />
                  <TableHeader field="duration_minutes" label="Duration" />
                  <TableHeader field="type" label="Type" />
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => {
                  const isExpanded = expandedRows.has(doc.id);
                  return (
                    <>
                      <tr key={doc.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium">{doc.title || 'Untitled'}</div>
                          {doc.tags && (
                            <div className="flex gap-1 mt-1">
                              {doc.tags.split(',').map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tag.trim()}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {doc.date ? format(new Date(doc.date), 'MMM dd, yyyy') : '-'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {doc.project ? (
                            <Badge className={`${getProjectColor(doc.project)} border-0`}>
                              {doc.project}
                            </Badge>
                          ) : (
                            <span></span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm truncate max-w-xs" title={doc.participants || ''}>
                              {doc.participants || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {doc.duration_minutes ? `${doc.duration_minutes} min` : '-'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">{doc.type || doc.category || 'Meeting'}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(doc.id)}
                            >
                              {isExpanded ? 'Hide' : 'View'}
                            </Button>
                            {doc.fireflies_link && (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                              >
                                <a href={doc.fireflies_link} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${doc.id}-expanded`}>
                          <td colSpan={7} className="bg-muted/20 p-4">
                            <div className="space-y-4">
                              {doc.summary && (
                                <div>
                                  <h4 className="font-semibold mb-2">Summary</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {doc.summary}
                                  </p>
                                </div>
                              )}
                              {doc.overview && (
                                <div>
                                  <h4 className="font-semibold mb-2">Overview</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {doc.overview}
                                  </p>
                                </div>
                              )}
                              {doc.action_items && (
                                <div>
                                  <h4 className="font-semibold mb-2">Action Items</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {doc.action_items}
                                  </p>
                                </div>
                              )}
                              {doc.bullet_points && (
                                <div>
                                  <h4 className="font-semibold mb-2">Key Points</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {doc.bullet_points}
                                  </p>
                                </div>
                              )}
                              {doc.outline && (
                                <div>
                                  <h4 className="font-semibold mb-2">Outline</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {doc.outline}
                                  </p>
                                </div>
                              )}
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                {doc.employee && (
                                  <span>Employee: {doc.employee}</span>
                                )}
                                {doc.fireflies_id && (
                                  <span>Fireflies ID: {doc.fireflies_id}</span>
                                )}
                                {doc.created_at && (
                                  <span>Created: {format(new Date(doc.created_at), 'MMM dd, yyyy HH:mm')}</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
            {filteredDocuments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No meetings found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}