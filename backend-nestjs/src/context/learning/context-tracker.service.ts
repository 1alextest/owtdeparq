import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContextMemoryEvent, EventType, LearningScope } from '../../entities/context-memory-event.entity';
import { PatternAnalyzerService } from './pattern-analyzer.service';

export interface UserAction {
  userId: string;
  projectId: string;
  deckId: string;
  slideId?: string;
  actionType: EventType;
  actionData: any;
  timestamp: Date;
  sessionId?: string;
}

export interface SessionContext {
  sessionId: string;
  userId: string;
  startTime: Date;
  lastActivity: Date;
  actions: UserAction[];
  currentFocus: {
    projectId?: string;
    deckId?: string;
    slideId?: string;
  };
}

@Injectable()
export class ContextTrackerService {
  private readonly logger = new Logger(ContextTrackerService.name);
  private activeSessions = new Map<string, SessionContext>();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor(
    @InjectRepository(ContextMemoryEvent)
    private eventRepository: Repository<ContextMemoryEvent>,
    private patternAnalyzer: PatternAnalyzerService,
  ) {
    // Clean up inactive sessions every 5 minutes
    setInterval(() => this.cleanupInactiveSessions(), 5 * 60 * 1000);
  }

  async trackUserAction(action: UserAction): Promise<void> {
    this.logger.debug(`Tracking action: ${action.actionType} for user ${action.userId}`);

    try {
      // Update session context
      await this.updateSessionContext(action);

      // Create context memory event
      const event = await this.createContextEvent(action);

      // Trigger pattern analysis
      await this.patternAnalyzer.updateLearningPatterns(action.userId, event);

      // Real-time learning updates
      await this.processRealTimeLearning(action, event);
    } catch (error) {
      this.logger.error(`Failed to track user action:`, error);
    }
  }

  async getSessionContext(userId: string, sessionId?: string): Promise<SessionContext | null> {
    if (sessionId) {
      return this.activeSessions.get(sessionId) || null;
    }

    // Find active session for user
    for (const session of this.activeSessions.values()) {
      if (session.userId === userId && this.isSessionActive(session)) {
        return session;
      }
    }

    return null;
  }

  async startSession(userId: string, sessionId?: string): Promise<string> {
    const id = sessionId || this.generateSessionId();
    
    const session: SessionContext = {
      sessionId: id,
      userId,
      startTime: new Date(),
      lastActivity: new Date(),
      actions: [],
      currentFocus: {},
    };

    this.activeSessions.set(id, session);
    this.logger.log(`Started session ${id} for user ${userId}`);
    
    return id;
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      // Process session summary for learning
      await this.processSessionSummary(session);
      
      this.activeSessions.delete(sessionId);
      this.logger.log(`Ended session ${sessionId}`);
    }
  }

  async trackSlideEdit(
    userId: string,
    projectId: string,
    deckId: string,
    slideId: string,
    editData: {
      before: string;
      after: string;
      editType: string;
      timeSpent: number;
    }
  ): Promise<void> {
    const action: UserAction = {
      userId,
      projectId,
      deckId,
      slideId,
      actionType: 'user_edit',
      actionData: {
        ...editData,
        lengthChange: editData.after.length - editData.before.length,
        addedBullets: this.detectBulletAddition(editData.before, editData.after),
        addedNumbers: this.detectNumberAddition(editData.before, editData.after),
        toneChange: this.detectToneChange(editData.before, editData.after),
      },
      timestamp: new Date(),
    };

    await this.trackUserAction(action);
  }

  async trackFeedback(
    userId: string,
    projectId: string,
    deckId: string,
    slideId: string,
    feedbackData: {
      type: 'positive' | 'negative' | 'neutral';
      aspect: string;
      suggestion?: string;
      rating?: number;
    }
  ): Promise<void> {
    const action: UserAction = {
      userId,
      projectId,
      deckId,
      slideId,
      actionType: 'feedback',
      actionData: {
        feedbackType: feedbackData.type,
        aspect: feedbackData.aspect,
        suggestion: feedbackData.suggestion,
        rating: feedbackData.rating,
        sentiment: this.analyzeSentiment(feedbackData.suggestion || ''),
      },
      timestamp: new Date(),
    };

    await this.trackUserAction(action);
  }

  async trackChatInteraction(
    userId: string,
    projectId: string,
    deckId: string,
    slideId: string,
    chatData: {
      userMessage: string;
      aiResponse: string;
      satisfaction?: number;
      followUpAction?: string;
    }
  ): Promise<void> {
    const action: UserAction = {
      userId,
      projectId,
      deckId,
      slideId,
      actionType: 'chatbot_interaction',
      actionData: {
        userMessage: chatData.userMessage,
        aiResponse: chatData.aiResponse,
        satisfaction: chatData.satisfaction,
        followUpAction: chatData.followUpAction,
        requestType: this.classifyRequest(chatData.userMessage),
        messageLength: chatData.userMessage.length,
        responseLength: chatData.aiResponse.length,
      },
      timestamp: new Date(),
    };

    await this.trackUserAction(action);
  }

  async getRecentActivity(userId: string, hours: number = 24): Promise<UserAction[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const events = await this.eventRepository.find({
      where: {
        projectId: await this.getUserProjectIds(userId),
        createdAt: cutoff,
      },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    return events.map(event => ({
      userId,
      projectId: event.projectId,
      deckId: event.deckId,
      actionType: event.eventType,
      actionData: event.content,
      timestamp: event.createdAt,
    }));
  }

  private async updateSessionContext(action: UserAction): Promise<void> {
    let session = await this.getSessionContext(action.userId);
    
    if (!session || !this.isSessionActive(session)) {
      const sessionId = await this.startSession(action.userId);
      session = this.activeSessions.get(sessionId)!;
    }

    // Update session data
    session.lastActivity = new Date();
    session.actions.push(action);
    session.currentFocus = {
      projectId: action.projectId,
      deckId: action.deckId,
      slideId: action.slideId,
    };

    // Keep only recent actions in memory
    if (session.actions.length > 50) {
      session.actions = session.actions.slice(-50);
    }
  }

  private async createContextEvent(action: UserAction): Promise<ContextMemoryEvent> {
    const event = this.eventRepository.create({
      projectId: action.projectId,
      deckId: action.deckId,
      eventType: action.actionType,
      content: action.actionData,
      learningScope: this.determineLearningScope(action),
    });

    return await this.eventRepository.save(event);
  }

  private async processRealTimeLearning(action: UserAction, event: ContextMemoryEvent): Promise<void> {
    // Real-time pattern updates based on immediate actions
    if (action.actionType === 'user_edit') {
      await this.updateEditPatterns(action);
    } else if (action.actionType === 'feedback') {
      await this.updateFeedbackPatterns(action);
    }
  }

  private async processSessionSummary(session: SessionContext): Promise<void> {
    // Analyze session patterns for learning
    const sessionDuration = session.lastActivity.getTime() - session.startTime.getTime();
    const actionCounts = this.countActionTypes(session.actions);
    
    // Create session summary event
    const summaryAction: UserAction = {
      userId: session.userId,
      projectId: session.currentFocus.projectId || '',
      deckId: session.currentFocus.deckId || '',
      actionType: 'user_input',
      actionData: {
        sessionSummary: true,
        duration: sessionDuration,
        actionCounts,
        focusAreas: this.analyzeFocusAreas(session.actions),
        productivity: this.calculateProductivity(session.actions),
      },
      timestamp: session.lastActivity,
    };

    await this.trackUserAction(summaryAction);
  }

  // Helper methods
  private isSessionActive(session: SessionContext): boolean {
    const now = Date.now();
    const lastActivity = session.lastActivity.getTime();
    return (now - lastActivity) < this.SESSION_TIMEOUT;
  }

  private cleanupInactiveSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if ((now - session.lastActivity.getTime()) > this.SESSION_TIMEOUT) {
        this.processSessionSummary(session);
        this.activeSessions.delete(sessionId);
        this.logger.debug(`Cleaned up inactive session: ${sessionId}`);
      }
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineLearningScope(action: UserAction): LearningScope {
    // Determine appropriate learning scope based on action
    if (action.slideId) return 'deck';
    if (action.deckId) return 'project';
    return 'global';
  }

  private detectBulletAddition(before: string, after: string): boolean {
    const beforeBullets = (before.match(/[•\-\*]/g) || []).length;
    const afterBullets = (after.match(/[•\-\*]/g) || []).length;
    return afterBullets > beforeBullets;
  }

  private detectNumberAddition(before: string, after: string): boolean {
    const beforeNumbers = (before.match(/\d+/g) || []).length;
    const afterNumbers = (after.match(/\d+/g) || []).length;
    return afterNumbers > beforeNumbers;
  }

  private detectToneChange(before: string, after: string): string | null {
    // Simple tone detection - in production, this could use NLP
    const formalWords = ['therefore', 'furthermore', 'consequently', 'accordingly'];
    const casualWords = ['really', 'pretty', 'quite', 'basically'];

    const beforeFormal = formalWords.some(word => before.toLowerCase().includes(word));
    const afterFormal = formalWords.some(word => after.toLowerCase().includes(word));
    const beforeCasual = casualWords.some(word => before.toLowerCase().includes(word));
    const afterCasual = casualWords.some(word => after.toLowerCase().includes(word));

    if (!beforeFormal && afterFormal) return 'more_formal';
    if (beforeFormal && !afterFormal) return 'less_formal';
    if (!beforeCasual && afterCasual) return 'more_casual';
    if (beforeCasual && !afterCasual) return 'less_casual';

    return null;
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    // Simple sentiment analysis - in production, use proper NLP
    const positiveWords = ['good', 'great', 'excellent', 'perfect', 'love', 'like'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'wrong'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private classifyRequest(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('improve') || lowerMessage.includes('better')) return 'improvement';
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) return 'assistance';
    if (lowerMessage.includes('generate') || lowerMessage.includes('create')) return 'generation';
    if (lowerMessage.includes('review') || lowerMessage.includes('feedback')) return 'review';

    return 'general';
  }

  private countActionTypes(actions: UserAction[]): Record<string, number> {
    return actions.reduce((counts, action) => {
      counts[action.actionType] = (counts[action.actionType] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  private analyzeFocusAreas(actions: UserAction[]): any {
    const slideTypes = actions
      .filter(action => action.actionData.slideType)
      .map(action => action.actionData.slideType);

    const focusDistribution = slideTypes.reduce((dist, type) => {
      dist[type] = (dist[type] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    return {
      primaryFocus: this.getMostFrequent(slideTypes),
      distribution: focusDistribution,
      breadth: Object.keys(focusDistribution).length,
    };
  }

  private calculateProductivity(actions: UserAction[]): number {
    // Simple productivity calculation based on action types and frequency
    const weights = {
      'user_edit': 2,
      'ai_generation': 1,
      'feedback': 1,
      'chatbot_interaction': 0.5,
      'user_input': 1,
    };

    const totalScore = actions.reduce((score, action) => {
      return score + (weights[action.actionType] || 0);
    }, 0);

    return Math.min(1.0, totalScore / 20); // Normalize to 0-1
  }

  private getMostFrequent(items: string[]): string | null {
    if (items.length === 0) return null;

    const frequency = items.reduce((freq, item) => {
      freq[item] = (freq[item] || 0) + 1;
      return freq;
    }, {} as Record<string, number>);

    return Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
  }

  private async getUserProjectIds(userId: string): Promise<any> {
    // This would query the projects table to get user's project IDs
    // For now, return a placeholder query condition
    return { userId };
  }

  private async updateEditPatterns(action: UserAction): Promise<void> {
    // Real-time pattern updates for edits
    this.logger.debug(`Updating edit patterns for user ${action.userId}`);
  }

  private async updateFeedbackPatterns(action: UserAction): Promise<void> {
    // Real-time pattern updates for feedback
    this.logger.debug(`Updating feedback patterns for user ${action.userId}`);
  }
}
