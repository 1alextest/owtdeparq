# Design Document

## Overview

The chatbot frontend feature provides an AI-powered assistant interface that integrates seamlessly with the existing pitch deck application. The design leverages the fully implemented backend chatbot API while optimizing the current UI patterns to create a more cohesive user experience. The chatbot will appear as a slide-out panel that maintains context awareness and provides actionable assistance throughout the user's workflow.

## Architecture

### Component Architecture

```
ChatbotSystem/
├── ChatbotProvider (Context Provider)
├── ChatbotTrigger (Button Component)
├── ChatbotPanel (Main Interface)
├── ChatMessage (Individual Messages)
├── QuickActions (Action Buttons)
├── SpeakerNotesImprover (Specialized Component)
└── ChatbotService (API Integration)
```

### State Management

The chatbot will use React Context for global state management with the following structure:

```typescript
interface ChatbotState {
  isOpen: boolean;
  currentContext: ChatContext;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  quickActions: QuickAction[];
}

interface ChatContext {
  type: 'dashboard' | 'deck' | 'slide';
  deckId?: string;
  slideId?: string;
  deckTitle?: string;
  slideTitle?: string;
  slideType?: string;
}
```

### Integration Points

1. **Dashboard Integration**: Floating action button in bottom-right corner
2. **Deck Editor Integration**: Button in header toolbar next to Export
3. **Slide Editor Integration**: "Get AI Help" button in slide editor header
4. **Speaker Notes Integration**: "Improve with AI" button in speaker notes section

## Components and Interfaces

### ChatbotProvider Component

**Purpose**: Global state management and context provision

**Props**:
```typescript
interface ChatbotProviderProps {
  children: React.ReactNode;
}
```

**State Management**:
- Manages global chatbot state
- Handles context switching between dashboard/deck/slide
- Maintains conversation history
- Provides API integration methods

### ChatbotTrigger Component

**Purpose**: Trigger button that opens the chatbot panel

**Props**:
```typescript
interface ChatbotTriggerProps {
  variant: 'floating' | 'toolbar' | 'inline';
  context?: ChatContext;
  className?: string;
  children?: React.ReactNode;
}
```

**Variants**:
- `floating`: Bottom-right floating button for dashboard
- `toolbar`: Header button for deck editor
- `inline`: Integrated button for slide editor

### ChatbotPanel Component

**Purpose**: Main chat interface that slides in from the right

**Props**:
```typescript
interface ChatbotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  context: ChatContext;
}
```

**Features**:
- Responsive design (full-screen on mobile)
- Slide-in animation from right
- Context indicator at top
- Message history
- Input field with send button
- Quick action buttons

### ChatMessage Component

**Purpose**: Individual message display with proper formatting

**Props**:
```typescript
interface ChatMessageProps {
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    suggestions?: string[];
    actions?: MessageAction[];
  };
  onActionClick: (action: MessageAction) => void;
}
```

**Features**:
- Markdown rendering for AI responses
- Action buttons for applicable suggestions
- Timestamp display
- Loading states for pending messages

### QuickActions Component

**Purpose**: Context-aware quick action buttons

**Props**:
```typescript
interface QuickActionsProps {
  context: ChatContext;
  onActionClick: (action: string) => void;
}
```

**Context-Based Actions**:
- Dashboard: "Help me start a pitch deck", "Best practices", "Industry insights"
- Deck: "Review deck structure", "Improve overall flow", "Add missing slides"
- Slide: "Improve this slide", "Make it more compelling", "Add data points"

### SpeakerNotesImprover Component

**Purpose**: Specialized interface for speaker notes improvement

**Props**:
```typescript
interface SpeakerNotesImproverProps {
  slideId: string;
  currentNotes: string;
  onImprovement: (improvedNotes: string) => void;
}
```

**Features**:
- Improvement type selection (clarity, engagement, structure, detail)
- Side-by-side comparison of original vs improved notes
- Apply/reject buttons for improvements

## Data Models

### ChatMessage Model

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: ChatContext;
  suggestions?: string[];
  actions?: MessageAction[];
}
```

### MessageAction Model

```typescript
interface MessageAction {
  id: string;
  type: 'apply_text' | 'improve_notes' | 'regenerate_slide' | 'navigate';
  label: string;
  data: any;
}
```

### QuickAction Model

```typescript
interface QuickAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  context: string[];
}
```

## API Integration

### ChatbotService Class

```typescript
class ChatbotService {
  async sendMessage(message: string, context: ChatContext): Promise<ChatResponse>
  async improveSpeakerNotes(slideId: string, notes: string, type: string): Promise<SpeakerNotesResponse>
  async getQuickActions(context: ChatContext): Promise<QuickAction[]>
}
```

### API Endpoints Integration

1. **POST /api/chatbot/chat**
   - Used for general chat messages
   - Includes deck/slide context in request body

2. **POST /api/chatbot/improve-speaker-notes**
   - Used for speaker notes improvement
   - Includes improvement type selection

### Error Handling

- Network errors: Retry mechanism with exponential backoff
- API errors: User-friendly error messages with suggested actions
- Validation errors: Inline validation with helpful guidance
- Rate limiting: Queue messages and show appropriate feedback

## UI/UX Design Patterns

### Design System Integration

**Colors**: Follow existing Tailwind CSS color scheme
- Primary: Blue-600 for actions and highlights
- Secondary: Gray-600 for secondary text
- Success: Green-600 for positive actions
- Error: Red-600 for error states

**Typography**: Consistent with existing application
- Headers: font-semibold text-gray-900
- Body: text-gray-700
- Secondary: text-gray-500

**Spacing**: Follow existing 4px grid system
- Padding: p-4, p-6 for containers
- Margins: space-y-4, space-x-2 for elements
- Gaps: gap-4, gap-6 for flex/grid layouts

### Animation and Transitions

**Panel Slide Animation**:
```css
.chatbot-panel-enter {
  transform: translateX(100%);
}
.chatbot-panel-enter-active {
  transform: translateX(0);
  transition: transform 300ms ease-out;
}
```

**Message Animations**:
- Fade-in for new messages
- Typing indicator for AI responses
- Smooth scroll to bottom for new messages

### Responsive Design

**Desktop (≥1024px)**:
- Panel width: 400px
- Slides in from right
- Maintains main content layout

**Tablet (768px - 1023px)**:
- Panel width: 350px
- Overlay with backdrop

**Mobile (<768px)**:
- Full-screen overlay
- Bottom sheet style on iOS
- Proper keyboard handling

## Accessibility Features

### ARIA Implementation

```typescript
// Panel accessibility
<div
  role="dialog"
  aria-labelledby="chatbot-title"
  aria-describedby="chatbot-description"
  aria-modal="true"
>

// Message list
<div
  role="log"
  aria-live="polite"
  aria-label="Chat conversation"
>

// Input field
<input
  aria-label="Type your message"
  aria-describedby="input-help"
/>
```

### Keyboard Navigation

- **Tab**: Navigate through interactive elements
- **Escape**: Close chatbot panel
- **Enter**: Send message (in input field)
- **Arrow keys**: Navigate through quick actions

### Screen Reader Support

- Live regions for new messages
- Descriptive labels for all interactive elements
- Status announcements for loading states
- Context announcements when switching between deck/slide contexts

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Load chatbot components only when first opened
2. **Message Virtualization**: Virtualize long conversation histories
3. **Debounced Input**: Debounce typing indicators and auto-suggestions
4. **Caching**: Cache conversation history in sessionStorage
5. **Bundle Splitting**: Separate chatbot code into its own chunk

### Memory Management

- Limit conversation history to last 50 messages
- Clear old conversations on page refresh
- Implement cleanup on component unmount

## Testing Strategy

### Unit Testing

- Component rendering and props handling
- State management and context updates
- API service methods and error handling
- Utility functions and helpers

### Integration Testing

- Chatbot panel opening/closing
- Message sending and receiving
- Context switching between dashboard/deck/slide
- Speaker notes improvement workflow

### E2E Testing

- Complete user workflows from trigger to completion
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility compliance

### Test Coverage Goals

- Unit tests: >90% coverage
- Integration tests: All major user flows
- E2E tests: Critical paths and edge cases

## Security Considerations

### Data Handling

- No sensitive data stored in localStorage
- Conversation history cleared on logout
- API tokens handled securely through existing auth system

### Input Validation

- Message length limits (max 2000 characters)
- XSS prevention through proper sanitization
- Rate limiting on client side to prevent spam

### Privacy

- Conversations not persisted beyond session
- No tracking of user interactions
- Compliance with existing privacy policies