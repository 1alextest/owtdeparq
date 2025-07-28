import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportModal } from '../ExportModal';

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'mock-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('ExportModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    deckId: 'test-deck-123',
    deckTitle: 'Test Pitch Deck'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
    
    // Setup DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // Cleanup DOM
    document.body.innerHTML = '';
  });

  it('renders nothing when not open', () => {
    const { container } = render(
      <ExportModal {...mockProps} isOpen={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders export modal when open', () => {
    render(<ExportModal {...mockProps} />);

    expect(screen.getByText('Export Presentation')).toBeInTheDocument();
    expect(screen.getByText('Export "Test Pitch Deck" in your preferred format')).toBeInTheDocument();
  });

  it('shows format selection options', () => {
    render(<ExportModal {...mockProps} />);

    expect(screen.getByText('PDF Document')).toBeInTheDocument();
    expect(screen.getByText('PowerPoint Presentation')).toBeInTheDocument();
    expect(screen.getByText('Professional format, perfect for sharing and printing')).toBeInTheDocument();
    expect(screen.getByText('Editable format, ideal for further customization')).toBeInTheDocument();
  });

  it('shows speaker notes option for PDF format', () => {
    render(<ExportModal {...mockProps} />);

    // PDF should be selected by default
    expect(screen.getByText('Include speaker notes')).toBeInTheDocument();
    expect(screen.getByText('Add presenter notes below each slide')).toBeInTheDocument();
  });

  it('hides speaker notes option for PPTX format', () => {
    render(<ExportModal {...mockProps} />);

    // Switch to PPTX format
    const pptxRadio = screen.getByDisplayValue('pptx');
    fireEvent.click(pptxRadio);

    // Speaker notes option should not be visible
    expect(screen.queryByText('Include speaker notes')).not.toBeInTheDocument();
  });

  it('allows format selection', () => {
    render(<ExportModal {...mockProps} />);

    const pdfRadio = screen.getByDisplayValue('pdf');
    const pptxRadio = screen.getByDisplayValue('pptx');

    // PDF should be selected by default
    expect(pdfRadio).toBeChecked();
    expect(pptxRadio).not.toBeChecked();

    // Switch to PPTX
    fireEvent.click(pptxRadio);
    expect(pptxRadio).toBeChecked();
    expect(pdfRadio).not.toBeChecked();
  });

  it('allows toggling speaker notes option', () => {
    render(<ExportModal {...mockProps} />);

    const speakerNotesCheckbox = screen.getByRole('checkbox');
    
    // Should be checked by default
    expect(speakerNotesCheckbox).toBeChecked();

    // Toggle off
    fireEvent.click(speakerNotesCheckbox);
    expect(speakerNotesCheckbox).not.toBeChecked();

    // Toggle back on
    fireEvent.click(speakerNotesCheckbox);
    expect(speakerNotesCheckbox).toBeChecked();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<ExportModal {...mockProps} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when close X button is clicked', () => {
    render(<ExportModal {...mockProps} />);

    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('initiates PDF export when export button is clicked', async () => {
    const mockBlob = new Blob(['mock pdf content'], { type: 'application/pdf' });
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
      headers: {
        get: () => 'attachment; filename="test-deck.pdf"'
      }
    });

    render(<ExportModal {...mockProps} />);

    const exportButton = screen.getByText('Export PDF');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/decks/test-deck-123/export/pdf', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ include_speaker_notes: true })
      });
    });
  });

  it('initiates PPTX export when PPTX format is selected', async () => {
    const mockBlob = new Blob(['mock pptx content'], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
      headers: {
        get: () => 'attachment; filename="test-deck.pptx"'
      }
    });

    render(<ExportModal {...mockProps} />);

    // Switch to PPTX format
    const pptxRadio = screen.getByDisplayValue('pptx');
    fireEvent.click(pptxRadio);

    const exportButton = screen.getByText('Export PPTX');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/decks/test-deck-123/export/pptx', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
    });
  });

  it('shows loading state during export', async () => {
    // Mock a delayed response
    (fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob()),
        headers: { get: () => null }
      }), 50))
    );

    render(<ExportModal {...mockProps} />);

    const exportButton = screen.getByText('Export PDF');
    fireEvent.click(exportButton);

    // Should show loading state immediately
    await waitFor(() => {
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });
  });

  it('shows error state when export fails', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ExportModal {...mockProps} />);

    const exportButton = screen.getByText('Export PDF');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('Export Failed')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Should not close modal on error
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it('shows error when API returns error response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Deck not found' })
    });

    render(<ExportModal {...mockProps} />);

    const exportButton = screen.getByText('Export PDF');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('Export Failed')).toBeInTheDocument();
      expect(screen.getByText('Deck not found')).toBeInTheDocument();
    });
  });

  it('shows error when no auth token is available', async () => {
    mockLocalStorage.getItem.mockReturnValueOnce(null);

    render(<ExportModal {...mockProps} />);

    const exportButton = screen.getByText('Export PDF');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(screen.getByText('Export Failed')).toBeInTheDocument();
      expect(screen.getByText('Authentication required')).toBeInTheDocument();
    });
  });

  it('updates button text based on selected format', () => {
    render(<ExportModal {...mockProps} />);

    // Should show PDF by default
    expect(screen.getByText('Export PDF')).toBeInTheDocument();

    // Switch to PPTX
    const pptxRadio = screen.getByDisplayValue('pptx');
    fireEvent.click(pptxRadio);

    expect(screen.getByText('Export PPTX')).toBeInTheDocument();
  });

  it('handles export with no Content-Disposition header', async () => {
    const mockBlob = new Blob(['mock content']);
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
      headers: {
        get: () => null // No Content-Disposition header
      }
    });

    render(<ExportModal {...mockProps} />);

    const exportButton = screen.getByText('Export PDF');
    fireEvent.click(exportButton);

    // Should complete export process without errors
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });
});