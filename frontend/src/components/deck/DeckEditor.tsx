import React, { useState, useEffect, useCallback } from 'react';
import { SlideList } from './SlideList';
import { SlideEditor } from './SlideEditor';
import { SlidePreview } from './SlidePreview';
import { ExportModal } from './ExportModal';
import { apiClient } from '../../services/apiClient';

interface Slide {
  id: string;
  pitch_deck_id: string;
  type: string;
  title: string;
  content: string;
  slide_order: number;
  created_at: string;
  updated_at: string;
}

interface PitchDeck {
  id: string;
  user_id: string;
  projectId: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface DeckEditorProps {
  deckId: string;
  projectId: string;
}

export const DeckEditor: React.FC<DeckEditorProps> = ({ deckId, projectId }) => {
  const [deck, setDeck] = useState<PitchDeck | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [showExportModal, setShowExportModal] = useState(false);

  const loadDeckData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load deck details and slides
      const [deck, slides] = await Promise.all([
        apiClient.getDeck(deckId),
        apiClient.getDeckSlides(deckId)
      ]);

      setDeck(deck);
      const sortedSlides = slides.sort((a: Slide, b: Slide) => a.slide_order - b.slide_order);
      setSlides(sortedSlides);

      // Select first slide by default
      if (sortedSlides.length > 0 && !selectedSlideId) {
        setSelectedSlideId(sortedSlides[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deck');
    } finally {
      setLoading(false);
    }
  }, [deckId]);

  // Load deck and slides on component mount
  useEffect(() => {
    loadDeckData();
  }, [loadDeckData]);

  const handleSlideSelect = (slideId: string) => {
    setSelectedSlideId(slideId);
  };

  const handleSlideUpdate = async (slideId: string, updates: Partial<Slide>) => {
    try {
      setSaving(true);
      
      // Update slide via API
      const updatedSlide = await apiClient.updateSlide(slideId, updates);

      // Update local state
      setSlides(prev => prev.map(slide =>
        slide.id === slideId
          ? { ...slide, ...updatedSlide }
          : slide
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update slide');
    } finally {
      setSaving(false);
    }
  };

  const handleSlideReorder = async (reorderedSlides: Slide[]) => {
    // Store original order for rollback
    const originalSlides = [...slides];
    
    try {
      setSaving(true);
      
      // Optimistically update UI
      setSlides(reorderedSlides);
      
      // Prepare slide IDs in the new order for API
      const slideIds = reorderedSlides.map(slide => slide.id);

      await apiClient.reorderSlides(slideIds);
      
      // API success - state is already updated optimistically
    } catch (err) {
      // Rollback to original order on error
      setSlides(originalSlides);
      setError(err instanceof Error ? err.message : 'Failed to reorder slides');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateSlide = async (slideId: string, improvementType: string = 'general') => {
    try {
      setSaving(true);
      
      const regeneratedSlide = await apiClient.regenerateSlide(slideId, improvementType);

      // Update local state
      setSlides(prev => prev.map(slide =>
        slide.id === slideId
          ? { ...slide, ...regeneratedSlide }
          : slide
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate slide');
    } finally {
      setSaving(false);
    }
  };

  const handleSlideAdd = async () => {
    try {
      setSaving(true);
      
      const newSlide = await apiClient.createSlide(deckId, {
        type: 'custom',
        title: 'New Slide',
        content: 'Add your content here...'
      });

      // Add new slide to local state
      setSlides(prev => [...prev, newSlide]);

      // Select the new slide
      setSelectedSlideId(newSlide.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add slide');
    } finally {
      setSaving(false);
    }
  };

  const handleSlideDuplicate = async (slideId: string) => {
    try {
      setSaving(true);
      
      const duplicatedSlide = await apiClient.duplicateSlide(slideId);

      // Add duplicated slide to local state
      setSlides(prev => {
        const originalIndex = prev.findIndex(s => s.id === slideId);
        const newSlides = [...prev];
        newSlides.splice(originalIndex + 1, 0, duplicatedSlide);
        return newSlides;
      });
      
      // Select the duplicated slide
      setSelectedSlideId(duplicatedSlide.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate slide');
    } finally {
      setSaving(false);
    }
  };

  const handleSlideDelete = async (slideId: string) => {
    try {
      setSaving(true);
      
      await apiClient.deleteSlide(slideId);
      
      // Remove slide from local state
      const remainingSlides = slides.filter(slide => slide.id !== slideId);
      setSlides(remainingSlides);
      
      // Select another slide if the deleted one was selected
      if (selectedSlideId === slideId) {
        if (remainingSlides.length > 0) {
          setSelectedSlideId(remainingSlides[0].id);
        } else {
          setSelectedSlideId(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete slide');
    } finally {
      setSaving(false);
    }
  };

  const selectedSlide = slides.find(slide => slide.id === selectedSlideId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading deck...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading deck</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <div className="mt-6">
            <button
              onClick={loadDeckData}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {deck?.title || 'Pitch Deck Editor'}
              </h1>
              <p className="text-sm text-gray-600">
                {slides.length} slides • {saving ? 'Saving...' : 'All changes saved'}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('edit')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'edit'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'preview'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Preview
                </button>
              </div>
              
              {/* Export Button */}
              <button 
                onClick={() => setShowExportModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors inline-flex items-center"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Slide List */}
          <div className="w-80 flex-shrink-0">
            <SlideList
              slides={slides}
              selectedSlideId={selectedSlideId}
              onSlideSelect={handleSlideSelect}
              onSlideReorder={handleSlideReorder}
              onSlideAdd={handleSlideAdd}
              onSlideDuplicate={handleSlideDuplicate}
              onSlideDelete={handleSlideDelete}
              loading={saving}
            />
          </div>

          {/* Main Editor Area */}
          <div className="flex-1 min-w-0">
            {viewMode === 'edit' ? (
              selectedSlide ? (
                <SlideEditor
                  slide={selectedSlide}
                  onSlideUpdate={handleSlideUpdate}
                  onRegenerateSlide={handleRegenerateSlide}
                  loading={saving}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Select a slide to edit</h3>
                    <p className="mt-1 text-sm text-gray-500">Choose a slide from the list to start editing</p>
                  </div>
                </div>
              )
            ) : (
              selectedSlide ? (
                <SlidePreview
                  slide={selectedSlide}
                  slideNumber={slides.findIndex(s => s.id === selectedSlide.id) + 1}
                  totalSlides={slides.length}
                  onPrevious={() => {
                    const currentIndex = slides.findIndex(s => s.id === selectedSlide.id);
                    if (currentIndex > 0) {
                      setSelectedSlideId(slides[currentIndex - 1].id);
                    }
                  }}
                  onNext={() => {
                    const currentIndex = slides.findIndex(s => s.id === selectedSlide.id);
                    if (currentIndex < slides.length - 1) {
                      setSelectedSlideId(slides[currentIndex + 1].id);
                    }
                  }}
                />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 h-full flex items-center justify-center">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Select a slide to preview</h3>
                    <p className="mt-1 text-sm text-gray-500">Choose a slide from the list to preview</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {deck && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          deckId={deckId}
          deckTitle={deck.title}
        />
      )}
    </>
  );
};