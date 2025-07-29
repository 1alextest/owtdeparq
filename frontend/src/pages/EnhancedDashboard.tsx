import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../App';
import { Project } from '../types';
import { DraggableProjectGrid } from '../components/projects/DraggableProjectGrid';
import { ProjectListView } from '../components/projects/ProjectListView';
import { ProjectFilters, FilterOptions } from '../components/projects/ProjectFilters';
import { TemplateLibrary, Template } from '../components/templates/TemplateLibrary';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import { EditProjectModal } from '../components/projects/EditProjectModal';
import { EmptyState } from '../components/projects/EmptyState';
import { WelcomeFlow } from '../components/onboarding/WelcomeFlow';
import { useLazyLoading, useIntersectionObserver } from '../hooks/useLazyLoading';
import { apiClient } from '../services/apiClient';

export const EnhancedDashboard: React.FC = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { navigate } = useNavigation();
  
  // State management
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  const [showWelcomeFlow, setShowWelcomeFlow] = useState(false);
  
  // Loading states
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  
  // Selected project for editing
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // View preferences
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showArchived, setShowArchived] = useState(false);
  
  // Lazy loading for performance
  const {
    visibleItems: visibleProjects,
    isLoading: isLoadingMore,
    hasMore,
    loadMore,
    reset: resetLazyLoading
  } = useLazyLoading({
    items: filteredProjects,
    pageSize: 12,
    loadDelay: 200
  });

  // Intersection observer for infinite scroll
  const loadMoreRef = useIntersectionObserver(
    useCallback(() => {
      if (hasMore && !isLoadingMore) {
        loadMore();
      }
    }, [hasMore, isLoadingMore, loadMore])
  );

  // Load projects
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const projects = await apiClient.getProjects();
      
      if (Array.isArray(projects)) {
        setAllProjects(projects);
        setFilteredProjects(projects);
        
        // Show welcome flow for new users
        if (projects.length === 0 && !localStorage.getItem('hasSeenWelcome')) {
          setShowWelcomeFlow(true);
        }
      } else {
        console.warn('API returned non-array projects data:', projects);
        setAllProjects([]);
        setFilteredProjects([]);
      }
    } catch (err: any) {
      console.error('Error loading projects:', err);
      
      if (err.message?.includes('Authentication failed') || err.message?.includes('invalid-credential')) {
        setError('Authentication failed. Please try logging in again.');
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

  // Load projects on mount
  useEffect(() => {
    if (user && !authLoading) {
      loadProjects();
    }
  }, [user, authLoading, loadProjects]);

  // Check for first-time user
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome && user && !authLoading) {
      setShowWelcomeFlow(true);
    }
  }, [user, authLoading]);

  // Handle filter changes
  const handleFilterChange = useCallback((filtered: Project[], filters: FilterOptions) => {
    setFilteredProjects(filtered);
    resetLazyLoading();
  }, [resetLazyLoading]);

  // Handle project reordering (drag and drop)
  const handleProjectsReorder = useCallback(async (reorderedProjects: Project[]) => {
    try {
      // Update local state immediately for better UX
      setFilteredProjects(reorderedProjects);
      
      // TODO: Send reorder to backend
      // await apiClient.reorderProjects(reorderedProjects.map(p => p.id));
      
      console.log('Projects reordered:', reorderedProjects.map(p => p.name));
    } catch (err) {
      console.error('Error reordering projects:', err);
      // Revert on error
      loadProjects();
    }
  }, [loadProjects]);

  // Handle template selection
  const handleTemplateSelect = useCallback(async (template: Template) => {
    console.log('Template selected:', template);
    
    if (!user) {
      setError('Please log in to create a project from template.');
      return;
    }

    try {
      setTemplateLoading(true);
      console.log('Creating project from template...');
      
      // Create project from template
      const newProject = await apiClient.createProject({
        name: `${template.name} Project`,
        description: `Created from ${template.name} template`,
        // TODO: Add template-specific data
      });

      console.log('Project created successfully:', newProject);

      // Add to projects list
      setAllProjects(prev => [newProject, ...prev]);
      setFilteredProjects(prev => [newProject, ...prev]);
      
      // Navigate to generation with template context
      console.log('Navigating to generation page...');
      navigate(`/projects/${newProject.id}/generate?template=${template.id}`);
    } catch (err: any) {
      console.error('Error creating project from template:', err);
      setError(`Failed to create project from template: ${err.message}`);
    } finally {
      setTemplateLoading(false);
    }
  }, [navigate, user]);

  // Standard project operations
  const handleCreateProject = useCallback(async (name: string, description?: string) => {
    try {
      setCreateLoading(true);

      if (!user) {
        throw new Error('User not authenticated');
      }

      const newProject = await apiClient.createProject({ name, description });
      
      setAllProjects(prev => [newProject, ...prev]);
      setFilteredProjects(prev => [newProject, ...prev]);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      console.error('Error creating project:', err);
      throw new Error('Failed to create project. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  }, [user]);

  const handleSelectProject = useCallback((project: Project) => {
    navigate(`/projects/${project.id}`);
  }, [navigate]);

  const handleEditProject = useCallback((project: Project) => {
    setSelectedProject(project);
    setIsEditModalOpen(true);
  }, []);

  const handleUpdateProject = useCallback(async (projectId: string, name: string, description?: string) => {
    try {
      setEditLoading(true);
      
      const updatedProject = await apiClient.updateProject(projectId, { name, description });

      setAllProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
      setFilteredProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
      
      setIsEditModalOpen(false);
      setSelectedProject(null);
    } catch (err) {
      console.error('Error updating project:', err);
      throw new Error('Failed to update project. Please try again.');
    } finally {
      setEditLoading(false);
    }
  }, []);

  const handleDeleteProject = useCallback(async (project: Project) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    try {
      await apiClient.deleteProject(project.id);
      
      setAllProjects(prev => prev.filter(p => p.id !== project.id));
      setFilteredProjects(prev => prev.filter(p => p.id !== project.id));
      
      // Show success message
      alert(`Project "${project.name}" has been deleted successfully.`);
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project. Please try again.');
    }
  }, []);

  const handleDuplicateProject = useCallback(async (project: Project) => {
    try {
      const duplicateName = `${project.name} (Copy)`;
      const duplicatedProject = await apiClient.createProject({
        name: duplicateName,
        description: project.description,
      });

      setAllProjects(prev => [duplicatedProject, ...prev]);
      setFilteredProjects(prev => [duplicatedProject, ...prev]);
      
      alert(`Project "${duplicateName}" has been created successfully.`);
    } catch (err) {
      console.error('Error duplicating project:', err);
      alert('Failed to duplicate project. Please try again.');
    }
  }, []);

  const handleWelcomeComplete = useCallback(() => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setShowWelcomeFlow(false);
  }, []);

  const handleQuickStart = useCallback(() => {
    setShowWelcomeFlow(true);
  }, []);

  // Memoized stats
  const projectStats = useMemo(() => {
    const totalProjects = allProjects.length;
    const totalDecks = allProjects.reduce((sum, project) => sum + (project.deck_count || 0), 0);
    const recentProjects = allProjects.filter(project => {
      const projectDate = new Date(project.created_at || '');
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return projectDate >= weekAgo;
    }).length;

    return { totalProjects, totalDecks, recentProjects };
  }, [allProjects]);

  // Loading state
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

      {/* Template Library */}
      <TemplateLibrary
        isOpen={isTemplateLibraryOpen}
        onClose={() => setIsTemplateLibraryOpen(false)}
        onSelectTemplate={handleTemplateSelect}
        loading={templateLoading}
      />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Your Projects
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                <span>{projectStats.totalProjects} projects</span>
                <span>•</span>
                <span>{projectStats.totalDecks} decks</span>
                <span>•</span>
                <span>{projectStats.recentProjects} created this week</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Grid view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="List view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Action Buttons */}
              {allProjects.length > 0 && (
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
                onClick={() => setIsTemplateLibraryOpen(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center text-sm font-medium"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 011-1h6a1 1 0 011 1v2M7 7h10" />
                </svg>
                Templates
              </button>
              
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
          {/* Error Display */}
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
          ) : allProjects.length === 0 ? (
            <EmptyState 
              onCreateProject={() => setIsCreateModalOpen(true)} 
              onQuickStart={handleQuickStart}
            />
          ) : (
            <>
              {/* Filters */}
              <ProjectFilters
                projects={allProjects}
                onFilterChange={handleFilterChange}
                className="mb-6"
              />

              {/* Projects Grid/List */}
              {filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No projects found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
                </div>
              ) : (
                <>
                  {viewMode === 'grid' ? (
                    <DraggableProjectGrid
                      projects={visibleProjects}
                      onProjectsReorder={handleProjectsReorder}
                      onSelect={handleSelectProject}
                      onEdit={handleEditProject}
                      onDelete={handleDeleteProject}
                      onDuplicate={handleDuplicateProject}
                    />
                  ) : (
                    <ProjectListView
                      projects={visibleProjects}
                      onSelect={handleSelectProject}
                      onEdit={handleEditProject}
                      onDelete={handleDeleteProject}
                      onDuplicate={handleDuplicateProject}
                    />
                  )}

                  {/* Load More Trigger */}
                  {hasMore && (
                    <div ref={loadMoreRef} className="flex justify-center py-8">
                      {isLoadingMore ? (
                        <div className="flex items-center space-x-2 text-gray-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">Loading more projects...</span>
                        </div>
                      ) : (
                        <button
                          onClick={loadMore}
                          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Load More Projects
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
        loading={createLoading}
      />

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