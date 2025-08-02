import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../hooks/useNavigation';
import { Project } from '../types';
import { ProjectCard } from '../components/projects/ProjectCard';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { EditProjectModal } from '../components/projects/EditProjectModal';
import { EmptyState } from '../components/projects/EmptyState';
import { WelcomeFlow } from '../components/onboarding/WelcomeFlow';
import { apiClient } from '../services/apiClient';

export const Dashboard: React.FC = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { navigate } = useNavigation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showWelcomeFlow, setShowWelcomeFlow] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure user is authenticated before making API call
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Call the real API
      const projects = await apiClient.getProjects();
      
      // Ensure projects is always an array
      if (Array.isArray(projects)) {
        setProjects(projects);
        
        // If user has no projects and hasn't seen welcome, show it
        if (projects.length === 0 && !localStorage.getItem('hasSeenWelcome')) {
          setIsFirstTime(true);
          setShowWelcomeFlow(true);
        }
      } else {
        console.warn('API returned non-array projects data:', projects);
        setProjects([]);
      }
    } catch (err: any) {
      console.error('Error loading projects:', err);
      
      // Provide specific error messages based on the error type
      if (err.message?.includes('Authentication failed') || err.message?.includes('invalid-credential')) {
        setError('Authentication failed. Please try logging in again.');
        // Optionally trigger logout
        setTimeout(() => logout(), 2000);
      } else if (err.message?.includes('User not authenticated')) {
        setError('Please log in to view your projects.');
      } else {
        setError('Failed to load projects. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [user, logout]);

  // Load projects when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      loadProjects();
    }
  }, [user, authLoading, loadProjects]); // Load projects when user state changes

  // Check if this is a first-time user
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome && user && !authLoading) {
      setIsFirstTime(true);
      setShowWelcomeFlow(true);
    }
  }, [user, authLoading]);

  const handleCreateProject = async (name: string, description?: string) => {
    try {
      setCreateLoading(true);

      // Ensure user is authenticated before making API call
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Call the real API
      const newProject = await apiClient.createProject({
        name,
        description,
      });

      // Add the new project to the list
      setProjects(prev => [newProject, ...prev]);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      console.error('Error creating project:', err);
      
      // Provide more specific error messages
      if (err.message?.includes('Authentication failed') || err.message?.includes('invalid-credential')) {
        throw new Error('Authentication failed. Please try logging in again.');
      } else if (err.message?.includes('User not authenticated')) {
        throw new Error('Please log in to create a project.');
      } else {
        throw new Error('Failed to create project. Please try again.');
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSelectProject = (project: Project) => {
    console.log('Selected project:', project);
    // Navigate to project detail page
    navigate(`/projects/${project.id}`);
  };

  const handleGenerateForProject = (project: Project) => {
    console.log('Generate for project:', project);
    // TODO: Navigate to generation page
    // For now, we'll implement this in the next task
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  };

  const handleUpdateProject = async (projectId: string, name: string, description?: string) => {
    try {
      setEditLoading(true);
      
      // Call the real API
      const updatedProject = await apiClient.updateProject(projectId, {
        name,
        description,
      });

      // Update the project in the list
      setProjects(prev => prev.map(p =>
        p.id === projectId ? updatedProject : p
      ));
      
      setIsEditModalOpen(false);
      setSelectedProject(null);
    } catch (err) {
      console.error('Error updating project:', err);
      throw new Error('Failed to update project. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    try {
      await apiClient.deleteProject(project.id);
      
      // Remove project from local state
      setProjects(prev => prev.filter(p => p.id !== project.id));
      
      // Show success message
      alert(`Project "${project.name}" has been deleted successfully.`);
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  const handleDuplicateProject = async (project: Project) => {
    try {
      // Create a duplicate with a modified name
      const duplicateName = `${project.name} (Copy)`;
      const duplicatedProject = await apiClient.createProject({
        name: duplicateName,
        description: project.description,
      });

      // Add the new project to the list at the beginning
      setProjects(prev => [duplicatedProject, ...prev]);
      
      // Show success message
      alert(`Project "${duplicateName}" has been created successfully.`);
    } catch (err) {
      console.error('Error duplicating project:', err);
      alert('Failed to duplicate project. Please try again.');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleWelcomeComplete = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setShowWelcomeFlow(false);
    setIsFirstTime(false);
  };

  const handleQuickStart = () => {
    setShowWelcomeFlow(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <>
      {/* Welcome Flow */}
      {showWelcomeFlow && (
        <WelcomeFlow onComplete={handleWelcomeComplete} />
      )}

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Your Projects
              </h1>
              <p className="text-sm text-gray-500">
                {Array.isArray(projects) && projects.length > 0 
                  ? `${projects.length} project${projects.length !== 1 ? 's' : ''}`
                  : 'Create your first presentation project'
                }
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {Array.isArray(projects) && projects.length > 0 && (
                <button
                  onClick={handleQuickStart}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center text-sm font-medium"
                >
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Start
                </button>
              )}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center text-sm font-medium"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Project
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading projects...</p>
            </div>
          ) : !Array.isArray(projects) || projects.length === 0 ? (
            <EmptyState 
              onCreateProject={() => setIsCreateModalOpen(true)} 
              onQuickStart={handleQuickStart}
            />
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-900">
                  Your Projects ({Array.isArray(projects) ? projects.length : 0})
                </h2>
                <button
                  onClick={loadProjects}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch project-card-grid">
                {Array.isArray(projects) && projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onSelect={handleSelectProject}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                    onDuplicate={handleDuplicateProject}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
        loading={createLoading}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProject(null);
        }}
        onSubmit={handleUpdateProject}
        project={selectedProject}
        loading={editLoading}
      />
    </>
  );
};