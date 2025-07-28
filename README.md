# AI Pitch Deck Generator

An intelligent pitch deck generator that creates professional presentations using AI.

## Project Structure

```
├── frontend/          # React 19.1.0 TypeScript frontend
├── backend/           # Flask Python backend
├── README.md          # This file
└── .gitignore         # Git ignore rules
```

## Tech Stack

### Frontend
- React 19.1.0
- TypeScript 4.9.5
- React Scripts 5.0.1
- Testing Library

### Backend
- Flask 2.3.3
- Flask-CORS 4.0.0
- Python-dotenv 1.0.0

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   ```bash
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

6. Edit `.env` file with your API keys

7. Run the backend:
   ```bash
   python app.py
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

3. Start the development server:
   ```bash
   npm start
   ```

## Development

- Backend runs on: http://localhost:5000
- Frontend runs on: http://localhost:3000

## Features

- AI-powered pitch deck generation
- Professional slide templates
- Real-time collaboration
- Export to multiple formats