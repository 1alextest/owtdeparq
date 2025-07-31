import React from "react";
import { ProjectCard } from "../components/projects/ProjectCard";
import { Project } from "../types";

// Mock projects with varying description lengths to test card height consistency
const mockProjects: Project[] = [
  {
    id: "1",
    user_id: "user1",
    name: "Short Project",
    description: "Brief description.",
    deck_count: 2,
    presentation_count: 1,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    user_id: "user1",
    name: "Medium Length Project Name",
    description:
      "This is a medium-length description that provides more context about the project and its goals. It should demonstrate how the card handles moderate amounts of text.",
    deck_count: 1,
    presentation_count: 1,
    created_at: "2024-01-02T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
  },
  {
    id: "3",
    user_id: "user1",
    name: "Very Long Project Name That Might Wrap to Multiple Lines",
    description:
      "This is an extremely long description that contains a lot of detailed information about the project, its objectives, methodology, expected outcomes, and various other aspects that might be relevant to stakeholders. This text is intentionally verbose to test how the card handles very long descriptions and ensures consistent height across all cards regardless of content length.",
    deck_count: 5,
    presentation_count: 2,
    created_at: "2024-01-03T00:00:00Z",
    updated_at: "2024-01-03T00:00:00Z",
  },
  {
    id: "4",
    user_id: "user1",
    name: "No Description Project",
    description: "",
    deck_count: 0,
    presentation_count: 0,
    created_at: "2024-01-04T00:00:00Z",
    updated_at: "2024-01-04T00:00:00Z",
  },
  {
    id: "5",
    user_id: "user1",
    name: "Another Short One",
    description: "Just a quick note.",
    deck_count: 3,
    presentation_count: 2,
    created_at: "2024-01-05T00:00:00Z",
    updated_at: "2024-01-05T00:00:00Z",
  },
  {
    id: "6",
    user_id: "user1",
    name: "Moderate Project",
    description:
      "This project has a moderate description length that falls somewhere between the very short and very long examples, providing a good middle ground for testing.",
    deck_count: 2,
    presentation_count: 1,
    created_at: "2024-01-06T00:00:00Z",
    updated_at: "2024-01-06T00:00:00Z",
  },
];

/**
 * Card Height Test Component
 *
 * This component demonstrates the fixed card height issue and shows
 * how all cards now maintain consistent heights regardless of content length.
 */
export const CardHeightTest: React.FC = () => {
  const handleSelect = (project: Project) => {
    console.log("Selected project:", project.name);
  };

  const handleEdit = (project: Project) => {
    console.log("Edit project:", project.name);
  };

  const handleDelete = (project: Project) => {
    console.log("Delete project:", project.name);
  };

  const handleDuplicate = (project: Project) => {
    console.log("Duplicate project:", project.name);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎯 Card Height Consistency Test
          </h1>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2">
              ✅ Problem Fixed!
            </h2>
            <p className="text-green-700">
              All project cards now maintain consistent heights regardless of
              description length:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-green-600">
              <li>
                • <strong>Minimum height:</strong> 280px for all cards
              </li>
              <li>
                • <strong>Flexbox layout:</strong> Content distributed evenly
              </li>
              <li>
                • <strong>Fixed description area:</strong> 64px height with line
                clamping
              </li>
              <li>
                • <strong>Action buttons:</strong> Always positioned at the
                bottom
              </li>
              <li>
                • <strong>Responsive design:</strong> Maintains consistency
                across screen sizes
              </li>
            </ul>
          </div>
        </div>

        {/* Test Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>

        {/* Technical Details */}
        <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🔧 Technical Implementation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">CSS Changes:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>
                  • Added{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    h-full flex flex-col
                  </code>{" "}
                  to card container
                </li>
                <li>
                  • Set{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    min-h-[280px]
                  </code>{" "}
                  for consistent minimum height
                </li>
                <li>
                  • Used <code className="bg-gray-100 px-1 rounded">h-16</code>{" "}
                  for description area
                </li>
                <li>
                  • Applied{" "}
                  <code className="bg-gray-100 px-1 rounded">mt-auto</code> to
                  action buttons
                </li>
                <li>• Added custom line-clamp CSS utilities</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                Layout Structure:
              </h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Header section with title and actions</li>
                <li>• Fixed-height description area (64px)</li>
                <li>• Metadata section with consistent spacing</li>
                <li>• Action buttons anchored to bottom</li>
                <li>• Responsive design maintained</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Before/After Comparison */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            📊 Before vs After
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-red-700 mb-2">
                ❌ Before (Problems):
              </h4>
              <ul className="space-y-1 text-red-600">
                <li>• Cards had varying heights based on description length</li>
                <li>• Uneven grid layout looked unprofessional</li>
                <li>• Action buttons at different vertical positions</li>
                <li>• Poor visual hierarchy and alignment</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-700 mb-2">
                ✅ After (Fixed):
              </h4>
              <ul className="space-y-1 text-green-600">
                <li>• All cards maintain consistent 280px minimum height</li>
                <li>• Perfect grid alignment and professional appearance</li>
                <li>• Action buttons always at the same position</li>
                <li>• Clean, organized visual hierarchy</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardHeightTest;
