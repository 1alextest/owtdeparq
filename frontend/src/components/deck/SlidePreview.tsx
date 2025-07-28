import React from 'react';

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

interface SlidePreviewProps {
  slide: Slide;
  slideNumber: number;
  totalSlides: number;
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({
  slide,
  slideNumber,
  totalSlides
}) => {
  const getSlideTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      cover: 'bg-gradient-to-br from-blue-600 to-blue-800',
      problem: 'bg-gradient-to-br from-red-500 to-red-700',
      solution: 'bg-gradient-to-br from-green-500 to-green-700',
      market: 'bg-gradient-to-br from-purple-500 to-purple-700',
      product: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
      business_model: 'bg-gradient-to-br from-yellow-500 to-yellow-700',
      go_to_market: 'bg-gradient-to-br from-pink-500 to-pink-700',
      competition: 'bg-gradient-to-br from-orange-500 to-orange-700',
      team: 'bg-gradient-to-br from-teal-500 to-teal-700',
      financials: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
      traction: 'bg-gradient-to-br from-cyan-500 to-cyan-700',
      funding_ask: 'bg-gradient-to-br from-violet-500 to-violet-700'
    };
    return colors[type] || 'bg-gradient-to-br from-gray-500 to-gray-700';
  };

  const formatContent = (content: string) => {
    // Split content into lines and format bullet points
    return content.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null;
      
      // Check if line starts with bullet point
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        return (
          <li key={index} className="mb-2 text-white/90">
            {trimmedLine.substring(1).trim()}
          </li>
        );
      }
      
      // Regular paragraph
      return (
        <p key={index} className="mb-3 text-white/90">
          {trimmedLine}
        </p>
      );
    }).filter(Boolean);
  };

  const renderSlideContent = () => {
    const formattedContent = formatContent(slide.content);
    const hasBulletPoints = slide.content.includes('•') || slide.content.includes('-') || slide.content.includes('*');

    if (((slide as any).slideType || (slide as any).type) === 'cover') {
      return (
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {slide.title}
          </h1>
          <div className="text-xl md:text-2xl text-white/90 leading-relaxed">
            {formatContent(slide.content)}
          </div>
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
          {slide.title}
        </h2>
        <div className="text-lg md:text-xl leading-relaxed">
          {hasBulletPoints ? (
            <ul className="space-y-2 list-none">
              {formattedContent}
            </ul>
          ) : (
            <div className="space-y-4">
              {formattedContent}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Preview Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Slide Preview</h3>
            <p className="text-sm text-gray-600">
              Slide {slideNumber} of {totalSlides}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <button className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>
            </div>
            
            {/* Fullscreen Button */}
            <button className="p-2 text-gray-600 hover:text-gray-900">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Slide Preview */}
      <div className="flex-1 p-6 bg-gray-100 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          {/* Slide Container */}
          <div 
            className={`
              aspect-[16/9] w-full rounded-lg shadow-lg overflow-hidden
              ${getSlideTypeColor((slide as any).slideType || (slide as any).type)}
              flex items-center justify-center p-8 md:p-12
            `}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="max-w-full">
                {renderSlideContent()}
              </div>
            </div>
          </div>
          
          {/* Slide Info */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {((slide as any).slideType || (slide as any).type || 'Untitled').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Slide
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <button 
            disabled={slideNumber === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalSlides }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i + 1 === slideNumber ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <button 
            disabled={slideNumber === totalSlides}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
          >
            Next
            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};