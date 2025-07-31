// Export all entities for easy importing
export { Project } from './project.entity';
export { Presentation } from './presentation.entity';
export { PitchDeck } from './pitch-deck.entity';
export { Slide } from './slide.entity';
export { SlideTemplate } from './slide-template.entity';
export { DeckVersion } from './deck-version.entity';
export { MediaFile } from './media-file.entity';
export { ContextMemoryEvent } from './context-memory-event.entity';
export { LearningPattern } from './learning-pattern.entity';
export { ChatContext } from './chat-context.entity';
export { UserAiSettings } from './user-ai-settings.entity';

// Export types
export type { DeckMode } from './pitch-deck.entity';
export type { SlideType } from './slide.entity';
export type { EventType, LearningScope as ContextLearningScope } from './context-memory-event.entity';
export type { ScopeType, PatternType } from './learning-pattern.entity';
export type { LearningScope } from './user-ai-settings.entity';
