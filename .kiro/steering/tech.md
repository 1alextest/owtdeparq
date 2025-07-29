# Technology Stack

## Frontend
- **React 19.1.0** with TypeScript 4.9.5
- **Tailwind CSS 3.4.0** for styling
- **React Scripts 5.0.1** for build tooling
- **Firebase SDK** for authentication
- **@dnd-kit/core** for drag-and-drop functionality
- **Zod 3.22.4** for schema validation

## Backend
- **NestJS 10.0.0** with TypeScript 5.1.3
- **Node.js** runtime
- **TypeORM 0.3.17** for database operations
- **PostgreSQL** database
- **Firebase Admin SDK** for authentication guards
- **OpenAI SDK 4.0.0** for AI integration
- **Ollama** for local AI models (Llama 3.1 8B)

## AI & External Services
- **OpenAI API** for content generation
- **Ollama** with Llama 3.1 8B for local AI
- **Unsplash API** for image suggestions
- **Puppeteer 21.0.0** for PDF export
- **officegen 0.6.5** for PowerPoint export

## Database & Storage
- **PostgreSQL 15** with proper indexing
- **TypeORM migrations** for schema management
- **Cloud storage** for media files (AWS S3/Cloudinary)

## Development Tools
- **Jest** for testing (frontend & backend)
- **ESLint** and **Prettier** for code quality
- **Supabase** for managed PostgreSQL database
- **Supabase** as managed PostgreSQL option

## Common Commands

### Frontend Development
```bash
cd frontend
npm install
npm start          # Development server on :3000
npm run build      # Production build
npm test           # Run tests
```

### Backend Development
```bash
cd backend-nestjs
npm install
npm run start:dev  # Development server on :5000
npm run build      # Production build
npm run test       # Run tests
npm run lint       # Code linting
```

### Database Setup
```bash
# Supabase setup (see DATABASE_SETUP.md for details)
# 1. Create Supabase project
# 2. Get connection string
# 3. Update .env with DATABASE_URL

# Database migrations
npm run migration:run
npm run migration:generate

# Seed sample data
npm run seed
```

### AI Model Setup
```bash
# Install Ollama (user must do manually)
# Download from https://ollama.ai
ollama pull llama3.1:8b
ollama serve
```

## Build & Deployment
- **Frontend**: Vercel deployment
- **Backend**: Railway deployment
- **Database**: Supabase PostgreSQL
- **Environment**: Separate staging and production configs