import React, { useState } from "react";
import {
  ProjectFilters,
  FilterOptions,
} from "../components/projects/ProjectFilters";
import { Project } from "../types";

// Mock projects for testing filters
const mockProjects: Project[] = [
  {
    id: "1",
    user_id: "user1",
    name: "TechFlow SaaS Platform",
    description:
      "A technology startup building software solutions for businesses",
    deck_count: 2,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-20T15:30:00Z",
  },
  {
    id: "2",
    user_id: "user1",
    name: "HealthCare Innovation",
    description: "Medical device startup focused on healthcare technology",
    deck_count: 0,
    created_at: "2024-01-10T09:00:00Z",
    updated_at: "2024-01-10T09:00:00Z",
  },
  {
    id: "3",
    user_id: "user1",
    name: "FinTech Payment Solution",
    description: "Financial technology platform for digital payments",
    deck_count: 5,
    created_at: "2024-01-05T14:00:00Z",
    updated_at: "2024-01-25T11:00:00Z",
  },
  {
    id: "4",
    user_id: "user1",
    name: "E-commerce Marketplace",
    description: "Online retail platform connecting buyers and sellers",
    deck_count: 1,
    created_at: "2023-12-20T16:00:00Z",
    updated_at: "2024-01-18T12:00:00Z",
  },
  {
    id: "5",
    user_id: "user1",
    name: "Green Energy Startup",
    description: "Renewable energy solutions for residential customers",
    deck_count: 3,
    created_at: "2024-01-01T08:00:00Z",
    updated_at: "2024-01-22T10:00:00Z",
  },
];

export const FilterTest: React.FC = () => {
  const [filteredProjects, setFilteredProjects] =
    useState<Project[]>(mockProjects);
  const [currentFilters, setCurrentFilters] = useState<FilterOptions | null>(
    null
  );

  const handleFilterChange = (filtered: Project[], filters: FilterOptions) => {
    console.log("Filter change triggered:", {
      filters,
      resultCount: filtered.length,
    });
    setFilteredProjects(filtered);
    setCurrentFilters(filters);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Filter Functionality Test
        </h1>
        <p className="text-gray-600">
          Test the ProjectFilters component to verify all filtering options work
          correctly.
        </p>
      </div>

      {/* Filter Component */}
      <ProjectFilters
        projects={mockProjects}
        onFilterChange={handleFilterChange}
        className="mb-8"
      />

      {/* Current Filter Status */}
      {currentFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Current Filters Applied:
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">Search:</span>
              <span className="ml-2 text-blue-700">
                {currentFilters.search || "None"}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Industry:</span>
              <span className="ml-2 text-blue-700">
                {currentFilters.industry}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Date Range:</span>
              <span className="ml-2 text-blue-700">
                {currentFilters.dateRange}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Deck Count:</span>
              <span className="ml-2 text-blue-700">
                {currentFilters.deckCount}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Sort By:</span>
              <span className="ml-2 text-blue-700">
                {currentFilters.sortBy} ({currentFilters.sortOrder})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">
          Filter Results: {filteredProjects.length} of {mockProjects.length}{" "}
          projects
        </h3>
        {filteredProjects.length === 0 && (
          <p className="text-red-600 text-sm">
            No projects match the current filters. Try adjusting your search
            criteria.
          </p>
        )}
      </div>

      {/* Filtered Projects Display */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Filtered Projects:
        </h3>
        {filteredProjects.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              No projects found with current filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <h4 className="font-semibold text-gray-900 mb-2">
                  {project.name}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {project.description}
                </p>
                <div className="space-y-1 text-xs text-gray-500">
                  <div>
                    <span className="font-medium">Decks:</span>{" "}
                    {project.deck_count}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(project.created_at || "").toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span>{" "}
                    {new Date(project.updated_at || "").toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Instructions */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">
          🧪 Test Instructions:
        </h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>
            • <strong>Search Test:</strong> Try searching for "tech", "health",
            or "payment"
          </li>
          <li>
            • <strong>Industry Test:</strong> Select "Technology", "Healthcare",
            or "Finance"
          </li>
          <li>
            • <strong>Date Test:</strong> Try "Past week", "Past month" filters
          </li>
          <li>
            • <strong>Deck Count Test:</strong> Filter by "No decks", "Few
            decks", "Many decks"
          </li>
          <li>
            • <strong>Sort Test:</strong> Change sort order and direction
          </li>
          <li>
            • <strong>Combined Test:</strong> Use multiple filters together
          </li>
        </ul>
      </div>
    </div>
  );
};
