import React, { useState, useEffect, useMemo } from 'react';

export interface Template {
  id: string;
  name: string;
  description: string;
  industry: string;
  category: 'startup' | 'corporate' | 'nonprofit' | 'academic';
  thumbnail: string;
  slideCount: number;
  tags: string[];
  popularity: number;
  isNew?: boolean;
  isPremium?: boolean;
}

interface TemplateLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => Promise<void>;
  loading?: boolean;
}

// Mock template data - in a real app, this would come from an API
const MOCK_TEMPLATES: Template[] = [
  {
    id: 'tech-startup-1',
    name: 'Tech Startup Pitch',
    description: 'Perfect for technology startups seeking seed or Series A funding',
    industry: 'Technology',
    category: 'startup',
    thumbnail: '/templates/tech-startup.jpg',
    slideCount: 12,
    tags: ['SaaS', 'B2B', 'Technology', 'Startup'],
    popularity: 95,
    isNew: true
  },
  {
    id: 'healthcare-1',
    name: 'Healthcare Innovation',
    description: 'Designed for healthcare and medical technology companies',
    industry: 'Healthcare',
    category: 'startup',
    thumbnail: '/templates/healthcare.jpg',
    slideCount: 14,
    tags: ['Healthcare', 'Medical', 'Innovation'],
    popularity: 88
  },
  {
    id: 'fintech-1',
    name: 'FinTech Solution',
    description: 'Tailored for financial technology and services companies',
    industry: 'Finance',
    category: 'startup',
    thumbnail: '/templates/fintech.jpg',
    slideCount: 13,
    tags: ['FinTech', 'Finance', 'Banking'],
    popularity: 92,
    isPremium: true
  },
  {
    id: 'ecommerce-1',
    name: 'E-commerce Platform',
    description: 'Ideal for online retail and marketplace businesses',
    industry: 'E-commerce',
    category: 'startup',
    thumbnail: '/templates/ecommerce.jpg',
    slideCount: 11,
    tags: ['E-commerce', 'Retail', 'Marketplace'],
    popularity: 85
  },
  {
    id: 'corporate-1',
    name: 'Corporate Strategy',
    description: 'Professional template for corporate presentations',
    industry: 'Corporate',
    category: 'corporate',
    thumbnail: '/templates/corporate.jpg',
    slideCount: 15,
    tags: ['Corporate', 'Strategy', 'Business'],
    popularity: 78
  },
  {
    id: 'nonprofit-1',
    name: 'Social Impact',
    description: 'Designed for nonprofits and social enterprises',
    industry: 'Nonprofit',
    category: 'nonprofit',
    thumbnail: '/templates/nonprofit.jpg',
    slideCount: 10,
    tags: ['Nonprofit', 'Social Impact', 'Charity'],
    popularity: 72
  }
];

const CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: '📋' },
  { id: 'startup', name: 'Startup', icon: '🚀' },
  { id: 'corporate', name: 'Corporate', icon: '🏢' },
  { id: 'nonprofit', name: 'Nonprofit', icon: '❤️' },
  { id: 'academic', name: 'Academic', icon: '🎓' }
];

const INDUSTRIES = [
  'All Industries',
  'Technology',
  'Healthcare',
  'Finance',
  'E-commerce',
  'Education',
  'Manufacturing',
  'Real Estate'
];

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  loading = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popularity' | 'name' | 'newest'>('popularity');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = MOCK_TEMPLATES.filter(template => {
      // Category filter
      if (selectedCategory !== 'all' && template.category !== selectedCategory) {
        return false;
      }

      // Industry filter
      if (selectedIndustry !== 'All Industries' && template.industry !== selectedIndustry) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      return true;
    });

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popularity':
          return b.popularity - a.popularity;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [selectedCategory, selectedIndustry, searchQuery, sortBy]);

  const handleTemplateSelect = async (template: Template) => {
    console.log('TemplateLibrary: Template selected, calling onSelectTemplate:', template);
    setIsProcessing(true);
    try {
      await onSelectTemplate(template);
      console.log('TemplateLibrary: Template selection completed, closing modal');
      onClose();
    } catch (error) {
      console.error('TemplateLibrary: Error selecting template:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Template Library</h2>
            <p className="text-gray-600 mt-1">Choose a professional template to get started quickly</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 p-4 overflow-y-auto">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="space-y-1">
                {CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Industries */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Industry</h3>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {INDUSTRIES.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Sort by</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="popularity">Most Popular</option>
                <option value="name">Name A-Z</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {loading ? (
              <TemplateGridSkeleton />
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={() => handleTemplateSelect(template)}
                    onPreview={() => setPreviewTemplate(template)}
                    isProcessing={isProcessing}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Template Preview Modal */}
        {previewTemplate && (
          <TemplatePreview
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            onSelect={() => handleTemplateSelect(previewTemplate)}
          />
        )}
      </div>
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: Template;
  onSelect: () => void;
  onPreview: () => void;
  isProcessing?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect, onPreview, isProcessing = false }) => {
  const handleSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('TemplateCard: Use Template button clicked for:', template.name);
    onSelect();
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('TemplateCard: Preview button clicked for:', template.name);
    onPreview();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Template Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-4xl text-blue-400">📊</div>
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex space-x-1">
          {template.isNew && (
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
              New
            </span>
          )}
          {template.isPremium && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
              Premium
            </span>
          )}
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
          <button
            onClick={handlePreview}
            className="bg-white text-gray-900 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Preview
          </button>
          <button
            onClick={handleSelect}
            disabled={isProcessing}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Use Template'
            )}
          </button>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm">{template.name}</h3>
          <div className="flex items-center text-xs text-gray-500">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {template.popularity}
          </div>
        </div>
        
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{template.description}</p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{template.slideCount} slides</span>
          <span>{template.industry}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {template.tags.slice(0, 2).map(tag => (
            <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
          {template.tags.length > 2 && (
            <span className="text-xs text-gray-400">+{template.tags.length - 2}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Template Preview Modal
interface TemplatePreviewProps {
  template: Template;
  onClose: () => void;
  onSelect: () => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, onClose, onSelect }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-60 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{template.name}</h3>
            <p className="text-gray-600">{template.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Template Preview */}
          <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center mb-6">
            <div className="text-center">
              <div className="text-6xl text-blue-400 mb-4">📊</div>
              <p className="text-gray-600">Template Preview</p>
              <p className="text-sm text-gray-500">{template.slideCount} slides included</p>
            </div>
          </div>

          {/* Template Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Template Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Industry:</span>
                  <span className="text-gray-900">{template.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="text-gray-900 capitalize">{template.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Slides:</span>
                  <span className="text-gray-900">{template.slideCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Popularity:</span>
                  <span className="text-gray-900">{template.popularity}%</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {template.tags.map(tag => (
                  <span key={tag} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSelect}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Use This Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading Skeleton
const TemplateGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="aspect-video bg-gray-200 animate-pulse" />
          <div className="p-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 bg-gray-200 rounded animate-pulse mb-3 w-3/4" />
            <div className="flex justify-between">
              <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};