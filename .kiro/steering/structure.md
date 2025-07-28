# Project Structure

## Root Directory Layout
```
├── frontend/              # React TypeScript frontend
├── backend-nestjs/        # NestJS backend API
├── backend/              # Legacy Flask backend (deprecated)
├── src/                  # Shared media assets
├── .kiro/                # Kiro AI assistant configuration
└── README.md             # Project documentation
```

## Frontend Structure (`frontend/`)
```
frontend/
├── src/
│   ├── components/       # Reusable React components
│   ├── pages/           # Page-level components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API service functions
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── styles/          # Global styles and Tailwind config
├── public/              # Static assets
├── build/               # Production build output
└── package.json         # Dependencies and scripts
```

## Backend Structure (`backend-nestjs/`)
```
backend-nestjs/
├── src/
│   ├── auth/            # Firebase authentication module
│   ├── projects/        # Project management module
│   ├── decks/           # Pitch deck CRUD operations
│   ├── slides/          # Individual slide management
│   ├── ai/              # AI provider services
│   ├── export/          # PDF/PPTX export functionality
│   ├── chatbot/         # AI chatbot for script assistance
│   ├── media/           # File upload and image suggestions
│   ├── templates/       # Slide template management
│   ├── versions/        # Version control system
│   ├── context/         # Context memory and learning
│   ├── database/        # TypeORM entities and migrations
│   └── common/          # Shared utilities and guards
├── dist/                # Compiled JavaScript output
├── test/                # Test files
└── package.json         # Dependencies and scripts
```

## Database Schema Organization
- **Core entities**: projects, pitch_decks, slides
- **AI features**: context_memory_events, learning_patterns, user_ai_settings
- **Templates**: slide_templates with categorization
- **Versioning**: deck_versions for change tracking
- **Media**: media_files for uploaded content
- **Chat**: chat_contexts for chatbot sessions

## Key Architectural Patterns

### Frontend Patterns
- **Component composition** over inheritance
- **Custom hooks** for shared logic
- **Context API** for global state management
- **Service layer** for API communication
- **TypeScript interfaces** for type safety

### Backend Patterns
- **Module-based architecture** with NestJS decorators
- **Dependency injection** for service management
- **Repository pattern** with TypeORM
- **Guard-based authentication** with Firebase
- **Service layer separation** for business logic
- **DTO validation** with class-validator

### AI Integration Patterns
- **Multi-provider architecture** with fallback mechanisms
- **Context-aware generation** using learning patterns
- **Hierarchical learning** (deck → project → global)
- **Intelligent caching** for AI responses

## File Naming Conventions
- **Components**: PascalCase (e.g., `DeckEditor.tsx`)
- **Services**: camelCase with .service suffix (e.g., `ai-provider.service.ts`)
- **Types**: PascalCase interfaces (e.g., `PitchDeck.interface.ts`)
- **Database entities**: kebab-case tables, PascalCase entities
- **API endpoints**: RESTful with kebab-case paths

## Import Organization
1. External libraries (React, NestJS, etc.)
2. Internal services and utilities
3. Type definitions and interfaces
4. Relative imports (components, etc.)

## Environment Configuration
- **Development**: Local database, test API keys
- **Staging**: Supabase database, limited AI quotas
- **Production**: Railway/Supabase, production API keys
- **Environment files**: `.env`, `.env.example` for templates