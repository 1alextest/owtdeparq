import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../../types';
import { useNavigation } from '../../App';
import {
  getProjectStatusInfo,
  formatRelativeTime,
  getActionIcon,
  type ProjectAction
} from '../../utils/projectStatus';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onDuplicate?: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  const { navigate } = useNavigation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get enhanced project status information
  const statusInfo = getProjectStatusInfo(project);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    if (onEdit) {
      onEdit(project);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    if (onDelete) {
      onDelete(project);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    if (onDuplicate) {
      onDuplicate(project);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300 h-full flex flex-col min-h-[280px]">
      <div className="p-6 flex-1 flex flex-col">
        {/* Header with title and actions */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {project.name}
            </h3>
          </div>
          
          {/* Actions dropdown */}
          <div className="relative ml-4 flex-shrink-0" ref={dropdownRef}>
            <button
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
              onClick={handleDropdownToggle}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={handleEdit}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Project
                  </button>
                  
                  <button
                    onClick={handleDuplicate}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Duplicate Project
                  </button>

                  <hr className="my-1" />
                  
                  <button
                    onClick={handleDelete}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Project
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description with fixed height */}
        <div className="mb-4 h-16 flex items-start">
          {project.description ? (
            <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
              {project.description}
            </p>
          ) : (
            <p className="text-gray-400 text-sm italic">
              No description provided
            </p>
          )}
        </div>

        {/* Deck Count and Creation Date */}
        <div className="space-y-3 mb-4">
          {/* Deck Count with Visual Indicator */}
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${statusInfo.statusColor}`}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {statusInfo.deckCountText}
            </div>
            <span className="text-xs text-gray-500">
              {statusInfo.activityText}
            </span>
          </div>

          {/* Creation Date */}
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v1a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h2z" />
            </svg>
            <span className="truncate">
              Created {project.created_at ? formatDate(project.created_at) : 'Unknown'}
            </span>
          </div>
        </div>
        
        {/* Dynamic Action buttons - always at bottom */}
        <div className="flex space-x-2 mt-auto">
          <button
            onClick={() => onSelect(project)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Open Project
          </button>

          {/* Primary suggested action */}
          {statusInfo.suggestedActions.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const primaryAction = statusInfo.suggestedActions.find(a => a.priority === 'primary');
                if (primaryAction?.action === 'generate') {
                  navigate(`/projects/${project.id}/generate`);
                }
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center flex-shrink-0 ${
                statusInfo.suggestedActions.find(a => a.priority === 'primary')?.color || 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={getActionIcon(statusInfo.suggestedActions.find(a => a.priority === 'primary')?.icon || 'lightning')}
                />
              </svg>
              {statusInfo.suggestedActions.find(a => a.priority === 'primary')?.label || 'Generate'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};