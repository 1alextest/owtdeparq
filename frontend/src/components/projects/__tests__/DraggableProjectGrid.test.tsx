import React from 'react';
import { render, screen } from '@testing-library/react';
import { DraggableProjectGrid } from '../DraggableProjectGrid';
import { Project } from '../../../types';

// Mock @dnd-kit modules
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
  DragOverlay: ({ children }: { children: React.ReactNode }) => <div data-testid="drag-overlay">{children}</div>,
}));

jest.mock('@dnd-kit/sortable', () => ({
  arrayMove: jest.fn((array, oldIndex, newIndex) => {
    const result = [...array];
    const [removed] = result.splice(oldIndex, 1);
    result.splice(newIndex, 0, removed);
    return result;
  }),
  SortableContext: ({ children }: { children: React.ReactNode }) => <div data-testid="sortable-context">{children}</div>,
  sortableKeyboardCoordinates: jest.fn(),
  rectSortingStrategy: jest.fn(),
  useSortable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

jest.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: jest.fn(() => ''),
    },
  },
}));

const mockProjects: Project[] = [
  {
    id: '1',
    user_id: 'user1',
    name: 'Test Project 1',
    description: 'Test description 1',
    deck_count: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'user1',
    name: 'Test Project 2',
    description: 'Test description 2',
    deck_count: 1,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

const mockProps = {
  projects: mockProjects,
  onProjectsReorder: jest.fn(),
  onSelect: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onDuplicate: jest.fn(),
};

describe('DraggableProjectGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders projects in a grid layout', () => {
    render(<DraggableProjectGrid {...mockProps} />);
    
    expect(screen.getByTestId('dnd-context')).toBeInTheDocument();
    expect(screen.getByTestId('sortable-context')).toBeInTheDocument();
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
  });

  it('renders drag handles for each project', () => {
    render(<DraggableProjectGrid {...mockProps} />);
    
    // Should have drag handles (one for each project)
    const dragHandles = screen.getAllByTitle('Drag to reorder');
    expect(dragHandles).toHaveLength(2);
  });

  it('applies correct grid classes', () => {
    render(<DraggableProjectGrid {...mockProps} />);
    
    const gridContainer = screen.getByTestId('sortable-context').firstChild;
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'gap-6', 'sm:grid-cols-2', 'lg:grid-cols-3');
  });
});