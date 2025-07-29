import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Project } from '../../types';
import { ProjectCard } from './ProjectCard';

interface DraggableProjectGridProps {
  projects: Project[];
  onProjectsReorder: (projects: Project[]) => void;
  onSelect: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onDuplicate: (project: Project) => void;
}

interface SortableProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onDuplicate: (project: Project) => void;
  isDragging?: boolean;
}

const SortableProjectCard: React.FC<SortableProjectCardProps> = ({
  project,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  isDragging = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${isSortableDragging ? 'z-50' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing bg-white rounded-lg shadow-md p-2 hover:bg-gray-50"
        title="Drag to reorder"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {/* Project Card */}
      <div className={`transition-all duration-200 ${isSortableDragging ? 'scale-105 shadow-2xl' : ''}`}>
        <ProjectCard
          project={project}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      </div>

      {/* Drag Overlay Indicator */}
      {isSortableDragging && (
        <div className="absolute inset-0 bg-blue-100 border-2 border-blue-300 border-dashed rounded-xl opacity-50" />
      )}
    </div>
  );
};

export const DraggableProjectGrid: React.FC<DraggableProjectGridProps> = ({
  projects,
  onProjectsReorder,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const project = projects.find(p => p.id === active.id);
    setDraggedProject(project || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = projects.findIndex(project => project.id === active.id);
      const newIndex = projects.findIndex(project => project.id === over?.id);

      const reorderedProjects = arrayMove(projects, oldIndex, newIndex);
      onProjectsReorder(reorderedProjects);
    }

    setActiveId(null);
    setDraggedProject(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDraggedProject(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={projects.map(p => p.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {projects.map((project) => (
            <SortableProjectCard
              key={project.id}
              project={project}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              isDragging={activeId === project.id}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && draggedProject ? (
          <div className="transform rotate-3 scale-105">
            <ProjectCard
              project={draggedProject}
              onSelect={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              onDuplicate={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};