import React from 'react';
import { 
  ChatbotTrigger, 
  FloatingChatbotTrigger, 
  ToolbarChatbotTrigger, 
  InlineChatbotTrigger 
} from './ChatbotTrigger';
import { ChatContext } from '../../types';

/**
 * Demo component showcasing different ChatbotTrigger variants
 * This component is for development and testing purposes
 */
export const ChatbotTriggerDemo: React.FC = () => {
  const dashboardContext: ChatContext = {
    type: 'dashboard',
  };

  const deckContext: ChatContext = {
    type: 'deck',
    deckId: 'demo-deck-123',
    deckTitle: 'Demo Pitch Deck',
  };

  const slideContext: ChatContext = {
    type: 'slide',
    deckId: 'demo-deck-123',
    slideId: 'demo-slide-456',
    deckTitle: 'Demo Pitch Deck',
    slideTitle: 'Problem Statement',
    slideType: 'problem',
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          ChatbotTrigger Component Demo
        </h1>

        {/* Floating Variants */}
        <section className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Floating Variants
          </h2>
          <p className="text-gray-600 mb-6">
            Fixed position buttons that float over content. Perfect for global access.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Sizes</h3>
              <div className="flex items-center space-x-4">
                <div className="relative bg-gray-100 rounded-lg p-4 w-24 h-24">
                  <FloatingChatbotTrigger 
                    size="sm" 
                    position="bottom-right"
                    context={dashboardContext}
                  />
                  <span className="absolute bottom-1 left-1 text-xs text-gray-500">SM</span>
                </div>
                <div className="relative bg-gray-100 rounded-lg p-4 w-24 h-24">
                  <FloatingChatbotTrigger 
                    size="md" 
                    position="bottom-right"
                    context={deckContext}
                  />
                  <span className="absolute bottom-1 left-1 text-xs text-gray-500">MD</span>
                </div>
                <div className="relative bg-gray-100 rounded-lg p-4 w-24 h-24">
                  <FloatingChatbotTrigger 
                    size="lg" 
                    position="bottom-right"
                    context={slideContext}
                  />
                  <span className="absolute bottom-1 left-1 text-xs text-gray-500">LG</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Positions</h3>
              <div className="relative bg-gray-100 rounded-lg h-32">
                <FloatingChatbotTrigger 
                  size="sm" 
                  position="top-left"
                  context={dashboardContext}
                />
                <FloatingChatbotTrigger 
                  size="sm" 
                  position="top-right"
                  context={deckContext}
                />
                <FloatingChatbotTrigger 
                  size="sm" 
                  position="bottom-left"
                  context={slideContext}
                />
                <FloatingChatbotTrigger 
                  size="sm" 
                  position="bottom-right"
                  context={dashboardContext}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Toolbar Variants */}
        <section className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Toolbar Variants
          </h2>
          <p className="text-gray-600 mb-6">
            Designed to fit into toolbars and headers alongside other action buttons.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Icon Only</h3>
              <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-2">
                <button className="bg-gray-700 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition-colors">
                  Save
                </button>
                <button className="bg-gray-700 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition-colors">
                  Export
                </button>
                <ToolbarChatbotTrigger 
                  size="md"
                  context={deckContext}
                />
                <button className="bg-gray-700 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition-colors">
                  Settings
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">With Label</h3>
              <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-2">
                <button className="bg-gray-700 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition-colors">
                  Save Draft
                </button>
                <button className="bg-gray-700 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition-colors">
                  Export PDF
                </button>
                <ToolbarChatbotTrigger 
                  size="md"
                  showLabel={true}
                  label="AI Help"
                  context={slideContext}
                />
                <button className="bg-gray-700 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition-colors">
                  Settings
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Inline Variants */}
        <section className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Inline Variants
          </h2>
          <p className="text-gray-600 mb-6">
            Designed to blend with content and forms. Uses outline styling.
          </p>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">In Content</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-4">
                  Need help with your pitch deck? Our AI assistant can provide guidance 
                  on structure, content, and best practices.
                </p>
                <div className="flex items-center space-x-3">
                  <InlineChatbotTrigger 
                    showLabel={true}
                    label="Get AI Help"
                    context={dashboardContext}
                  />
                  <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">
                    Learn More
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Different Sizes</h3>
              <div className="flex items-center space-x-4">
                <InlineChatbotTrigger 
                  size="sm"
                  showLabel={true}
                  label="Small"
                  context={slideContext}
                />
                <InlineChatbotTrigger 
                  size="md"
                  showLabel={true}
                  label="Medium"
                  context={deckContext}
                />
                <InlineChatbotTrigger 
                  size="lg"
                  showLabel={true}
                  label="Large"
                  context={dashboardContext}
                />
              </div>
            </div>
          </div>
        </section>

        {/* States */}
        <section className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            States
          </h2>
          <p className="text-gray-600 mb-6">
            Different states and configurations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Normal</h3>
              <ChatbotTrigger 
                variant="inline"
                showLabel={true}
                label="AI Assistant"
                context={dashboardContext}
              />
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Disabled</h3>
              <ChatbotTrigger 
                variant="inline"
                showLabel={true}
                label="AI Assistant"
                disabled={true}
                context={deckContext}
              />
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Custom Label</h3>
              <ChatbotTrigger 
                variant="inline"
                showLabel={true}
                label="Ask AI"
                context={slideContext}
              />
            </div>
          </div>
        </section>

        {/* Context Examples */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Context Examples
          </h2>
          <p className="text-gray-600 mb-6">
            Different contexts provide different AI assistance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Dashboard Context</h3>
              <p className="text-blue-700 text-sm mb-3">
                General pitch deck guidance and best practices.
              </p>
              <InlineChatbotTrigger 
                showLabel={true}
                label="Dashboard Help"
                context={dashboardContext}
              />
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">Deck Context</h3>
              <p className="text-green-700 text-sm mb-3">
                Deck-level assistance and structure review.
              </p>
              <InlineChatbotTrigger 
                showLabel={true}
                label="Deck Help"
                context={deckContext}
              />
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-medium text-purple-900 mb-2">Slide Context</h3>
              <p className="text-purple-700 text-sm mb-3">
                Slide-specific content and improvement suggestions.
              </p>
              <InlineChatbotTrigger 
                showLabel={true}
                label="Slide Help"
                context={slideContext}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};