import React, { useState } from 'react';
// import { apiClient } from '../../services/apiClient';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string;
  deckTitle: string;
}

type ExportFormat = 'pdf' | 'pptx';

interface ExportOptions {
  format: ExportFormat;
  includeSpeakerNotes: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  deckId,
  deckTitle
}) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeSpeakerNotes: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const requestBody = exportOptions.format === 'pdf' 
        ? { include_speaker_notes: exportOptions.includeSpeakerNotes }
        : {};

      // Make the API call and handle file download
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/decks/${deckId}/export/${exportOptions.format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Export failed with status ${response.status}`);
      }

      // Get the filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${deckTitle}.${exportOptions.format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Show success message
      alert(`Export successful! ${filename} has been downloaded.`);

      // Close modal on success
      onClose();

    } catch (error) {
      console.error('Export failed:', error);
      let errorMessage = 'Export failed';
      
      if (error instanceof Error) {
        if (error.message.includes('auth/network-request-failed')) {
          errorMessage = 'Network connection issue. Please check your internet connection and try again.';
        } else if (error.message.includes('Authentication failed')) {
          errorMessage = 'Authentication expired. Please refresh the page and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setExportError(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFormatChange = (format: ExportFormat) => {
    setExportOptions(prev => ({ ...prev, format }));
  };

  const handleSpeakerNotesChange = (includeSpeakerNotes: boolean) => {
    setExportOptions(prev => ({ ...prev, includeSpeakerNotes }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Export Presentation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isExporting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Export "{deckTitle}" in your preferred format
            </p>

            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Export Format
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={exportOptions.format === 'pdf'}
                    onChange={() => handleFormatChange('pdf')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={isExporting}
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">PDF Document</div>
                    <div className="text-xs text-gray-500">
                      Professional format, perfect for sharing and printing
                    </div>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="pptx"
                    checked={exportOptions.format === 'pptx'}
                    onChange={() => handleFormatChange('pptx')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    disabled={isExporting}
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">PowerPoint Presentation</div>
                    <div className="text-xs text-gray-500">
                      Editable format, ideal for further customization
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Options */}
            {exportOptions.format === 'pdf' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Export Options
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeSpeakerNotes}
                    onChange={(e) => handleSpeakerNotesChange(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isExporting}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Include speaker notes
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Add presenter notes below each slide
                </p>
              </div>
            )}

            {/* Export Progress */}
            {isExporting && (
              <div className="mb-4">
                <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-sm text-blue-700">
                    Generating {exportOptions.format.toUpperCase()} export...
                  </span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {exportError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Export Failed</h3>
                    <p className="text-sm text-red-700 mt-1">{exportError}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? 'Exporting...' : `Export ${exportOptions.format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
};