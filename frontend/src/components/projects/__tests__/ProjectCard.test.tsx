import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectCard } from '../ProjectCard';
import { Project } from '../../../types';

describe('ProjectCard', () => {
  const mockProject: Project = {
    id: '1',
    user_id: 'user1',
    name: 'Test Project',
    description: 'This is a test project description',
    deck_count: 3,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-20T15:30:00Z'
  };

  const mockOnSelect = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders project information correctly', () => {
    render(
      <ProjectCard
        project={mockProject}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('This is a test project description')).toBeInTheDocument();
    expect(screen.getByText('3 decks')).toBeInTheDocument();
    expect(screen.getByText(/Created/)).toBeInTheDocument();
  });

  test('handles singular deck count correctly', () => {
    const projectWithOneDeck = { ...mockProject, deck_count: 1 };
    
    render(
      <ProjectCard
        project={projectWithOneDeck}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('1 deck')).toBeInTheDocument();
  });

  test('renders without description', () => {
    const projectWithoutDescription = { ...mockProject, description: undefined };
    
    render(
      <ProjectCard
        project={projectWithoutDescription}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.queryByText('This is a test project description')).not.toBeInTheDocument();
  });

  test('calls onSelect when Open Project button is clicked', () => {
    render(
      <ProjectCard
        project={mockProject}
        onSelect={mockOnSelect}
      />
    );

    fireEvent.click(screen.getByText('Open Project'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockProject);
  });

  test('calls onEdit when Edit button is clicked', () => {
    render(
      <ProjectCard
        project={mockProject}
        onSelect={mockOnSelect}
        onEdit={mockOnEdit}
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockProject);
  });

  test('does not render Edit button when onEdit is not provided', () => {
    render(
      <ProjectCard
        project={mockProject}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  test('handles missing created_at date', () => {
    const projectWithoutDate = { ...mockProject, created_at: undefined };
    
    render(
      <ProjectCard
        project={projectWithoutDate}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText(/Created Unknown/)).toBeInTheDocument();
  });
});