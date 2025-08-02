import React from 'react';
import { useParams } from 'react-router-dom';
import { DeckEditor } from '../components/deck/DeckEditor';

export const DeckEditorPage: React.FC = () => {
  const { deckId, projectId } = useParams<{ deckId: string; projectId: string }>();

  if (!deckId || !projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid URL</h2>
          <p className="text-gray-600">Deck ID and Project ID are required.</p>
        </div>
      </div>
    );
  }

  return <DeckEditor deckId={deckId} projectId={projectId} />;
};