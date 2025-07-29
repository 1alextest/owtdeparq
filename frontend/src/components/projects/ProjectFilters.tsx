import React, { useState, useEffect, useRef } from 'react';
import { Project } from '../../types';

export interface FilterOptions {
  search: string;
  industry: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
  deckCount: 'all' | 'none' | 'some' | 'many';
  sortBy: 'name' | 'created' | 'modified' | 'deckCount';
  sortOrder: 'asc' | 'desc';
}

interface ProjectFiltersProps {
  projects: Project[];
  onFilterChange: (filteredProjects: Project[], filters: FilterOptions) => void;
  className?: string;
}

const INDUSTRIES = [
  'All Industries',
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'E-commerce',
  'Manufacturing',
  'Real Estate',
  'Food & Beverage',
  'Transportation',
  'Entertainment',
  'Energy',
  'Agriculture',
  'Other'
];

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  projects,
  onFilterChange,
  className = ''
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    industry: 'All Industries',
    dateRange: 'all',
    deckCount: 'all',
    sortBy: 'modified',
    sortOrder: 'desc'
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const onFilterChangeRef = useRef(onFilterChange);

  // Update ref when callback changes
  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);

  useEffect(() => {
    const filteredProjects = applyFilters(projects, filters);
    onFilterChangeRef.current(filteredProjects, filters);
  }, [projects, filters]);

  const applyFilters = (projects: Project[], filters: FilterOptions): Project[] => {
    let filtered = [...projects];
    console.log('Applying filters:', filters, 'to', projects.length, 'projects');

    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      const beforeCount = filtered.length;
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(searchTerm) ||
        (project.description && project.description.toLowerCase().includes(searchTerm))
      );
      console.log('Search filter applied:', searchTerm, 'reduced from', beforeCount, 'to', filtered.length);
    }

    // Industry filter
    if (filters.industry !== 'All Industries') {
      const beforeCount = filtered.length;
      filtered = filtered.filter(project => {
        // For now, we'll use a simple heuristic based on project name/description
        // In a real app, you'd have an industry field in the project model
        const content = `${project.name} ${project.description || ''}`.toLowerCase();
        return content.includes(filters.industry.toLowerCase());
      });
      console.log('Industry filter applied:', filters.industry, 'reduced from', beforeCount, 'to', filtered.length);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const beforeCount = filtered.length;
      filtered = filtered.filter(project => {
        const projectDate = new Date(project.created_at || project.updated_at || '');
        return projectDate >= filterDate;
      });
      console.log('Date filter applied:', filters.dateRange, 'reduced from', beforeCount, 'to', filtered.length);
    }

    // Deck count filter
    if (filters.deckCount !== 'all') {
      const beforeCount = filtered.length;
      filtered = filtered.filter(project => {
        const deckCount = project.deck_count || 0;
        switch (filters.deckCount) {
          case 'none':
            return deckCount === 0;
          case 'some':
            return deckCount > 0 && deckCount <= 3;
          case 'many':
            return deckCount > 3;
          default:
            return true;
        }
      });
      console.log('Deck count filter applied:', filters.deckCount, 'reduced from', beforeCount, 'to', filtered.length);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created':
          aValue = new Date(a.created_at || '');
          bValue = new Date(b.created_at || '');
          break;
        case 'modified':
          aValue = new Date(a.updated_at || a.created_at || '');
          bValue = new Date(b.updated_at || b.created_at || '');
          break;
        case 'deckCount':
          aValue = a.deck_count || 0;
          bValue = b.deck_count || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    console.log('Final filtered result:', filtered.length, 'projects after all filters and sorting');
    return filtered;
  };

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      industry: 'All Industries',
      dateRange: 'all',
      deckCount: 'all',
      sortBy: 'modified',
      sortOrder: 'desc'
    });
  };

  const hasActiveFilters = filters.search || 
    filters.industry !== 'All Industries' || 
    filters.dateRange !== 'all' || 
    filters.deckCount !== 'all';

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 mb-6 ${className}`}>
      {/* Search Bar */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search projects..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
            showAdvancedFilters || hasActiveFilters
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          {/* Industry Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <select
              value={filters.industry}
              onChange={(e) => updateFilter('industry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {INDUSTRIES.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Created
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => updateFilter('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">Past week</option>
              <option value="month">Past month</option>
              <option value="year">Past year</option>
            </select>
          </div>

          {/* Deck Count Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deck Count
            </label>
            <select
              value={filters.deckCount}
              onChange={(e) => updateFilter('deckCount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">Any amount</option>
              <option value="none">No decks (0)</option>
              <option value="some">Few decks (1-3)</option>
              <option value="many">Many decks (4+)</option>
            </select>
          </div>

          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort by
            </label>
            <div className="flex space-x-2">
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="modified">Last modified</option>
                <option value="created">Created date</option>
                <option value="name">Name</option>
                <option value="deckCount">Deck count</option>
              </select>
              <button
                onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title={`Sort ${filters.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                <svg className={`w-4 h-4 transition-transform ${filters.sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};