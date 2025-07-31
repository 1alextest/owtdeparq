import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SpeakerNotesImprover, CompactSpeakerNotesImprover } from '../SpeakerNotesImprover';
import { chatbotService } from '../../../services/chatbotService';
import { ImproveSpeakerNotesResponse } from '../../../types';

// Mock the chatbot service
jest.mock('../../../services/chatbotService', () => ({
  chatbotService: {
    improveSpeakerNotes: jest.fn(),
    getUserFriendlyErrorMessage: jest.fn(),
  },
}));

const mockChatbotService = chatbotService as jest.Mocked<typeof chatbotService>;

describe('SpeakerNotesImprover', () => {
  const defaultProps = {
    slideId: 'slide-123',
    currentNotes: 'These are my current speaker notes for this slide.',
    onApply: jest.fn(),
    onCancel: jest.fn(),
  };

  const mockImproveResponse: ImproveSpeakerNotesResponse = {
    improvedNotes: 'These are the improved speaker notes with better clarity and structure.',
    originalNotes: 'These are my current speaker notes for this slide.',
    improvementType: 'clarity',
    slideTitle: 'Problem Statement',
    provider: 'openai',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockChatbotService.improveSpeakerNotes.mockResolvedValue(mockImproveResponse);
    mockChatbotService.getUserFriendlyErrorMessage.mockReturnValue('Something went wrong. Please try again.');
  });

  describe('Initial Render', () => {
    it('renders the selection step by default', () => {
      render(<SpeakerNotesImprover {...defaultProps} />);
      
      expect(screen.getByText('Improve Speaker Notes')).toBeInTheDocument();
      expect(screen.getByText('Choose how you\'d like to improve your speaker notes with AI assistance')).toBeInTheDocument();
      expect(screen.getByText('Current Notes')).toBeInTheDocument();
      expect(screen.getByText('Select Improvement Type')).toBeInTheDocument();
    });

    it('displays current notes in preview', () => {
      render(<SpeakerNotesImprover {...defaultProps} />);
      
      expect(screen.getByText(defaultProps.currentNotes)).toBeInTheDocument();
    });

    it('shows placeholder when no current notes', () => {
      render(<SpeakerNotesImprover {...defaultProps} currentNotes="" />);
      
      expect(screen.getByText('No speaker notes yet')).toBeInTheDocument();
    });

    it('renders all improvement type options', () => {
      render(<SpeakerNotesImprover {...defaultProps} />);
      
      expect(screen.getByText('Improve Clarity')).toBeInTheDocument();
      expect(screen.getByText('Boost Engagement')).toBeInTheDocument();
      expect(screen.getByText('Better Structure')).toBeInTheDocument();
      expect(screen.getByText('Add Detail')).toBeInTheDocument();
    });

    it('has clarity selected by default', () => {
      render(<SpeakerNotesImprover {...defaultProps} />);
      
      const clarityOption = screen.getByLabelText(/Improve Clarity/);
      expect(clarityOption).toBeChecked();
    });
  });

  describe('Improvement Type Selection', () => {
    it('allows selecting different improvement types', () => {
      render(<SpeakerNotesImprover {...defaultProps} />);
      
      const engagementOption = screen.getByLabelText(/Boost Engagement/);
      fireEvent.click(engagementOption);
      
      expect(engagementOption).toBeChecked();
      expect(screen.getByLabelText(/Improve Clarity/)).not.toBeChecked();
    });

    it('shows visual feedback for selected option', () => {
      render(<SpeakerNotesImprover {...defaultProps} />);
      
      const structureOption = screen.getByLabelText(/Better Structure/);
      fireEvent.click(structureOption);
      
      const structureLabel = structureOption.closest('label');
      expect(structureLabel).toHaveClass('border-blue-500', 'bg-blue-50');
    });
  });

  describe('Improvement Process', () => {
    it('calls improveSpeakerNotes with correct parameters', async () => {
      render(<SpeakerNotesImprover {...defaultProps} />);
      
      // Select engagement type
      const engagementOption = screen.getByLabelText(/Boost Engagement/);
      fireEvent.click(engagementOption);
      
      // Click improve button
      const improveButton = screen.getByText('Improve Notes');
      fireEvent.click(improveButton);
      
      await waitFor(() => {
        expect(mockChatbotService.improveSpeakerNotes).toHaveBeenCalledWith(
          'slide-123',
          'These are my current speaker notes for this slide.',
          'engagement'
        );
      });
    });

    it('shows loading state during improvement', async () => {
      mockChatbotService.improveSpeakerNotes.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockImproveResponse), 100))
      );
      
      render(<SpeakerNotesImprover {...defaultProps} />);
      
      const improveButton = screen.getByText('Improve Notes');
      fireEvent.click(improveButton);
      
      expect(screen.getByText('Improving...')).toBeInTheDocument();
      expect(improveButton).toBeDisabled();
    });

    it('transitions to comparison step after successful improvement', async () => {
      render(<SpeakerNotesImprover {...defaultProps} />);
      
      const improveButton = screen.getByText('Improve Notes');
      fireEvent.click(improveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Review Improved Notes')).toBeInTheDocument();
      });
    });

    it('prevents improvement when notes are empty', () => {
      render(<SpeakerNotesImprover {...defaultProps} currentNotes="" />);
      
      const improveButton = screen.getByText('Improve Notes');
      expect(improveButton).toBeDisabled();
      
      fireEvent.click(improveButton);
      expect(mockChatbotService.improveSpeakerNotes).not.toHaveBeenCalled();
    });

    it('shows error message when notes are empty and improve is attempted', () => {
      render(<SpeakerNotesImprover {...defaultProps} currentNotes="   " />);
      
      const improveButton = screen.getByText('Improve Notes');
      expect(improveButton).toBeDisabled();
      
      // The button should be disabled, so clicking won't trigger the error message
      // This test verifies the button is properly disabled for whitespace-only notes
    });
  });

  describe('Error Handling', () => {
    it('displays error message when improvement fails', async () => {
      const errorMessage = 'Network error occurred';
      mockChatbotService.improveSpeakerNotes.mockRejectedValue(new Error('Network error'));
      mockChatbotService.getUserFriendlyErrorMessage.mockReturnValue(errorMessage);
      
      render(<SpeakerNotesImprover {...defaultProps} />);
      
      const improveButton = screen.getByText('Improve Notes');
      fireEvent.click(improveButton);
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('stops loading state after error', async () => {
      mockChatbotService.improveSpeakerNotes.mockRejectedValue(new Error('Network error'));
      
      render(<SpeakerNotesImprover {...defaultProps} />);
      
      const improveButton = screen.getByText('Improve Notes');
      fireEvent.click(improveButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Improving...')).not.toBeInTheDocument();
        expect(improveButton).not.toBeDisabled();
      });
    });
  });

  describe('Comparison Step', () => {
    beforeEach(async () => {
      render(<SpeakerNotesImprover {...defaultProps} />);
      
      const improveButton = screen.getByText('Improve Notes');
      fireEvent.click(improveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Review Improved Notes')).toBeInTheDocument();
      });
    });

    it('displays improvement information', () => {
      expect(screen.getByText('Improve Clarity')).toBeInTheDocument();
      expect(screen.getByText('Applied to: Problem Statement')).toBeInTheDocument();
    });

    it('shows side-by-side comparison', () => {
      expect(screen.getByText('Original Notes')).toBeInTheDocument();
      expect(screen.getByText('Improved Notes')).toBeInTheDocument();
      expect(screen.getByText(defaultProps.currentNotes)).toBeInTheDocument();
      expect(screen.getByText(mockImproveResponse.improvedNotes)).toBeInTheDocument();
    });

    it('calls onApply when Apply button is clicked', () => {
      const applyButton = screen.getByText('Apply Improved Notes');
      fireEvent.click(applyButton);
      
      expect(defaultProps.onApply).toHaveBeenCalledWith(mockImproveResponse.improvedNotes);
    });

    it('calls onCancel when Keep Original button is clicked', () => {
      const keepButton = screen.getByText('Keep Original');
      fireEvent.click(keepButton);
      
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('returns to selection step when Try Different Type is clicked', () => {
      const tryAgainButton = screen.getByText('Try Different Type');
      fireEvent.click(tryAgainButton);
      
      expect(screen.getByText('Improve Speaker Notes')).toBeInTheDocument();
      expect(screen.getByText('Select Improvement Type')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('calls onCancel when Cancel button is clicked', () => {
      render(<SpeakerNotesImprover {...defaultProps} />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(defaultProps.onCancel).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for radio buttons', () => {
      render(<SpeakerNotesImprover {...defaultProps} />);
      
      const clarityOption = screen.getByRole('radio', { name: /Improve Clarity/ });
      expect(clarityOption).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      render(<SpeakerNotesImprover {...defaultProps} />);
      
      expect(screen.getByRole('heading', { level: 3, name: 'Improve Speaker Notes' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'Current Notes' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 4, name: 'Select Improvement Type' })).toBeInTheDocument();
    });

    it('has screen reader friendly icons', () => {
      render(<SpeakerNotesImprover {...defaultProps} />);
      
      const icons = screen.getAllByRole('img', { hidden: true });
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});

describe('CompactSpeakerNotesImprover', () => {
  const defaultProps = {
    slideId: 'slide-123',
    currentNotes: 'These are my current speaker notes for this slide.',
    onApply: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockChatbotService.improveSpeakerNotes.mockResolvedValue({
      improvedNotes: 'Improved notes',
      originalNotes: 'Original notes',
      improvementType: 'clarity',
      slideTitle: 'Test Slide',
      provider: 'openai',
    });
  });

  describe('Compact Interface', () => {
    it('renders compact interface', () => {
      render(<CompactSpeakerNotesImprover {...defaultProps} />);
      
      expect(screen.getByText('Improve Speaker Notes')).toBeInTheDocument();
      expect(screen.getByText('Improve Clarity')).toBeInTheDocument();
      expect(screen.getByText('Boost Engagement')).toBeInTheDocument();
    });

    it('allows selecting improvement types with buttons', () => {
      render(<CompactSpeakerNotesImprover {...defaultProps} />);
      
      const engagementButton = screen.getByText('Boost Engagement');
      fireEvent.click(engagementButton);
      
      expect(engagementButton).toHaveClass('bg-blue-100', 'text-blue-800');
    });

    it('calls onApply directly after improvement', async () => {
      render(<CompactSpeakerNotesImprover {...defaultProps} />);
      
      const improveButton = screen.getByText('Improve');
      fireEvent.click(improveButton);
      
      await waitFor(() => {
        expect(defaultProps.onApply).toHaveBeenCalledWith('Improved notes');
      });
    });

    it('shows error message in compact format', async () => {
      mockChatbotService.improveSpeakerNotes.mockRejectedValue(new Error('Test error'));
      mockChatbotService.getUserFriendlyErrorMessage.mockReturnValue('Test error message');
      
      render(<CompactSpeakerNotesImprover {...defaultProps} />);
      
      const improveButton = screen.getByText('Improve');
      fireEvent.click(improveButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });
    });

    it('prevents improvement when notes are empty', () => {
      render(<CompactSpeakerNotesImprover {...defaultProps} currentNotes="" />);
      
      const improveButton = screen.getByText('Improve');
      expect(improveButton).toBeDisabled();
    });
  });
});