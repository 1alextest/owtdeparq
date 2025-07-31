import { ConfigService } from '@nestjs/config';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
  process.env.FIREBASE_PROJECT_ID = 'test-project';
  process.env.FIREBASE_PRIVATE_KEY = 'test-key';
  process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com';
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.GROQ_API_KEY = 'test-groq-key';
  process.env.OLLAMA_ENABLED = 'false';
});

// Global test timeout
jest.setTimeout(30000);

// Mock external services by default
jest.mock('openai');
jest.mock('groq-sdk');
jest.mock('firebase-admin');
jest.mock('axios');

// Suppress console logs during tests unless explicitly needed
const originalConsole = console;
beforeEach(() => {
  if (!process.env.VERBOSE_TESTS) {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterEach(() => {
  if (!process.env.VERBOSE_TESTS) {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  }
});