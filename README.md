# Owtdeparq - AI Pitch Deck Generator

An intelligent pitch deck generator that creates professional presentations using AI with multiple provider support (OpenAI, Groq, Ollama).

## Project Structure

```
├── frontend/              # React 19.1.0 TypeScript frontend
├── backend-nestjs/        # NestJS TypeScript backend
├── src/                   # Additional services
├── README.md              # This file
└── .gitignore             # Git ignore rules
```

## Tech Stack

### Frontend
- **React** 19.1.0
- **TypeScript** 4.9.5
- **React Scripts** 5.0.1
- **Tailwind CSS** 3.4.0
- **Firebase** 10.14.1 (Authentication)
- **Testing Library** (Jest, React Testing Library)
- **Zod** 3.22.4 (Schema validation)

### Backend
- **NestJS** 10.0.0
- **TypeScript** 5.1.3
- **TypeORM** 0.3.17
- **PostgreSQL** (via pg 8.11.3)
- **Firebase Admin** 11.10.1 (Authentication)
- **Swagger** 7.1.8 (API Documentation)

### AI Providers
- **OpenAI** 4.0.0
- **Groq SDK** 0.27.0
- **Ollama** (Local AI models)

### Additional Features
- **AWS S3** (File storage)
- **PDF Generation** (jsPDF, Puppeteer)
- **PowerPoint Export** (pptxgenjs, officegen)
- **Image Processing** (Sharp, html2canvas)

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Firebase project (for authentication)
- AI provider API keys (OpenAI, Groq, or local Ollama)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend-nestjs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file with:
   - Database connection details
   - Firebase service account
   - AI provider API keys
   - AWS S3 credentials (optional)

5. Run database migrations:
   ```bash
   npm run migration:run
   ```

6. Start the development server:
   ```bash
   npm run start:dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase in `src/config/firebase.ts`

4. Start the development server:
   ```bash
   npm start
   ```

## Development

- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:3000 (React dev server)
- **API Documentation**: http://localhost:3000/api (Swagger UI)

## Features

### Core Features
- 🤖 **AI-Powered Generation**: Multiple AI providers (OpenAI, Groq, Ollama)
- 📊 **Professional Templates**: Pre-built slide templates
- 🎨 **Custom Styling**: Tailwind CSS for responsive design
- 🔐 **Authentication**: Firebase-based user management
- 💾 **Data Persistence**: PostgreSQL with TypeORM

### Generation Modes
- **Free Prompt**: Generate slides from simple text prompts
- **Custom Form**: Structured input for specific slide types
- **Slide Regeneration**: Regenerate individual slides

### Export Options
- 📄 **PDF Export**: High-quality PDF generation
- 📊 **PowerPoint Export**: Native .pptx file creation
- 🖼️ **Image Export**: Individual slide images

### Advanced Features
- 📁 **Project Management**: Organize decks by projects
- 🔄 **Version Control**: Track deck versions
- 🎯 **Context Learning**: AI learns from user preferences
- 📱 **Responsive Design**: Works on desktop and mobile

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Projects
- `GET /projects` - List user projects
- `POST /projects` - Create new project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Decks
- `GET /decks` - List decks
- `POST /decks` - Create new deck
- `PUT /decks/:id` - Update deck
- `DELETE /decks/:id` - Delete deck

### Generation
- `POST /generation/free` - Generate from free prompt
- `POST /generation/custom` - Generate from structured input
- `POST /generation/regenerate` - Regenerate specific slide

### Export
- `POST /export/pdf` - Export deck as PDF
- `POST /export/powerpoint` - Export deck as PowerPoint
- `POST /export/images` - Export slides as images

## Database Schema

The application uses PostgreSQL with TypeORM for the following entities:
- **Users**: User accounts and preferences
- **Projects**: Project organization
- **PitchDecks**: Deck metadata
- **Slides**: Individual slide content
- **DeckVersions**: Version history
- **UserAISettings**: AI provider preferences

## Testing

### Backend Tests
```bash
cd backend-nestjs
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:cov      # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm test              # Interactive test runner
npm run test:coverage # Coverage report
```

## Deployment

### Backend Deployment
1. Build the application:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm run start:prod
   ```

### Frontend Deployment
1. Build for production:
   ```bash
   npm run build
   ```

2. Serve the `build` directory with your preferred web server

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=owtdeparq

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# AI Providers
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key
OLLAMA_BASE_URL=http://localhost:11434

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the UNLICENSED License - see the package.json files for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.