import React, { useState } from 'react';

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

interface SlideListProps {
  slides: Slide[];
  selectedSlideId: string | null;
  onSlideSelect: (slideId: string) => void;
  onSlideReorder: (reorderedSlides: Slide[]) => void;
  onSlideAdd?: () => void;
  onSlideDuplicate?: (slideId: string) => void;
  onSlideDelete?: (slideId: string) => void;
  loading?: boolean;
}

export const SlideList: React.FC<SlideListProps> = ({
  slides,
  selectedSlideId,
  onSlideSelect,
  onSlideReorder,
  onSlideAdd,
  onSlideDuplicate,
  onSlideDelete,
  loading = false
}) => {
  const [draggedSlide, setDraggedSlide] = useState<Slide | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const getSlideTypeIcon = (type: string | undefined | null) => {
    if (!type) return '📄';
    
    const icons: Record<string, string> = {
      cover: '🏠',
      problem: '❗',
      solution: '💡',
      market: '📊',
      product: '🚀',
      business_model: '💰',
      go_to_market: '📈',
      competition: '⚔️',
      team: '👥',
      financials: '💹',
      traction: '📈',
      funding_ask: '💸'
    };
    return icons[type] || '📄';
  };

  const getSlideTypeName = (type: string | undefined | null) => {
    if (!type) return 'Untitled';
    
    const names: Record<string, string> = {
      cover: 'Cover',
      problem: 'Problem',
      solution: 'Solution',
      market: 'Market',
      product: 'Product',
      business_model: 'Business Model',
      go_to_market: 'Go-to-Market',
      competition: 'Competition',
      team: 'Team',
      financials: 'Financials',
      traction: 'Traction',
      funding_ask: 'Funding Ask'
    };
    return names[type] || type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const handleDragStart = (e: React.DragEvent, slide: Slide) => {
    setDraggedSlide(slide);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!draggedSlide) return;
    
    const dragIndex = slides.findIndex(slide => slide.id === draggedSlide.id);
    if (dragIndex === dropIndex) return;
    
    // Create new array with reordered slides
    const newSlides = [...slides];
    const [removed] = newSlides.splice(dragIndex, 1);
    newSlides.splice(dropIndex, 0, removed);
    
    // Update slide orders
    const reorderedSlides = newSlides.map((slide, index) => ({
      ...slide,
      slide_order: index
    }));
    
    onSlideReorder(reorderedSlides);
    
    setDraggedSlide(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedSlide(null);
    setDragOverIndex(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Slides</h2>
        <p className="text-sm text-gray-600">{slides.length} slides</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {slides.length === 0 ? (
          <div className="p-4 text-center">
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No slides found</p>
          </div>
        ) : (
          <div className="p-2">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                draggable={!loading}
                onDragStart={(e) => handleDragStart(e, slide)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => onSlideSelect(slide.id)}
                className={`
                  relative mb-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                  ${selectedSlideId === slide.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                  ${dragOverIndex === index ? 'border-blue-400 bg-blue-25' : ''}
                  ${draggedSlide?.id === slide.id ? 'opacity-50' : ''}
                  ${loading ? 'cursor-not-allowed opacity-75' : ''}
                `}
              >
                {/* Drag Handle */}
                <div className="absolute left-1 top-1/2 transform -translate-y-1/2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
                
                <div className="ml-6">
                  <div className="flex items-center mb-1">
                    <span className="text-lg mr-2">{getSlideTypeIcon((slide as any).slideType || (slide as any).type)}</span>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {index + 1}
                    </span>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                    {slide.title || getSlideTypeName((slide as any).slideType || (slide as any).type)}
                  </h3>
                  
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {slide.content.substring(0, 80)}
                    {slide.content.length > 80 ? '...' : ''}
                  </p>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    {getSlideTypeName((slide as any).slideType || (slide as any).type)}
                  </div>
                </div>
                
                {/* Selected Indicator */}
                {selectedSlideId === slide.id && (
                  <div className="absolute right-2 top-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Slide Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onSlideAdd}
          disabled={loading || !onSlideAdd}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-sm">Add Slide</span>
        </button>
      </div>
    </div>
  );
};