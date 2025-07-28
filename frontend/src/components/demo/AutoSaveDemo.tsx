import React, { useState } from 'react';
import { AutoSaveTextarea } from '../common/AutoSaveTextarea';

export const AutoSaveDemo: React.FC = () => {
  const [projectId] = useState('demo-project-123');
  const [description, setDescription] = useState('');

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Auto-Save Demo
      </h2>
      
      <p className="text-gray-600 mb-6">
        This demo shows the auto-save functionality for project descriptions. 
        Start typing and the description will be automatically saved after 500ms of inactivity.
      </p>

      <AutoSaveTextarea
        projectId={projectId}
        initialValue={description}
        label="Project Description"
        placeholder="Start typing to see auto-save in action..."
        maxLength={1000}
        rows={4}
        onValueChange={setDescription}
        debounceMs={500}
      />

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Features Demonstrated:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Debounced auto-save (500ms delay)</li>
          <li>• Save status indicators (saving, saved, error)</li>
          <li>• Character count with warnings</li>
          <li>• Manual save with Ctrl+S</li>
          <li>• Retry logic for failed saves</li>
          <li>• Error handling and recovery</li>
        </ul>
      </div>
    </div>
  );
};