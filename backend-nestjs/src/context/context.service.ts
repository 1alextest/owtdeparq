import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecordEventDto, UpdateLearningPatternDto } from './dto/record-event.dto';
import { ContextMemoryEvent } from '../entities/context-memory-event.entity';
import { LearningPattern } from '../entities/learning-pattern.entity';
import { ProjectsService } from '../projects/projects.service';
import { DecksService } from '../decks/decks.service';
import { PatternAnalyzerService } from './learning/pattern-analyzer.service';
import { RecommendationEngineService } from './learning/recommendation-engine.service';
import { ContextTrackerService } from './learning/context-tracker.service';

@Injectable()
export class ContextService {
  private readonly logger = new Logger(ContextService.name);

  constructor(
    @InjectRepository(ContextMemoryEvent)
    private eventRepository: Repository<ContextMemoryEvent>,
    @InjectRepository(LearningPattern)
    private patternRepository: Repository<LearningPattern>,
    private projectsService: ProjectsService,
    private decksService: DecksService,
    private patternAnalyzer: PatternAnalyzerService,
    private recommendationEngine: RecommendationEngineService,
    private contextTracker: ContextTrackerService,
  ) {}

  async recordEvent(recordDto: RecordEventDto, userId: string) {
    this.logger.log(`Recording event: ${recordDto.eventType} for user ${userId}`);

    // Verify ownership
    await this.projectsService.verifyProjectOwnership(recordDto.projectId, userId);
    await this.decksService.verifyDeckOwnership(recordDto.deckId, userId);

    const event = this.eventRepository.create({
      ...recordDto,
      learningScope: recordDto.learningScope || 'deck',
    });

    const savedEvent = await this.eventRepository.save(event);

    // Use advanced pattern analysis
    await this.patternAnalyzer.updateLearningPatterns(userId, savedEvent);

    // Track in real-time context system
    await this.contextTracker.trackUserAction({
      userId,
      projectId: recordDto.projectId,
      deckId: recordDto.deckId,
      actionType: recordDto.eventType,
      actionData: recordDto.content,
      timestamp: new Date(),
    });

    return savedEvent;
  }

  async getUserLearningPatterns(userId: string) {
    return await this.patternRepository.find({
      where: { userId },
      order: { confidenceScore: 'DESC', lastReinforced: 'DESC' },
    });
  }

  async getProjectLearningPatterns(projectId: string, userId: string) {
    await this.projectsService.verifyProjectOwnership(projectId, userId);

    return await this.patternRepository.find({
      where: [
        { userId, scopeType: 'project', scopeId: projectId },
        { userId, scopeType: 'global' },
      ],
      order: { confidenceScore: 'DESC' },
    });
  }

  async updateProjectLearningPattern(
    projectId: string,
    updateDto: UpdateLearningPatternDto,
    userId: string,
  ) {
    await this.projectsService.verifyProjectOwnership(projectId, userId);

    // Find existing pattern or create new one
    let pattern = await this.patternRepository.findOne({
      where: {
        userId,
        scopeType: 'project',
        scopeId: projectId,
        patternType: 'content_preference', // Default type
      },
    });

    if (!pattern) {
      pattern = this.patternRepository.create({
        userId,
        scopeType: 'project',
        scopeId: projectId,
        patternType: 'content_preference',
        patternData: updateDto.patternData,
        confidenceScore: updateDto.confidenceScore || 0.5,
      });
    } else {
      pattern.patternData = { ...pattern.patternData, ...updateDto.patternData };
      if (updateDto.confidenceScore !== undefined) {
        pattern.confidenceScore = updateDto.confidenceScore;
      }
    }

    return await this.patternRepository.save(pattern);
  }

  async getDeckContextSummary(deckId: string, userId: string) {
    this.logger.log(`Getting context summary for deck ${deckId}`);

    await this.decksService.verifyDeckOwnership(deckId, userId);

    // Get comprehensive user behavior profile
    const behaviorProfile = await this.patternAnalyzer.analyzeUserBehavior(userId, 'deck', deckId);

    // Get recent activity
    const recentActivity = await this.contextTracker.getRecentActivity(userId, 24);

    // Get session context
    const sessionContext = await this.contextTracker.getSessionContext(userId);

    // Get deck-specific patterns
    const deck = await this.decksService.findOne(deckId, userId);
    const patterns = await this.getProjectLearningPatterns(deck.projectId, userId);

    // Build enhanced context summary
    const contextSummary = {
      behaviorProfile,
      recentActivity: recentActivity.slice(0, 10), // Last 10 actions
      sessionInfo: sessionContext ? {
        duration: Date.now() - sessionContext.startTime.getTime(),
        actionsCount: sessionContext.actions.length,
        currentFocus: sessionContext.currentFocus,
      } : null,
      learningPatterns: patterns.map(p => ({
        type: p.patternType,
        confidence: p.confidenceScore,
        scope: p.scopeType,
        lastReinforced: p.lastReinforced,
      })),
      recommendations: await this.getContextualRecommendations(deckId, userId),
      lastActivity: recentActivity[0]?.timestamp || null,
    };

    return contextSummary;
  }

  async getContextualRecommendations(deckId: string, userId: string) {
    const deck = await this.decksService.findOne(deckId, userId);
    const slides = deck.slides || [];

    const recommendations = [];

    // Get recommendations for each slide
    for (const slide of slides.slice(0, 5)) { // Limit to first 5 slides
      const slideRecommendations = await this.recommendationEngine.generateContextualRecommendations(
        userId,
        slide.slideType,
        slide.content,
        deck,
        'deck',
        deckId
      );

      recommendations.push({
        slideId: slide.id,
        slideTitle: slide.title,
        recommendations: slideRecommendations.slice(0, 3), // Top 3 per slide
      });
    }

    return recommendations;
  }

  private async analyzeAndUpdateLearningPatterns(event: ContextMemoryEvent, userId: string) {
    // Simple pattern analysis - in production, this would be more sophisticated
    if (event.eventType === 'user_edit') {
      await this.updateContentPreferencePattern(event, userId);
    } else if (event.eventType === 'feedback') {
      await this.updateCorrectionPattern(event, userId);
    }
  }

  private async updateContentPreferencePattern(event: ContextMemoryEvent, userId: string) {
    const pattern = await this.patternRepository.findOne({
      where: {
        userId,
        scopeType: event.learningScope,
        scopeId: event.learningScope === 'deck' ? event.deckId : event.projectId,
        patternType: 'content_preference',
      },
    });

    if (pattern) {
      // Update existing pattern
      pattern.confidenceScore = Math.min(1.0, pattern.confidenceScore + 0.1);
      await this.patternRepository.save(pattern);
    } else {
      // Create new pattern
      const newPattern = this.patternRepository.create({
        userId,
        scopeType: event.learningScope,
        scopeId: event.learningScope === 'deck' ? event.deckId : event.projectId,
        patternType: 'content_preference',
        patternData: { preferences: event.content },
        confidenceScore: 0.3,
      });
      await this.patternRepository.save(newPattern);
    }
  }

  private async updateCorrectionPattern(event: ContextMemoryEvent, userId: string) {
    // Similar logic for correction patterns
    // Implementation would analyze feedback and create/update correction patterns
  }

  private extractUserPreferences(patterns: LearningPattern[]) {
    return patterns
      .filter(p => p.patternType === 'content_preference')
      .map(p => ({
        scope: p.scopeType,
        confidence: p.confidenceScore,
        preferences: p.patternData,
      }));
  }

  private extractCommonPatterns(events: ContextMemoryEvent[]) {
    const eventTypes = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(eventTypes).map(([type, count]) => ({
      type,
      frequency: count,
    }));
  }

  private generateSuggestions(events: ContextMemoryEvent[], patterns: LearningPattern[]) {
    const suggestions = [];

    if (events.filter(e => e.eventType === 'user_edit').length > 5) {
      suggestions.push('Consider using AI suggestions to reduce manual editing');
    }

    if (patterns.some(p => p.confidenceScore > 0.8)) {
      suggestions.push('Strong user preferences detected - AI can be more personalized');
    }

    return suggestions;
  }
}
