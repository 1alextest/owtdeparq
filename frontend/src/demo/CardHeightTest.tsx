import React from 'react';
import { ProjectCard } from '../components/projects/ProjectCard';
import { Project } from '../types';

/**
 * Card Height Test Component
 * 
 * This component demonstrates that project cards now have consistent heights
 * regardless of description length.
 */
export const CardHeightTest: React.FC = () => {
  // Test projects with varying description lengths
  const testProjects: Project[] = [
    {
      id: '1',
      user_id: 'user1',
      name: 'Short Description Project',
      description: 'Brief description.',
      deck_count: 2,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      user_id: 'user1',
      name: 'Medium Length Description Project',
      description: 'This is a medium-length description that provides more context about the project and its goals. It should demonstrate how the card handles moderate amounts of text.',
      deck_count: 1,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
    {
      id: '3',
      user_id: 'user1',
      name: 'Very Long Description Project',
      description: 'This is an extremely long description that goes on and on about the project details, objectives, methodology, expected outcomes, team members, timeline, budget considerations, risk factors, success metrics, and various other aspects that might be included in a comprehensive project description. This text is intentionally verbose to test how the card handles overflow content and maintains consistent height across the grid layout.',
      deck_count: 5,
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z',
    },
    {
      id: '4',
      user_id: 'user1',
      name: 'No Description Project',
      description: '',
      deck_count: 0,
      created_at: '2024-01-04T00:00:00Z',
      updated_at: '2024-01-04T00:00:00Z',
    },
    {
      id: '5',
      user_id: 'user1',
      name: 'Project with Very Long Title That Might Wrap to Multiple Lines',
      description: 'Standard description length for testing title wrapping behavior.',
      deck_count: 3,
      created_at: '2024-01-05T00:00:00Z',
      updated_at: '2024-01-05T00:00:00Z',
    },
    {
      id: '6',
      user_id: 'user1',
      name: 'Regular Project',
      description: 'A normal project description that fits comfortably within the expected length parameters.',
      deck_count: 1,
      created_at: '2024-01-06T00:00:00Z',
      updated_at: '2024-01-06T00:00:00Z',
    },
  ];

  const handleProjectAction = (project: Project) => {
    console.log('Project action:', project.name);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          📐 Card Height Consistency Test
        </h1>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-green-800 mb-2">
            ✅ Fixed: Consistent Card Heights
          </h2>
          <p className="text-green-700 mb-2">
            All project cards now have consistent heights regardless of content length:
          </p>
          <ul className="text-sm text-green-600 space-y-1">
            <li>• <strong>Flexbox layout</strong> ensures equal heights</li>
            <li>• <strong>Line clamping</strong> truncates long descriptions</li>
            <li>• <strong>Fixed content areas</strong> for title, description, metadata</li>
            <li>• <strong>Buttons anchored</strong> to bottom of each card</li>
            <li>• <strong>Responsive design</strong> maintains consistency across screen sizes</li>
          </ul>
        </div>
      </div>

      {/* Test Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch project-card-grid">
        {testProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onSelect={handleProjectAction}
            onEdit={handleProjectAction}
            onDelete={handleProjectAction}
            onDuplicate={handleProjectAction}
          />
        ))}
      </div>

      {/* Technical Details */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">
          🔧 Technical Implementation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-blue-700 mb-2">CSS Flexbox Structure</h4>
            <ul className="text-blue-600 space-y-1">
              <li>• <code>h-full flex flex-col</code> on card container</li>
              <li>• <code>flex-1</code> on content area</li>
              <li>• <code>mt-auto</code> on action buttons</li>
              <li>• <code>items-stretch</code> on grid container</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Content Management</h4>
            <ul className="text-blue-600 space-y-1">
              <li>• <code>line-clamp-2</code> for titles</li>
              <li>• <code>line-clamp-3</code> for descriptions</li>
              <li>• <code>truncate</code> for metadata</li>
              <li>• Fallback text for empty descriptions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Visual Guide */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          👁️ Visual Verification Guide
        </h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>What to look for:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>All cards in each row should have the same height</li>
            <li>Long descriptions should be truncated with "..." at the end</li>
            <li>Action buttons should be aligned at the bottom of each card</li>
            <li>Empty descriptions should show "No description provided"</li>
            <li>Long titles should wrap to maximum 2 lines</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CardHeightTest;