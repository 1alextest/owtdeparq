import { Project } from '../types';

export type ProjectStatus = 
  | 'draft'      // No decks created yet
  | 'active'     // Has decks, recently modified
  | 'completed'  // Has decks, no recent activity
  | 'archived';  // Explicitly archived (future feature)

export type ProjectActivity = 
  | 'just_created'  // Created within last hour
  | 'recent'        // Modified within last 24 hours
  | 'this_week'     // Modified within last week
  | 'this_month'    // Modified within last month
  | 'older';        // Older than a month

export interface ProjectStatusInfo {
  status: ProjectStatus;
  activity: ProjectActivity;
  statusText: string;
  statusColor: string;
  activityText: string;
  lastActivityDate: Date | null;
  suggestedActions: ProjectAction[];
}

export interface ProjectAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  action: 'generate' | 'edit' | 'duplicate' | 'archive' | 'export';
  priority: 'primary' | 'secondary' | 'tertiary';
}

/**
 * Calculate project status based on deck count and activity
 */
export function getProjectStatus(project: Project): ProjectStatus {
  const deckCount = project.deck_count || 0;
  
  if (deckCount === 0) {
    return 'draft';
  }
  
  const lastActivity = getLastActivityDate(project);
  const daysSinceActivity = lastActivity 
    ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  if (daysSinceActivity <= 7) {
    return 'active';
  }
  
  return 'completed';
}

/**
 * Calculate project activity level
 */
export function getProjectActivity(project: Project): ProjectActivity {
  const lastActivity = getLastActivityDate(project);
  
  if (!lastActivity) {
    return 'older';
  }
  
  const now = Date.now();
  const diffMs = now - lastActivity.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;
  
  if (diffHours <= 1) {
    return 'just_created';
  } else if (diffHours <= 24) {
    return 'recent';
  } else if (diffDays <= 7) {
    return 'this_week';
  } else if (diffDays <= 30) {
    return 'this_month';
  }
  
  return 'older';
}

/**
 * Get the most recent activity date
 */
export function getLastActivityDate(project: Project): Date | null {
  const dates = [
    project.created_at,
    project.updated_at,
  ].filter(Boolean).map(date => new Date(date!));
  
  if (dates.length === 0) {
    return null;
  }
  
  return new Date(Math.max(...dates.map(d => d.getTime())));
}

/**
 * Get comprehensive project status information
 */
export function getProjectStatusInfo(project: Project): ProjectStatusInfo {
  const status = getProjectStatus(project);
  const activity = getProjectActivity(project);
  const lastActivityDate = getLastActivityDate(project);
  
  // Status text and colors
  const statusConfig = {
    draft: {
      text: 'Draft',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    active: {
      text: 'Active',
      color: 'bg-green-100 text-green-800 border-green-200',
    },
    completed: {
      text: 'Completed',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    archived: {
      text: 'Archived',
      color: 'bg-gray-100 text-gray-600 border-gray-200',
    },
  };
  
  // Activity text
  const activityConfig = {
    just_created: 'Just created',
    recent: 'Active today',
    this_week: 'Active this week',
    this_month: 'Active this month',
    older: 'Inactive',
  };
  
  // Suggested actions based on status
  const suggestedActions = getSuggestedActions(project, status, activity);
  
  return {
    status,
    activity,
    statusText: statusConfig[status].text,
    statusColor: statusConfig[status].color,
    activityText: activityConfig[activity],
    lastActivityDate,
    suggestedActions,
  };
}

/**
 * Get suggested actions based on project state
 */
function getSuggestedActions(
  project: Project, 
  status: ProjectStatus, 
  activity: ProjectActivity
): ProjectAction[] {
  const actions: ProjectAction[] = [];
  const deckCount = project.deck_count || 0;
  
  // Primary actions based on status
  if (status === 'draft') {
    actions.push({
      id: 'generate',
      label: 'Create First Deck',
      icon: 'lightning',
      color: 'bg-green-600 hover:bg-green-700 text-white',
      action: 'generate',
      priority: 'primary',
    });
  } else {
    actions.push({
      id: 'generate',
      label: 'New Deck',
      icon: 'plus',
      color: 'bg-green-600 hover:bg-green-700 text-white',
      action: 'generate',
      priority: 'primary',
    });
  }
  
  // Secondary actions
  actions.push({
    id: 'edit',
    label: 'Edit Project',
    icon: 'edit',
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
    action: 'edit',
    priority: 'secondary',
  });
  
  // Tertiary actions
  if (deckCount > 0) {
    actions.push({
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'copy',
      color: 'bg-gray-600 hover:bg-gray-700 text-white',
      action: 'duplicate',
      priority: 'tertiary',
    });
    
    actions.push({
      id: 'export',
      label: 'Export',
      icon: 'download',
      color: 'bg-purple-600 hover:bg-purple-700 text-white',
      action: 'export',
      priority: 'tertiary',
    });
  }
  
  return actions;
}

/**
 * Format relative time for display
 */
export function formatRelativeTime(date: Date | null): string {
  if (!date) {
    return 'Unknown';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}w ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Get icon SVG for action type
 */
export function getActionIcon(iconType: string): string {
  const icons = {
    lightning: 'M13 10V3L4 14h7v7l9-11h-7z',
    plus: 'M12 4v16m8-8H4',
    edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    copy: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
    download: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
    archive: 'M5 8l6 6 6-6',
  };
  
  return icons[iconType as keyof typeof icons] || icons.edit;
}
