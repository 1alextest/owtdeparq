import React from 'react';
import { Project } from '../../types';
import { useNavigation } from '../../App';
import {
  getProjectStatusInfo,
  formatRelativeTime,
  getActionIcon
} from '../../utils/projectStatus';

interface ProjectListViewProps {
  projects: Project[];
  onSelect: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onDuplicate: (project: Project) => void;
}

export const ProjectListView: React.FC<ProjectListViewProps> = ({
  projects,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  const { navigate } = useNavigation();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-4">Project</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-2">Last Activity</div>
          <div className="col-span-2">Actions</div>
        </div>
      </div>

      {/* Project List */}
      <div className="divide-y divide-gray-200">
        {projects.map((project) => (
          <div
            key={project.id}
            className="px-6 py-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Project Info */}
              <div className="col-span-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => onSelect(project)}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors text-left"
                    >
                      {project.name}
                    </button>
                    {project.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Status */}
              <div className="col-span-2">
                {(() => {
                  const statusInfo = getProjectStatusInfo(project);
                  return (
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.statusColor}`}>
                        {statusInfo.statusText}
                      </span>
                      <div className="text-xs text-gray-400">
                        {statusInfo.activityText}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Created Date */}
              <div className="col-span-2">
                <span className="text-sm text-gray-500">
                  {formatDate(project.created_at)}
                </span>
              </div>

              {/* Last Activity */}
              <div className="col-span-2">
                <span className="text-sm text-gray-500">
                  {(() => {
                    const statusInfo = getProjectStatusInfo(project);
                    return statusInfo.lastActivityDate
                      ? formatRelativeTime(statusInfo.lastActivityDate)
                      : 'No activity';
                  })()}
                </span>
              </div>

              {/* Dynamic Actions */}
              <div className="col-span-2">
                {(() => {
                  const statusInfo = getProjectStatusInfo(project);
                  const primaryAction = statusInfo.suggestedActions.find(a => a.priority === 'primary');
                  const secondaryAction = statusInfo.suggestedActions.find(a => a.priority === 'secondary');

                  return (
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Primary Action */}
                      {primaryAction && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (primaryAction.action === 'generate') {
                              navigate(`/projects/${project.id}/generate`);
                            }
                          }}
                          className="p-1.5 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                          title={primaryAction.label}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getActionIcon(primaryAction.icon)} />
                          </svg>
                        </button>
                      )}

                      {/* Secondary Action */}
                      {secondaryAction && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (secondaryAction.action === 'edit') {
                              onEdit(project);
                            }
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                          title={secondaryAction.label}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getActionIcon(secondaryAction.icon)} />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="px-6 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new project</p>
        </div>
      )}
    </div>
  );
};