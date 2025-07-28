import React, { useState, useEffect } from 'react';
import { validateData } from '../../types/validation';
import { ProjectSchema, Project } from '../../types';
import { AutoSaveTextarea } from '../common/AutoSaveTextarea';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectId: string, name: string, description?: string) => Promise<void>;
  project: Project | null;
  loading?: boolean;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  project,
  loading = false
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Populate form when project changes
  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!project) return;
    
    // Clear previous validation errors
    setValidationErrors([]);
    
    // Validate project data
    const projectData = {
      id: project.id,
      user_id: project.user_id,
      name: name.trim(),
      description: description.trim() || undefined,
      deck_count: project.deck_count || 0
    };
    
    const validation = validateData(ProjectSchema, projectData);
    if (!validation.success) {
      setValidationErrors(validation.errors || []);
      return;
    }
    
    try {
      await onSubmit(project.id, name.trim(), description.trim() || undefined);
      onClose();
    } catch (error) {
      // Error handling is done by parent component
    }
  };

  const handleClose = () => {
    // Reset form to original values
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
    }
    setValidationErrors([]);
    onClose();
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Edit Project
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="editProjectName" className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                id="editProjectName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter project name"
                required
                disabled={loading}
                maxLength={100}
              />
            </div>

            <div>
              <AutoSaveTextarea
                projectId={project.id}
                initialValue={description}
                label="Description (Optional)"
                placeholder="Brief description of your project"
                maxLength={1000}
                rows={3}
                disabled={loading}
                onValueChange={setDescription}
                debounceMs={500}
              />
            </div>

            {/* Display validation errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <ul className="text-sm text-red-600 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};