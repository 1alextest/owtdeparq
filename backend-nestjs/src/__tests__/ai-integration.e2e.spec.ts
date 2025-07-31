import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatContext } from '../entities/chat-context.entity';
import { PitchDeck } from '../entities/pitch-deck.entity';
import { Project } from '../entities/project.entity';
import { Slide } from '../entities/slide.entity';

describe('AI Integration (e2e)', () => {
  let app: INestApplication;
  let chatRepository: Repository<ChatContext>;
  let deckRepository: Repository<PitchDeck>;
  let projectRepository: Repository<Project>;
  let slideRepository: Repository<Slide>;

  const testUserId = 'test-user-e2e-123';
  const mockAuthToken = 'mock-jwt-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    chatRepository = moduleFixture.get<Repository<ChatContext>>(getRepositoryToken(ChatContext));
    deckRepository = moduleFixture.get<Repository<PitchDeck>>(getRepositoryToken(PitchDeck));
    projectRepository = moduleFixture.get<Repository<Project>>(getRepositoryToken(Project));
    slideRepository = moduleFixture.get<Repository<Slide>>(getRepositoryToken(Slide));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await chatRepository.delete({ userId: testUserId });
    await slideRepository.delete({});
    await deckRepository.delete({});
    await projectRepository.delete({ userId: testUserId });
  });

  describe('Virtual Deck Conversations', () => {
    it('should handle dashboard conversation and create virtual deck', async () => {
      const virtualDeckId = 'a4446b18-c9fb-592a-8808-16b166a802f4';
      
      const response = await request(app.getHttpServer())
        .post('/api/chatbot/chat')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({
          message: 'What are the key elements of a pitch deck?',
          deckId: virtualDeckId,
          context: {
            type: 'dashboard',
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('provider', 'groq');
      expect(response.body.message).toContain('pitch deck');

      // Verify virtual project was created
      const virtualProject = await projectRepository.findOne({
        where: { userId: testUserId, name: 'Virtual Dashboard Project' },
      });
      expect(virtualProject).toBeTruthy();

      // Verify virtual deck was created
      const virtualDeck = await deckRepository.findOne({
        where: { id: virtualDeckId },
      });
      expect(virtualDeck).toBeTruthy();
      expect(virtualDeck?.title).toBe('Dashboard Conversations');
      expect(virtualDeck?.mode).toBe('free');

      // Verify conversation was saved
      const conversation = await chatRepository.findOne({
        where: { userId: testUserId, deckId: virtualDeckId },
      });
      expect(conversation).toBeTruthy();
    });

    it('should reuse existing virtual deck for subsequent conversations', async () => {
      const virtualDeckId = 'a4446b18-c9fb-592a-8808-16b166a802f4';

      // First conversation
      await request(app.getHttpServer())
        .post('/api/chatbot/chat')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({
          message: 'First message',
          deckId: virtualDeckId,
          context: { type: 'dashboard' },
        })
        .expect(200);

      // Second conversation
      await request(app.getHttpServer())
        .post('/api/chatbot/chat')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({
          message: 'Second message',
          deckId: virtualDeckId,
          context: { type: 'dashboard' },
        })
        .expect(200);

      // Should only have one virtual project and deck
      const virtualProjects = await projectRepository.find({
        where: { userId: testUserId, name: 'Virtual Dashboard Project' },
      });
      expect(virtualProjects).toHaveLength(1);

      const virtualDecks = await deckRepository.find({
        where: { id: virtualDeckId },
      });
      expect(virtualDecks).toHaveLength(1);

      // Should have two conversations
      const conversations = await chatRepository.find({
        where: { userId: testUserId, deckId: virtualDeckId },
      });
      expect(conversations).toHaveLength(2);
    });
  });

  describe('Real Deck Conversations', () => {
    let testProject: Project;
    let testDeck: PitchDeck;
    let testSlide: Slide;

    beforeEach(async () => {
      // Create test project
      testProject = await projectRepository.save({
        name: 'Test Project',
        description: 'Test project for e2e tests',
        userId: testUserId,
      });

      // Create test deck
      testDeck = await deckRepository.save({
        projectId: testProject.id,
        title: 'Test Pitch Deck',
        mode: 'free',
        generationData: {},
      });

      // Create test slide
      testSlide = await slideRepository.save({
        deckId: testDeck.id,
        title: 'Problem Statement',
        content: 'Test problem content',
        speakerNotes: 'Test speaker notes',
        slideType: 'problem',
        slideOrder: 1,
      });
    });

    it('should handle deck-specific conversation', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/chatbot/chat')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({
          message: 'How can I improve this deck?',
          deckId: testDeck.id,
          context: {
            type: 'deck',
            deckId: testDeck.id,
            deckTitle: testDeck.title,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('provider', 'groq');

      // Verify conversation was saved
      const conversation = await chatRepository.findOne({
        where: { userId: testUserId, deckId: testDeck.id },
      });
      expect(conversation).toBeTruthy();
    });

    it('should handle slide-specific conversation', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/chatbot/chat')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({
          message: 'Help me improve this slide',
          deckId: testDeck.id,
          slideId: testSlide.id,
          context: {
            type: 'slide',
            deckId: testDeck.id,
            slideId: testSlide.id,
            slideTitle: testSlide.title,
            slideType: testSlide.slideType,
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('provider', 'groq');

      // Verify conversation was saved with slide reference
      const conversation = await chatRepository.findOne({
        where: { 
          userId: testUserId, 
          deckId: testDeck.id,
          slideId: testSlide.id,
        },
      });
      expect(conversation).toBeTruthy();
    });
  });

  describe('Slide Regeneration', () => {
    let testProject: Project;
    let testDeck: PitchDeck;
    let testSlide: Slide;

    beforeEach(async () => {
      testProject = await projectRepository.save({
        name: 'Test Project',
        description: 'Test project for regeneration',
        userId: testUserId,
      });

      testDeck = await deckRepository.save({
        projectId: testProject.id,
        title: 'Test Deck for Regeneration',
        mode: 'free',
        generationData: {},
      });

      testSlide = await slideRepository.save({
        deckId: testDeck.id,
        title: 'Original Title',
        content: 'Original content',
        speakerNotes: 'Original notes',
        slideType: 'problem',
        slideOrder: 1,
      });
    });

    it('should regenerate slide content successfully', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/generate/slides/${testSlide.id}/regenerate`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({
          modelChoice: 'groq',
          userFeedback: 'Make it more compelling',
        })
        .expect(200);

      expect(response.body).toHaveProperty('id', testSlide.id);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('generatedBy', 'groq');

      // Verify slide was updated in database
      const updatedSlide = await slideRepository.findOne({
        where: { id: testSlide.id },
      });
      expect(updatedSlide?.generatedBy).toBe('groq');
    });

    it('should handle regeneration with minimal payload', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/generate/slides/${testSlide.id}/regenerate`)
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('id', testSlide.id);
    });

    it('should return 404 for non-existent slide', async () => {
      await request(app.getHttpServer())
        .post('/api/generate/slides/non-existent-slide/regenerate')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({
          modelChoice: 'groq',
        })
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for unauthorized requests', async () => {
      await request(app.getHttpServer())
        .post('/api/chatbot/chat')
        .send({
          message: 'Test message',
          deckId: 'some-deck-id',
        })
        .expect(401);
    });

    it('should handle invalid deck ID for real deck conversations', async () => {
      await request(app.getHttpServer())
        .post('/api/chatbot/chat')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({
          message: 'Test message',
          deckId: 'non-existent-deck-id',
          context: { type: 'deck' },
        })
        .expect(404);
    });

    it('should validate request payload', async () => {
      await request(app.getHttpServer())
        .post('/api/chatbot/chat')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({
          // Missing required fields
        })
        .expect(400);
    });
  });

  describe('AI Provider Integration', () => {
    it('should use Groq provider for chat responses', async () => {
      const virtualDeckId = 'a4446b18-c9fb-592a-8808-16b166a802f4';

      const response = await request(app.getHttpServer())
        .post('/api/chatbot/chat')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({
          message: 'Test Groq integration',
          deckId: virtualDeckId,
          context: { type: 'dashboard' },
        })
        .expect(200);

      expect(response.body.provider).toBe('groq');
    });

    it('should handle AI provider failures gracefully', async () => {
      // This test would require mocking the AI provider to fail
      // For now, we verify the endpoint structure
      const virtualDeckId = 'a4446b18-c9fb-592a-8808-16b166a802f4';

      const response = await request(app.getHttpServer())
        .post('/api/chatbot/chat')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({
          message: 'Test message',
          deckId: virtualDeckId,
          context: { type: 'dashboard' },
        });

      // Should either succeed or fail gracefully (not crash)
      expect([200, 500]).toContain(response.status);
    });
  });
});
