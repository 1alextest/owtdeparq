# Auto-Save Components

This directory contains components for implementing auto-save functionality for project descriptions.

## Components

### AutoSaveTextarea

A textarea component with built-in auto-save functionality.

**Features:**
- Debounced auto-save (configurable delay)
- Save status indicators (saving, saved, error)
- Character count with warnings
- Manual save with Ctrl+S
- Retry logic for failed saves
- Error handling and recovery

**Usage:**
```tsx
import { AutoSaveTextarea } from '../common/AutoSaveTextarea';

<AutoSaveTextarea
  projectId="project-123"
  initialValue="Initial description"
  label="Project Description"
  placeholder="Enter description..."
  maxLength={1000}
  rows={3}
  onValueChange={(value) => setDescription(value)}
  debounceMs={500}
/>
```

### SaveStatusIndicator

A component that displays the current save status with appropriate icons and messages.

**Usage:**
```tsx
import { SaveStatusIndicator } from '../common/SaveStatusIndicator';

<SaveStatusIndicator
  status={saveStatus}
  lastSaved={lastSaved}
  error={error}
  onRetry={forceSave}
  onClearError={clearError}
/>
```

## Hooks

### useAutoSave

A custom hook that provides auto-save functionality for any input field.

**Features:**
- Debounced saving
- Retry logic with exponential backoff
- Status tracking
- Error handling

**Usage:**
```tsx
import { useAutoSave } from '../../hooks/useAutoSave';

const {
  saveStatus,
  lastSaved,
  error,
  forceSave,
  clearError
} = useAutoSave(projectId, value, {
  debounceMs: 500,
  maxRetries: 3,
  retryDelayMs: 1000
});
```

## API Integration

The auto-save functionality uses the `updateProjectDescription` method from the API client:

```typescript
await apiClient.updateProjectDescription(projectId, description);
```

This calls the `PATCH /projects/:id/description` endpoint which is optimized for frequent auto-save operations.