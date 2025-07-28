import React from 'react';
import { DeckEditor } from '../components/deck/DeckEditor';

interface DeckEditorPageProps {
  deckId: string;
  projectId: string;
}

export const DeckEditorPage: React.FC<DeckEditorPageProps> = ({ deckId, projectId }) => {
  return <DeckEditor deckId={deckId} projectId={projectId} />;
};