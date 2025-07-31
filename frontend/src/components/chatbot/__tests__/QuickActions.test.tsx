import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickActions, CompactQuickActions, ContextualQuickActions, useQuickActions } from '../QuickActions';
import { QuickAction, ChatContext } from '../../../types';

describe('QuickActions', () => {
  const mockDashboardActions: QuickAction[] = [
    {
      id: 'start-deck',
      label: 'Help me start a pitch deck',
      icon: '🚀',
      prompt: 'I want to create a new pitch deck. Can you guide me through the process?',
      context: ['dashboard'],
    },
    {
      id: 'best-practices',
      label: 'Pitch deck best practices',
      icon: '💡',
      prompt: 'What are the key best practices for creating an effective pitch deck?',
      context: ['dashboard'],
    },
    {
      id: 'industry-insights',
      label: 'Industry-specific insights',
      icon: '📊',
      prompt: 'Can you provide insights on what investors look for in pitch decks?',
      context: ['dashboard'],
    },
  ];

  const mockDeckActions: QuickAction[] = [
    {
      id: 'review-structure',
      label: 'Review deck structure',
      icon: '🔍',
      prompt: 'Can you review the overall structure of my pitch deck?',
      context: ['deck'],
    },
    {
      id: 'improve-flow',
      label: 'Improve overall flow',
      icon: '🔄',
      prompt: 'How can I improve the flow and narrative of my pitch deck?',
      context: ['deck'],
    },
  ];

  const mockMixedActions: QuickAction[] = [
    ...mockDashboardActions,
    ...mockDeckActions,
  ];

  const mockDashboardContext: ChatContext = { type: 'dashboard' };
  const mockDeckContext: ChatContext = { type: 'deck', deckId: 'test-deck' };

  const mockOnActionClick = jest.fn();

  beforeEach(() => {
    mockOnActionClick.mockClear();
  });

  describe('Basic Functionality', () => {
    it('renders quick actions correctly', () => {
      render(
        <QuickActions
          actions={mockDashboardActions}
          context={mockDashboardContext}
          onActionClick={mockOnActionClick}
        />
      );

      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Help me start a pitch deck')).toBeInTheDocument();
      expect(screen.getByText('Pitch deck best practices')).toBeInTheDocument();
      expect(screen.getByText('Industry-specific insights')).toBeInTheDocument();
    });

    it('filters actions based on context', () => {
      render(
        <QuickActions
          actions={mockMixedActions}
          context={mockDashboardContext}
          onActionClick={mockOnActionClick}
        />
      );

      // Should show dashboard actions
      expect(screen.getByText('Help me start a pitch deck')).toBeInTheDocument();
      expect(screen.getByText('Pitch deck best practices')).toBeInTheDocument();

      // Should not show deck actions
      expect(screen.queryByText('Review deck structure')).not.toBeInTheDocument();
      expect(screen.queryByText('Improve overall flow')).not.toBeInTheDocument();
    });

    it('renders nothing when no relevant actions', () => {
      const { container } = render(
        <QuickActions
          actions={mockDeckActions}
          context={mockDashboardContext}
          onActionClick={mockOnActionClick}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('limits actions based on maxActions prop', () => {
      render(
        <QuickActions
          actions={mockDashboardActions}
          context={mockDashboardContext}
          onActionClick={mockOnActionClick}
          maxActions={2}
        />
      );

      expect(screen.getByText('Help me start a pitch deck')).toBeInTheDocument();
      expect(screen.getByText('Pitch deck best practices')).toBeInTheDocument();
      expect(screen.queryByText('Industry-specific insights')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles action clicks correctly', () => {
      render(
        <QuickActions
          actions={mockDashboardActions}
          context={mockDashboardContext}
          onActionClick={mockOnActionClick}
        />
      );

      const actionButton = screen.getByText('Help me start a pitch deck');
      fireEvent.click(actionButton);

      expect(mockOnActionClick).toHaveBeenCalledWith(mockDashboardActions[0]);
    });

    it('handles keyboard navigation (Enter key)', () => {
      render(
        <QuickActions
          actions={mockDashboardActions}
          context={mockDashboardContext}
          onActionClick={mockOnActionClick}
        />
      );

      const actionButton = screen.getByText('Help me start a pitch deck');
      fireEvent.keyDown(actionButton, { key: 'Enter' });

      expect(mockOnActionClick).toHaveBeenCalledWith(mockDashboardActions[0]);
    });

    it('handles keyboard navigation (Space key)', () => {
      render(
        <QuickActions
          actions={mockDashboardActions}
          context={mockDashboardContext}
          onActionClick={mockOnActionClick}
        />
      );

      const actionButton = screen.getByText('Help me start a pitch deck');
      fireEvent.keyDown(actionButton, { key: ' ' });

      expect(mockOnActionClick).toHaveBeenCalledWith(mockDashboardActions[0]);
    });

    it('ignores other keyboard keys', () => {
      render(
        <QuickActions
          actions={mockDashboardActions}
          context={mockDashboardContext}
          onActionClick={mockOnActionClick}
        />
      );

      const actionButton = screen.getByText('Help me start a pitch deck');
      fireEvent.keyDown(actionButton, { key: 'Tab' });

      expect(mockOnActionClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('renders disabled state correctly', () => {
      render(
        <QuickActions
          actions={mockDashboardActions}
          context={mockDashboardContext}
          onActionClick={mockOnActionClick}
          disabled={true}
        />
      );

      const actionButton = screen.getByRole('button', { name: /Help me start a pitch deck/ });
      expect(actionButton).toBeDisabled();
      expect(actionButton).toHaveClass('cursor-not-allowed');
    });

    it('does not handle clicks when disabled', () => {
      render(
        <QuickActions
          actions={mockDashboardActions}
          context={mockDashboardContext}
          onActionClick={mockOnActionClick}
          disabled={true}
        />
      );

      const actionButton = screen.getByText('Help me start a pitch deck');
      fireEvent.click(actionButton);

      expect(mockOnActionClick).not.toHaveBeenCalled();
    });

    it('does not handle keyboard events when disabled', () => {
      render(
        <QuickActions
          actions={mockDashboardActions}
          context={mockDashboardContext}
          onActionClick={mockOnActionClick}
          disabled={true}
        />
      );

      const actionButton = screen.getByText('Help me start a pitch deck');
      fireEvent.keyDown(actionButton, { key: 'Enter' });

      expect(mockOnActionClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <QuickActions
          actions={mockDashboardActions}
          context={mockDashboardContext}
          onActionClick={mockOnActionClick}
        />
      );

      const actionButton = screen.getByRole('button', { name: /Help me start a pitch deck/ });
      expect(actionButton).toHaveAttribute('aria-label', 'Quick action: Help me start a pitch deck');
      expect(actionButton).toHaveAttribute('title', mockDashboardActions[0].prompt);
    });

    it('has proper focus management', () => {
      render(
        <QuickActions
          actions={mockDashboardActions}
          context={mockDashboardContext}
          onActionClick={mockOnActionClick}
        />
      );

      const actionButton = screen.getByRole('button', { name: /Help me start a pitch deck/ });
      expect(actionButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });

    it('displays icons with proper ARIA attributes', () => {
      render(
        <QuickActions
          actions={mockDashboardActions}
          context={mockDashboardContext}
          onActionClick={mockOnActionClick}
        />
      );

      const icons = screen.getAllByRole('img', { hidden: true });
      expect(icons).toHaveLength(mockDashboardActions.length);
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <QuickActions
          actions={mockDashboardActions}
          context={mockDashboardContext}
          onActionClick={mockOnActionClick}
          className="custom-class"
        />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('truncates long prompts in preview', () => {
      const longPromptAction: QuickAction = {
        id: 'long-prompt',
        label: 'Long prompt action',
        icon: '📝',
        prompt: 'This is a very long prompt that should be truncated when displayed in the quick actions preview because it exceeds the character limit',
        context: ['dashboard'],
      };

      render(
        <QuickActions
          actions={[longPromptAction]}
          context={mockDashboardContext}
          onActionClick={mockOnActionClick}
        />
      );

      expect(screen.getByText(/This is a very long prompt that should be truncated/)).toBeInTheDocument();
      expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
    });
  });
});

describe('CompactQuickActions', () => {
  const mockActions: QuickAction[] = [
    {
      id: 'action-1',
      label: 'Action 1',
      icon: '🚀',
      prompt: 'First action prompt',
      context: ['dashboard'],
    },
    {
      id: 'action-2',
      label: 'Action 2',
      icon: '💡',
      prompt: 'Second action prompt',
      context: ['dashboard'],
    },
  ];

  const mockContext: ChatContext = { type: 'dashboard' };
  const mockOnActionClick = jest.fn();

  beforeEach(() => {
    mockOnActionClick.mockClear();
  });

  it('renders compact version correctly', () => {
    render(
      <CompactQuickActions
        actions={mockActions}
        context={mockContext}
        onActionClick={mockOnActionClick}
      />
    );

    expect(screen.getByText('Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });

  it('uses pill-style buttons', () => {
    render(
      <CompactQuickActions
        actions={mockActions}
        context={mockContext}
        onActionClick={mockOnActionClick}
      />
    );

    const actionButton = screen.getByRole('button', { name: /Action 1/ });
    expect(actionButton).toHaveClass('rounded-full', 'bg-blue-50', 'text-blue-700');
  });

  it('handles clicks in compact mode', () => {
    render(
      <CompactQuickActions
        actions={mockActions}
        context={mockContext}
        onActionClick={mockOnActionClick}
      />
    );

    const actionButton = screen.getByText('Action 1');
    fireEvent.click(actionButton);

    expect(mockOnActionClick).toHaveBeenCalledWith(mockActions[0]);
  });

  it('respects maxActions limit', () => {
    render(
      <CompactQuickActions
        actions={mockActions}
        context={mockContext}
        onActionClick={mockOnActionClick}
        maxActions={1}
      />
    );

    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.queryByText('Action 2')).not.toBeInTheDocument();
  });
});

describe('ContextualQuickActions', () => {
  const mockOnActionClick = jest.fn();

  beforeEach(() => {
    mockOnActionClick.mockClear();
  });

  it('renders contextual actions', () => {
    render(
      <ContextualQuickActions
        onActionClick={mockOnActionClick}
      />
    );

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Help me get started')).toBeInTheDocument();
  });

  it('renders compact variant when specified', () => {
    render(
      <ContextualQuickActions
        onActionClick={mockOnActionClick}
        variant="compact"
      />
    );

    expect(screen.getByText('Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Help me get started')).toBeInTheDocument();
  });

  it('handles action clicks', () => {
    render(
      <ContextualQuickActions
        onActionClick={mockOnActionClick}
      />
    );

    const actionButton = screen.getByText('Help me get started');
    fireEvent.click(actionButton);

    expect(mockOnActionClick).toHaveBeenCalled();
  });
});

describe('useQuickActions hook', () => {
  it('returns dashboard actions for dashboard context', () => {
    const dashboardContext: ChatContext = { type: 'dashboard' };
    const actions = useQuickActions(dashboardContext);

    expect(actions).toHaveLength(3);
    expect(actions[0].label).toBe('Help me start a pitch deck');
    expect(actions[1].label).toBe('Pitch deck best practices');
    expect(actions[2].label).toBe('Industry-specific insights');
  });

  it('returns deck actions for deck context', () => {
    const deckContext: ChatContext = { type: 'deck', deckId: 'test-deck' };
    const actions = useQuickActions(deckContext);

    expect(actions).toHaveLength(3);
    expect(actions[0].label).toBe('Review deck structure');
    expect(actions[1].label).toBe('Improve overall flow');
    expect(actions[2].label).toBe('Add missing slides');
  });

  it('returns slide actions for slide context', () => {
    const slideContext: ChatContext = { 
      type: 'slide', 
      deckId: 'test-deck', 
      slideId: 'test-slide' 
    };
    const actions = useQuickActions(slideContext);

    expect(actions).toHaveLength(3);
    expect(actions[0].label).toBe('Improve this slide');
    expect(actions[1].label).toBe('Make it more compelling');
    expect(actions[2].label).toBe('Add data points');
  });

  it('returns empty array for unknown context', () => {
    const unknownContext: ChatContext = { type: 'dashboard' as any };
    // Force an unknown type by casting
    const actions = useQuickActions({ type: 'unknown' } as any);

    expect(actions).toHaveLength(0);
  });
});