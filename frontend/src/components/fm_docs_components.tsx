// =============================================
// FM Global 8-34 Documentation Site Components
// Preserves exact PDF verbiage with modern navigation
// =============================================

import React, { useState, useEffect, useMemo } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  ChevronRight, 
  ChevronDown, 
  Search, 
  BookOpen, 
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Home,
  FileText,
  Hash
} from 'lucide-react';

// Types matching your database schema
interface Section {
  id: string;
  section_number: string;
  title: string;
  slug: string;
  parent_id: string | null;
  nesting_level: number;
  has_children: boolean;
  page_range: string;
  url_path: string;
  sort_key: number;
}

interface Block {
  id: string;
  block_type: string;
  ordinal: number;
  source_text: string;
  html: string;
  meta: unknown;
  page_reference: number;
  inline_figures: number[];
  inline_tables: string[];
}

interface SectionContent {
  section_id: string;
  section_number: string;
  section_title: string;
  section_slug: string;
  page_start: number;
  page_end: number;
  section_path: string[];
  breadcrumb_display: string[];
  nesting_level: number;
  blocks: Block[];
}

interface SearchResult {
  result_type: 'section' | 'block';
  section_id: string;
  section_number: string;
  section_title: string;
  section_slug: string;
  block_id?: string;
  block_content: string;
  page_reference: number;
  url_path: string;
  search_rank: number;
}

// Database client
class FMDocsClient {
  private supabase: SupabaseClient;
  
  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
  
  async getTableOfContents(): Promise<Section[]> {
    const { data, error } = await this.supabase.rpc('get_hierarchical_toc');
    if (error) throw error;
    return data || [];
  }
  
  async getSectionContent(slug: string): Promise<SectionContent | null> {
    const { data, error } = await this.supabase.rpc('get_section_with_content', { section_slug: slug });
    if (error) throw error;
    return data?.[0] || null;
  }
  
  async searchDocs(query: string, limit: number = 20): Promise<SearchResult[]> {
    const { data, error } = await this.supabase.rpc('search_fm_docs', {
      search_query: query,
      limit_results: limit
    });
    if (error) throw error;
    return data || [];
  }
  
  async getSectionNavigation(slug: string): Promise<{
    previous_section: unknown;
    next_section: unknown;
  }> {
    const { data, error } = await this.supabase.rpc('get_section_navigation', { current_slug: slug });
    if (error) throw error;
    return data?.[0] || { previous_section: null, next_section: null };
  }
  
  async getRelatedFigures(figureNumbers: number[]): Promise<any[]> {
    if (!figureNumbers.length) return [];
    
    const { data, error } = await this.supabase
      .from('fm_global_figures')
      .select('*')
      .in('figure_number', figureNumbers)
      .order('figure_number');
    
    if (error) throw error;
    return data || [];
  }
  
  async getRelatedTables(tableIds: string[]): Promise<any[]> {
    if (!tableIds.length) return [];
    
    const { data, error } = await this.supabase
      .from('fm_global_tables')
      .select('*')
      .in('table_id', tableIds)
      .order('table_number');
    
    if (error) throw error;
    return data || [];
  }
}

// Sidebar Navigation Component
interface SidebarProps {
  sections: Section[];
  currentSlug?: string;
  onSectionClick: (slug: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sections, currentSlug, onSectionClick }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  const toggleExpanded = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };
  
  // Organize sections into tree structure
  const sectionTree = useMemo(() => {
    const tree: { [key: string]: Section & { children: Section[] } } = {};
    const roots: (Section & { children: Section[] })[] = [];
    
    // First pass: create all section objects
    sections.forEach(section => {
      tree[section.id] = { ...section, children: [] };
    });
    
    // Second pass: build tree structure
    sections.forEach(section => {
      if (section.parent_id && tree[section.parent_id]) {
        tree[section.parent_id].children.push(tree[section.id]);
      } else {
        roots.push(tree[section.id]);
      }
    });
    
    return roots;
  }, [sections]);
  
  const renderSection = (section: Section & { children: Section[] }, level: number = 0) => {
    const isExpanded = expandedSections.has(section.id);
    const isActive = currentSlug === section.slug;
    const hasChildren = section.children.length > 0;
    
    return (
      <div key={section.id} className="mb-1">
        <div 
          className={`
            flex items-center px-2 py-1.5 text-sm cursor-pointer rounded
            ${isActive ? 'bg-blue-100 text-blue-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}
          `}
          style={{ paddingLeft: `${8 + level * 16}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(section.id);
              }}
              className="mr-1 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          
          <div 
            className="flex-1 flex items-center justify-between"
            onClick={() => onSectionClick(section.slug)}
          >
            <div className="flex-1">
              <span className="text-xs text-gray-500 mr-2">{section.section_number}</span>
              <span className="truncate">{section.title}</span>
            </div>
            {section.page_range && (
              <span className="text-xs text-gray-400 ml-2">{section.page_range}</span>
            )}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-2">
            {section.children
              .sort((a, b) => a.sort_key - b.sort_key)
              .map(child => renderSection(child, level + 1))
            }
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="w-80 h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="px-4 py-4 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">FM Global 8-34</h1>
        <p className="text-sm text-gray-600">ASRS Sprinkler Protection</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {sectionTree.map(section => renderSection(section))}
      </div>
    </div>
  );
};

// Search Component
interface SearchProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isSearching: boolean;
}

const SearchBar: React.FC<SearchProps> = ({ onSearch, onClear, isSearching }) => {
  const [query] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };
  
  const handleClear = () => {
    setQuery('');
    onClear();
  };
  
  return (
    <div className="p-4 border-b border-gray-200 bg-white">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FM Global 8-34..."
            className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// Search Results Component
interface SearchResultsProps {
  results: SearchResult[];
  onResultClick: (slug: string, blockId?: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onResultClick }) => {
  if (results.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No results found. Try different search terms.</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        Search Results ({results.length})
      </h2>
      
      {results.map((result, index) => (
        <div
          key={`${result.section_id}-${result.block_id || 'section'}-${index}`}
          className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer"
          onClick={() => onResultClick(result.section_slug, result.block_id)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {result.result_type === 'section' ? (
                <BookOpen className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>{result.section_number}</span>
              <span>•</span>
              <span>Page {result.page_reference}</span>
            </div>
            <div className="text-xs text-gray-400">
              Relevance: {(result.search_rank * 100).toFixed(1)}%
            </div>
          </div>
          
          <h3 className="font-medium text-gray-900 mb-2">
            {result.section_title}
          </h3>
          
          <p className="text-sm text-gray-700 line-clamp-3">
            {result.block_content}
          </p>
        </div>
      ))}
    </div>
  );
};

// Breadcrumb Component
interface BreadcrumbProps {
  breadcrumbs: string[];
  sectionNumber: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ breadcrumbs, sectionNumber }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <Home className="w-4 h-4" />
      <span>FM Global 8-34</span>
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4" />
          <span className={index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : ''}>
            {crumb}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
};

// Section Content Component
interface SectionContentProps {
  content: SectionContent;
  relatedFigures: unknown[];
  relatedTables: unknown[];
}

const SectionContentView: React.FC<SectionContentProps> = ({ 
  content, 
  relatedFigures, 
  relatedTables 
}) => {
  // Group blocks by type for better rendering
  const blocksByType = content.blocks.reduce((acc, block) => {
    if (!acc[block.block_type]) acc[block.block_type] = [];
    acc[block.block_type].push(block);
    return acc;
  }, {} as Record<string, Block[]>);
  
  const renderBlock = (block: Block) => {
    const blockId = `block-${block.id}`;
    
    return (
      <div key={block.id} id={blockId} className="mb-6 scroll-margin-top-20">
        {block.page_reference && (
          <div className="text-xs text-gray-400 mb-2">Page {block.page_reference}</div>
        )}
        
        <div className="prose prose-sm max-w-none">
          {block.html ? (
            <div dangerouslySetInnerHTML={{ __html: block.html }} />
          ) : (
            <div className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded">
              {block.source_text}
            </div>
          )}
        </div>
        
        {/* Inline figures and tables */}
        {(block.inline_figures?.length > 0 || block.inline_tables?.length > 0) && (
          <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-200">
            <div className="text-xs font-medium text-blue-800 mb-2">Referenced Content:</div>
            {block.inline_figures?.map(figNum => (
              <div key={figNum} className="text-xs text-blue-600">
                📊 Figure {figNum}
              </div>
            ))}
            {block.inline_tables?.map(tableId => (
              <div key={tableId} className="text-xs text-blue-600">
                📋 Table {tableId}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <article className="max-w-4xl">
      {/* Section Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-mono rounded">
            {content.section_number}
          </div>
          {content.page_start && (
            <div className="text-sm text-gray-600">
              Pages {content.page_start}
              {content.page_end && content.page_end !== content.page_start && `-${content.page_end}`}
            </div>
          )}
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {content.section_title}
        </h1>
        
        <Breadcrumb 
          breadcrumbs={content.breadcrumb_display} 
          sectionNumber={content.section_number}
        />
      </header>
      
      {/* Section Content */}
      <div className="space-y-6">
        {content.blocks
          .sort((a, b) => a.ordinal - b.ordinal)
          .map(renderBlock)
        }
      </div>
      
      {/* Related Content */}
      {(relatedFigures.length > 0 || relatedTables.length > 0) && (
        <aside className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Related Content</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {relatedFigures.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Related Figures</h3>
                <div className="space-y-3">
                  {relatedFigures.map(figure => (
                    <div key={figure.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="font-medium text-gray-900">
                        Figure {figure.figure_number}: {figure.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {figure.normalized_summary}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Page {figure.page_number} • {figure.asrs_type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {relatedTables.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Related Tables</h3>
                <div className="space-y-3">
                  {relatedTables.map(table => (
                    <div key={table.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="font-medium text-gray-900">
                        Table {table.table_number}: {table.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {table.asrs_type} • {table.protection_scheme}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </article>
  );
};

// Navigation Footer Component
interface NavigationFooterProps {
  previousSection: unknown;
  nextSection: unknown;
  onSectionClick: (slug: string) => void;
}

const NavigationFooter: React.FC<NavigationFooterProps> = ({ 
  previousSection, 
  nextSection, 
  onSectionClick 
}) => {
  return (
    <nav className="flex justify-between items-center pt-8 mt-12 border-t border-gray-200">
      <div className="flex-1">
        {previousSection && (
          <button
            onClick={() => onSectionClick(previousSection.slug)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <div className="text-left">
              <div className="text-sm text-gray-600">Previous</div>
              <div className="font-medium">
                {previousSection.section_number} {previousSection.title}
              </div>
            </div>
          </button>
        )}
      </div>
      
      <div className="flex-1 text-right">
        {nextSection && (
          <button
            onClick={() => onSectionClick(nextSection.slug)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 group ml-auto"
          >
            <div className="text-right">
              <div className="text-sm text-gray-600">Next</div>
              <div className="font-medium">
                {nextSection.section_number} {nextSection.title}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </nav>
  );
};

// Main Documentation Site Component
interface FMDocsAppProps {
  supabaseUrl: string;
  supabaseKey: string;
  initialSlug?: string;
}

export const FMDocsApp: React.FC<FMDocsAppProps> = ({ 
  supabaseUrl, 
  supabaseKey, 
  initialSlug 
}) => {
  const [client] = useState(() => new FMDocsClient(supabaseUrl, supabaseKey));
  const [sections, setSections] = useState<Section[]>([]);
  const [currentContent, setCurrentContent] = useState<SectionContent | null>(null);
  const [relatedFigures, setRelatedFigures] = useState<any[]>([]);
  const [relatedTables, setRelatedTables] = useState<any[]>([]);
  const [navigation, setNavigation] = useState<{ previous_section: unknown; next_section: unknown }>({
    previous_section: null,
    next_section: null
  });
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching] = useState(false);
  const [showSearch] = useState(false);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load table of contents on mount
  useEffect(() => {
    loadTableOfContents();
  }, []);
  
  // Load initial section if provided
  useEffect(() => {
    if (initialSlug && sections.length > 0) {
      loadSection(initialSlug);
    }
  }, [initialSlug, sections]);
  
  const loadTableOfContents = async () => {
    try {
      const toc = await client.getTableOfContents();
      setSections(toc);
    } catch (err) {
      setError('Failed to load table of contents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const loadSection = async (slug: string) => {
    try {
      setLoading(true);
      
      // Load section content
      const content = await client.getSectionContent(slug);
      if (!content) {
        setError('Section not found');
        return;
      }
      
      setCurrentContent(content);
      
      // Load navigation
      const nav = await client.getSectionNavigation(slug);
      setNavigation(nav);
      
      // Load related figures and tables
      const allInlineFigures = content.blocks
        .flatMap(block => block.inline_figures || [])
        .filter((fig, index, arr) => arr.indexOf(fig) === index);
      
      const allInlineTables = content.blocks
        .flatMap(block => block.inline_tables || [])
        .filter((table, index, arr) => arr.indexOf(table) === index);
      
      if (allInlineFigures.length > 0) {
        const figures = await client.getRelatedFigures(allInlineFigures);
        setRelatedFigures(figures);
      } else {
        setRelatedFigures([]);
      }
      
      if (allInlineTables.length > 0) {
        const tables = await client.getRelatedTables(allInlineTables);
        setRelatedTables(tables);
      } else {
        setRelatedTables([]);
      }
      
      // Clear search when navigating to section
      setShowSearch(false);
      setSearchResults([]);
      
    } catch (err) {
      setError('Failed to load section');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = async (query: string) => {
    try {
      setIsSearching(true);
      const results = await client.searchDocs(query);
      setSearchResults(results);
      setShowSearch(true);
      setCurrentContent(null); // Hide section content when showing search
    } catch (err) {
      setError('Search failed');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSearchClear = () => {
    setShowSearch(false);
    setSearchResults([]);
  };
  
  const handleSectionClick = (slug: string) => {
    loadSection(slug);
    // Update URL without page reload
    window.history.pushState({}, '', `#${slug}`);
  };
  
  const handleSearchResultClick = (slug: string, blockId?: string) => {
    loadSection(slug);
    // Scroll to block after a short delay to ensure content is loaded
    if (blockId) {
      setTimeout(() => {
        const element = document.getElementById(`block-${blockId}`);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };
  
  if (loading && sections.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading FM Global 8-34...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        sections={sections}
        currentSlug={currentContent?.section_slug}
        onSectionClick={handleSectionClick}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search Bar */}
        <SearchBar 
          onSearch={handleSearch}
          onClear={handleSearchClear}
          isSearching={isSearching}
        />
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
              {error}
            </div>
          )}
          
          {showSearch ? (
            <SearchResults 
              results={searchResults}
              onResultClick={handleSearchResultClick}
            />
          ) : currentContent ? (
            <div className="p-8">
              <SectionContentView 
                content={currentContent}
                relatedFigures={relatedFigures}
                relatedTables={relatedTables}
              />
              
              <NavigationFooter 
                previousSection={navigation.previous_section}
                nextSection={navigation.next_section}
                onSectionClick={handleSectionClick}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  FM Global 8-34
                </h2>
                <p className="text-gray-600 mb-4">
                  Protection for Automatic Storage and Retrieval Systems (ASRS)
                </p>
                <p className="text-sm text-gray-500">
                  Select a section from the sidebar to begin reading, or use the search bar to find specific information.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export for use in Next.js pages
export default FMDocsApp;