import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiClient';
import { SlideRegenerationModal } from './SlideRegenerationModal';

interface Slide {
  id: string;
  pitch_deck_id: string;
  type: string;
  title: string;
  content: string;
  speakerNotes?: string;
  speaker_notes?: string; // Backend might use snake_case
  slide_order: number;
  created_at: string;
  updated_at: string;
}

interface SlideEditorProps {
  slide: Slide;
  onSlideUpdate: (slideId: string, updates: Partial<Slide>) => Promise<void>;
  onRegenerateSlide: (slideId: string, improvementType: string) => Promise<void>;
  loading?: boolean;
}

export const SlideEditor: React.FC<SlideEditorProps> = ({
  slide,
  onSlideUpdate,
  onRegenerateSlide,
  loading = false
}) => {
  const [title, setTitle] = useState(slide.title);
  const [content, setContent] = useState(slide.content);
  const [speakerNotes, setSpeakerNotes] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showRegenerateOptions, setShowRegenerateOptions] = useState(false);
  
  // Regeneration modal state
  const [showRegenerationModal, setShowRegenerationModal] = useState(false);
  const [regeneratedContent, setRegeneratedContent] = useState<{
    title: string;
    content: string;
    speaker_notes: string;
  } | null>(null);
  const [regenerationLoading, setRegenerationLoading] = useState(false);
  const [regenerationError, setRegenerationError] = useState<string | null>(null);

  // Update local state when slide prop changes
  useEffect(() => {
    setTitle(slide.title);
    setContent(slide.content);
    setSpeakerNotes((slide as any).speakerNotes || (slide as any).speaker_notes || ''); // Load existing speaker notes
    setHasUnsavedChanges(false);
  }, [slide]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  const handleSpeakerNotesChange = (newNotes: string) => {
    setSpeakerNotes(newNotes);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges) return;

    try {
      await onSlideUpdate(slide.id, {
        title: title.trim(),
        content: content.trim(),
        speakerNotes: speakerNotes.trim()
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      // Error handling is done by parent component
    }
  };

  const handleRegenerate = async (improvementType: string) => {
    try {
      setRegenerationLoading(true);
      setRegenerationError(null);
      setShowRegenerateOptions(false);
      setShowRegenerationModal(true);
      
      // Call the regeneration API
      const regeneratedSlide = await apiClient.regenerateSlide(slide.id, improvementType);

      // Set the regenerated content for user approval
      setRegeneratedContent({
        title: regeneratedSlide.title,
        content: regeneratedSlide.content,
        speaker_notes: regeneratedSlide.speaker_notes || ''
      });
    } catch (error) {
      setRegenerationError(error instanceof Error ? error.message : 'Failed to regenerate slide');
    } finally {
      setRegenerationLoading(false);
    }
  };

  const handleRegenerationApprove = async (approvedContent: {
    title: string;
    content: string;
    speaker_notes: string;
  }) => {
    try {
      // Update the slide with approved content
      await onSlideUpdate(slide.id, {
        title: approvedContent.title,
        content: approvedContent.content,
        speakerNotes: approvedContent.speaker_notes
      });
      
      // Update local state
      setTitle(approvedContent.title);
      setContent(approvedContent.content);
      setSpeakerNotes(approvedContent.speaker_notes);
      setHasUnsavedChanges(false);
      
      // Close modal and reset state
      setShowRegenerationModal(false);
      setRegeneratedContent(null);
      setRegenerationError(null);
    } catch (error) {
      setRegenerationError(error instanceof Error ? error.message : 'Failed to apply changes');
    }
  };

  const handleRegenerationReject = () => {
    // Close modal and reset state without applying changes
    setShowRegenerationModal(false);
    setRegeneratedContent(null);
    setRegenerationError(null);
  };

  const handleRegenerationClose = () => {
    // Close modal and reset state
    setShowRegenerationModal(false);
    setRegeneratedContent(null);
    setRegenerationError(null);
    setRegenerationLoading(false);
  };

  const getSlideTypeName = (type: string) => {
    const names: Record<string, string> = {
      cover: 'Cover Slide',
      problem: 'Problem Statement',
      solution: 'Solution Overview',
      market: 'Market Opportunity',
      product: 'Product Overview',
      business_model: 'Business Model',
      go_to_market: 'Go-to-Market Strategy',
      competition: 'Competitive Landscape',
      team: 'Team & Leadership',
      financials: 'Financial Projections',
      traction: 'Traction & Milestones',
      funding_ask: 'Funding Request'
    };
    return names[type] || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Enhanced auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timer = setTimeout(async () => {
        try {
          // Use optimized autosave endpoint
          await apiClient.autosaveSlide(slide.id, {
            title: title.trim(),
            content: content.trim(),
            speakerNotes: speakerNotes.trim()
          });
          setHasUnsavedChanges(false);
        } catch (error) {
          // Fallback to regular save if autosave fails
          handleSave();
        }
      }, 1500); // Auto-save after 1.5 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [title, content, speakerNotes, hasUnsavedChanges, slide.id]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {getSlideTypeName((slide as any).slideType || (slide as any).type)}
            </h2>
            <p className="text-sm text-gray-600">
              Slide {slide.slide_order + 1} • {hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Regenerate Button */}
            <div className="relative">
              <button
                onClick={() => setShowRegenerateOptions(!showRegenerateOptions)}
                disabled={loading}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Regenerate
              </button>
              
              {/* Regenerate Options Dropdown */}
              {showRegenerateOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => handleRegenerate('general')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      General Improvement
                    </button>
                    <button
                      onClick={() => handleRegenerate('clarity')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Improve Clarity
                    </button>
                    <button
                      onClick={() => handleRegenerate('impact')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Increase Impact
                    </button>
                    <button
                      onClick={() => handleRegenerate('data')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Add Data Focus
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Title Editor */}
          <div>
            <label htmlFor="slide-title" className="block text-sm font-medium text-gray-700 mb-2">
              Slide Title
            </label>
            <input
              id="slide-title"
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter slide title..."
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              {title.length}/100 characters
            </p>
          </div>

          {/* Content Editor */}
          <div>
            <label htmlFor="slide-content" className="block text-sm font-medium text-gray-700 mb-2">
              Slide Content
            </label>
            <textarea
              id="slide-content"
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder="Enter slide content... Use bullet points (•) for lists."
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              {content.length}/2000 characters
            </p>
          </div>

          {/* Speaker Notes Editor */}
          <div>
            <label htmlFor="speaker-notes" className="block text-sm font-medium text-gray-700 mb-2">
              Speaker Notes
            </label>
            <textarea
              id="speaker-notes"
              value={speakerNotes}
              onChange={(e) => handleSpeakerNotesChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Add notes for the presenter..."
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              {speakerNotes.length}/1000 characters
            </p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          <h4 className="font-medium mb-2">💡 Editing Tips:</h4>
          <ul className="space-y-1 text-xs">
            <li>• Use bullet points (•) for lists</li>
            <li>• Keep content concise and impactful</li>
            <li>• Changes are auto-saved after 2 seconds</li>
            <li>• Use "Regenerate" to get AI-improved content</li>
          </ul>
        </div>
      </div>

      {/* Slide Regeneration Modal */}
      <SlideRegenerationModal
        isOpen={showRegenerationModal}
        onClose={handleRegenerationClose}
        onApprove={handleRegenerationApprove}
        onReject={handleRegenerationReject}
        originalContent={{
          title: slide.title,
          content: slide.content,
          speaker_notes: ''
        }}
        regeneratedContent={regeneratedContent}
        loading={regenerationLoading}
        error={regenerationError}
      />
    </div>
  );
};