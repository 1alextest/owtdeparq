import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContextMemoryEvent, EventType } from '../../entities/context-memory-event.entity';
import { LearningPattern, PatternType, ScopeType } from '../../entities/learning-pattern.entity';

export interface PatternAnalysisResult {
  patternType: PatternType;
  confidence: number;
  data: any;
  reinforcements: number;
  lastSeen: Date;
}

export interface UserBehaviorProfile {
  contentPreferences: {
    preferredLength: 'concise' | 'detailed' | 'comprehensive';
    writingStyle: 'formal' | 'conversational' | 'technical';
    dataUsage: 'minimal' | 'moderate' | 'heavy';
    structurePreference: 'bullet_points' | 'paragraphs' | 'mixed';
  };
  correctionPatterns: {
    commonEdits: string[];
    frequentFeedback: string[];
    rejectedSuggestions: string[];
  };
  stylePreferences: {
    tonePreference: 'professional' | 'persuasive' | 'analytical';
    industryFocus: string[];
    slideTypeExpertise: string[];
  };
}

@Injectable()
export class PatternAnalyzerService {
  private readonly logger = new Logger(PatternAnalyzerService.name);

  constructor(
    @InjectRepository(ContextMemoryEvent)
    private eventRepository: Repository<ContextMemoryEvent>,
    @InjectRepository(LearningPattern)
    private patternRepository: Repository<LearningPattern>,
  ) {}

  async analyzeUserBehavior(userId: string, scopeType: ScopeType = 'global', scopeId?: string): Promise<UserBehaviorProfile> {
    this.logger.log(`Analyzing behavior for user ${userId}, scope: ${scopeType}`);

    // Get recent events for analysis
    const events = await this.getRecentEvents(userId, scopeType, scopeId, 100);
    
    // Analyze different pattern types
    const contentPreferences = await this.analyzeContentPreferences(events);
    const correctionPatterns = await this.analyzeCorrectionPatterns(events);
    const stylePreferences = await this.analyzeStylePreferences(events);

    return {
      contentPreferences,
      correctionPatterns,
      stylePreferences,
    };
  }

  async updateLearningPatterns(userId: string, event: ContextMemoryEvent): Promise<void> {
    this.logger.log(`Updating learning patterns for event: ${event.eventType}`);

    try {
      switch (event.eventType) {
        case 'user_edit':
          await this.processUserEdit(userId, event);
          break;
        case 'feedback':
          await this.processFeedback(userId, event);
          break;
        case 'user_input':
          await this.processUserInput(userId, event);
          break;
        case 'chatbot_interaction':
          await this.processChatbotInteraction(userId, event);
          break;
      }
    } catch (error) {
      this.logger.error(`Failed to update learning patterns:`, error);
    }
  }

  async getContextualRecommendations(
    userId: string,
    slideType: string,
    currentContent: string,
    scopeType: ScopeType = 'deck',
    scopeId?: string
  ): Promise<any> {
    // Get relevant patterns
    const patterns = await this.getRelevantPatterns(userId, slideType, scopeType, scopeId);
    
    // Analyze current content
    const contentAnalysis = this.analyzeContent(currentContent);
    
    // Generate recommendations
    return this.generateRecommendations(patterns, contentAnalysis, slideType);
  }

  private async analyzeContentPreferences(events: ContextMemoryEvent[]): Promise<UserBehaviorProfile['contentPreferences']> {
    const editEvents = events.filter(e => e.eventType === 'user_edit');
    
    let totalLengthChanges = 0;
    let structureChanges = { bullets: 0, paragraphs: 0, mixed: 0 };
    let styleIndicators = { formal: 0, conversational: 0, technical: 0 };

    editEvents.forEach(event => {
      const content = event.content;
      
      // Analyze length preferences
      if (content.lengthChange) {
        totalLengthChanges += content.lengthChange;
      }
      
      // Analyze structure preferences
      if (content.addedBullets) structureChanges.bullets++;
      if (content.addedParagraphs) structureChanges.paragraphs++;
      if (content.mixedFormat) structureChanges.mixed++;
      
      // Analyze style indicators
      if (content.formalLanguage) styleIndicators.formal++;
      if (content.conversationalTone) styleIndicators.conversational++;
      if (content.technicalTerms) styleIndicators.technical++;
    });

    return {
      preferredLength: totalLengthChanges > 0 ? 'detailed' : totalLengthChanges < 0 ? 'concise' : 'detailed',
      writingStyle: this.getMaxKey(styleIndicators) as any,
      dataUsage: this.inferDataUsage(editEvents),
      structurePreference: this.getMaxKey(structureChanges) as any,
    };
  }

  private async analyzeCorrectionPatterns(events: ContextMemoryEvent[]): Promise<UserBehaviorProfile['correctionPatterns']> {
    const correctionEvents = events.filter(e => e.eventType === 'user_edit' || e.eventType === 'feedback');
    
    const commonEdits: string[] = [];
    const frequentFeedback: string[] = [];
    const rejectedSuggestions: string[] = [];

    correctionEvents.forEach(event => {
      if (event.eventType === 'user_edit' && event.content.editType) {
        commonEdits.push(event.content.editType);
      }
      
      if (event.eventType === 'feedback') {
        if (event.content.feedbackType === 'positive') {
          frequentFeedback.push(event.content.aspect);
        } else if (event.content.feedbackType === 'negative') {
          rejectedSuggestions.push(event.content.suggestion);
        }
      }
    });

    return {
      commonEdits: this.getFrequentItems(commonEdits),
      frequentFeedback: this.getFrequentItems(frequentFeedback),
      rejectedSuggestions: this.getFrequentItems(rejectedSuggestions),
    };
  }

  private async analyzeStylePreferences(events: ContextMemoryEvent[]): Promise<UserBehaviorProfile['stylePreferences']> {
    const allEvents = events;
    
    const toneIndicators = { professional: 0, persuasive: 0, analytical: 0 };
    const industries: string[] = [];
    const slideTypes: string[] = [];

    allEvents.forEach(event => {
      // Analyze tone preferences from content
      if (event.content.tone) {
        toneIndicators[event.content.tone]++;
      }
      
      // Track industry focus
      if (event.content.industry) {
        industries.push(event.content.industry);
      }
      
      // Track slide type expertise
      if (event.content.slideType) {
        slideTypes.push(event.content.slideType);
      }
    });

    return {
      tonePreference: this.getMaxKey(toneIndicators) as any,
      industryFocus: this.getFrequentItems(industries),
      slideTypeExpertise: this.getFrequentItems(slideTypes),
    };
  }

  private async processUserEdit(userId: string, event: ContextMemoryEvent): Promise<void> {
    // Analyze the edit to understand user preferences
    const editAnalysis = this.analyzeEditContent(event.content);
    
    // Update or create content preference pattern
    await this.updatePattern(userId, 'content_preference', event.learningScope, event.deckId, editAnalysis, 0.1);
  }

  private async processFeedback(userId: string, event: ContextMemoryEvent): Promise<void> {
    // Process user feedback to understand correction patterns
    const feedbackAnalysis = this.analyzeFeedbackContent(event.content);
    
    // Update correction pattern
    await this.updatePattern(userId, 'correction_pattern', event.learningScope, event.deckId, feedbackAnalysis, 0.2);
  }

  private async processUserInput(userId: string, event: ContextMemoryEvent): Promise<void> {
    // Analyze user input patterns for style preferences
    const inputAnalysis = this.analyzeInputContent(event.content);
    
    // Update style preference pattern
    await this.updatePattern(userId, 'style_preference', event.learningScope, event.deckId, inputAnalysis, 0.05);
  }

  private async processChatbotInteraction(userId: string, event: ContextMemoryEvent): Promise<void> {
    // Analyze chatbot interactions for user preferences
    const chatAnalysis = this.analyzeChatContent(event.content);
    
    // Update multiple pattern types based on chat content
    if (chatAnalysis.contentPreferences) {
      await this.updatePattern(userId, 'content_preference', event.learningScope, event.deckId, chatAnalysis.contentPreferences, 0.05);
    }
    
    if (chatAnalysis.stylePreferences) {
      await this.updatePattern(userId, 'style_preference', event.learningScope, event.deckId, chatAnalysis.stylePreferences, 0.05);
    }
  }

  private async getRecentEvents(
    userId: string,
    scopeType: ScopeType,
    scopeId?: string,
    limit: number = 50
  ): Promise<ContextMemoryEvent[]> {
    const queryBuilder = this.eventRepository.createQueryBuilder('event')
      .where('event.projectId IN (SELECT id FROM projects WHERE user_id = :userId)', { userId })
      .orderBy('event.created_at', 'DESC')
      .limit(limit);

    if (scopeType === 'deck' && scopeId) {
      queryBuilder.andWhere('event.deckId = :scopeId', { scopeId });
    } else if (scopeType === 'project' && scopeId) {
      queryBuilder.andWhere('event.projectId = :scopeId', { scopeId });
    }

    return await queryBuilder.getMany();
  }

  private async getRelevantPatterns(
    userId: string,
    slideType: string,
    scopeType: ScopeType,
    scopeId?: string
  ): Promise<LearningPattern[]> {
    const queryBuilder = this.patternRepository.createQueryBuilder('pattern')
      .where('pattern.userId = :userId', { userId })
      .andWhere('pattern.confidenceScore > :minConfidence', { minConfidence: 0.3 })
      .orderBy('pattern.confidenceScore', 'DESC');

    if (scopeType === 'deck' && scopeId) {
      queryBuilder.andWhere('(pattern.scopeType = :scopeType AND pattern.scopeId = :scopeId) OR pattern.scopeType = :globalScope',
        { scopeType: 'deck', scopeId, globalScope: 'global' });
    } else if (scopeType === 'project' && scopeId) {
      queryBuilder.andWhere('(pattern.scopeType = :scopeType AND pattern.scopeId = :scopeId) OR pattern.scopeType = :globalScope',
        { scopeType: 'project', scopeId, globalScope: 'global' });
    } else {
      queryBuilder.andWhere('pattern.scopeType = :globalScope', { globalScope: 'global' });
    }

    return await queryBuilder.getMany();
  }

  private async updatePattern(
    userId: string,
    patternType: PatternType,
    scopeType: ScopeType,
    scopeId: string,
    data: any,
    confidenceIncrease: number
  ): Promise<void> {
    let pattern = await this.patternRepository.findOne({
      where: {
        userId,
        patternType,
        scopeType,
        scopeId: scopeType === 'global' ? null : scopeId,
      },
    });

    if (pattern) {
      // Update existing pattern
      pattern.patternData = this.mergePatternData(pattern.patternData, data);
      pattern.confidenceScore = Math.min(1.0, pattern.confidenceScore + confidenceIncrease);
      pattern.lastReinforced = new Date();
    } else {
      // Create new pattern
      pattern = this.patternRepository.create({
        userId,
        patternType,
        scopeType,
        scopeId: scopeType === 'global' ? null : scopeId,
        patternData: data,
        confidenceScore: Math.max(0.1, confidenceIncrease),
      });
    }

    await this.patternRepository.save(pattern);
  }

  private analyzeContent(content: string): any {
    return {
      length: content.length,
      wordCount: content.split(' ').length,
      hasBullets: content.includes('•') || content.includes('-'),
      hasNumbers: /\d/.test(content),
      hasPercentages: /%/.test(content),
      hasCurrency: /\$/.test(content),
      sentenceCount: content.split('.').length - 1,
      complexity: this.calculateComplexity(content),
    };
  }

  private generateRecommendations(patterns: LearningPattern[], contentAnalysis: any, slideType: string): any {
    const recommendations = {
      contentSuggestions: [],
      styleSuggestions: [],
      structureSuggestions: [],
      confidenceScore: 0,
    };

    patterns.forEach(pattern => {
      if (pattern.patternType === 'content_preference') {
        recommendations.contentSuggestions.push(...this.generateContentSuggestions(pattern, contentAnalysis));
      } else if (pattern.patternType === 'style_preference') {
        recommendations.styleSuggestions.push(...this.generateStyleSuggestions(pattern, slideType));
      }

      recommendations.confidenceScore += pattern.confidenceScore;
    });

    recommendations.confidenceScore = Math.min(1.0, recommendations.confidenceScore / patterns.length);

    return recommendations;
  }

  private generateContentSuggestions(pattern: LearningPattern, contentAnalysis: any): string[] {
    const suggestions = [];
    const preferences = pattern.patternData;

    if (preferences.preferredLength === 'concise' && contentAnalysis.wordCount > 100) {
      suggestions.push('Consider making this content more concise based on your preferences');
    }

    if (preferences.dataUsage === 'heavy' && !contentAnalysis.hasNumbers) {
      suggestions.push('You typically include more data points - consider adding specific metrics');
    }

    if (preferences.structurePreference === 'bullet_points' && !contentAnalysis.hasBullets) {
      suggestions.push('You usually prefer bullet points for better readability');
    }

    return suggestions;
  }

  private generateStyleSuggestions(pattern: LearningPattern, slideType: string): string[] {
    const suggestions = [];
    const preferences = pattern.patternData;

    if (preferences.tonePreference === 'professional' && slideType === 'funding_ask') {
      suggestions.push('Maintain professional tone for investor appeal');
    }

    if (preferences.industryFocus?.includes('healthcare') && slideType === 'problem') {
      suggestions.push('Consider healthcare-specific pain points based on your focus');
    }

    return suggestions;
  }

  // Helper methods for analysis
  private getMaxKey(obj: Record<string, number>): string {
    return Object.keys(obj).reduce((a, b) => obj[a] > obj[b] ? a : b, Object.keys(obj)[0]);
  }

  private getFrequentItems(items: string[], minFrequency: number = 2): string[] {
    const frequency = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(frequency).filter(item => frequency[item] >= minFrequency);
  }

  private inferDataUsage(events: ContextMemoryEvent[]): 'minimal' | 'moderate' | 'heavy' {
    const dataIndicators = events.reduce((count, event) => {
      if (event.content.addedNumbers || event.content.addedMetrics) count++;
      return count;
    }, 0);

    const ratio = dataIndicators / events.length;
    if (ratio > 0.6) return 'heavy';
    if (ratio > 0.3) return 'moderate';
    return 'minimal';
  }

  private calculateComplexity(content: string): number {
    const avgWordsPerSentence = content.split('.').reduce((acc, sentence) => {
      return acc + sentence.trim().split(' ').length;
    }, 0) / content.split('.').length;

    const complexWords = content.split(' ').filter(word => word.length > 6).length;
    const complexityRatio = complexWords / content.split(' ').length;

    return (avgWordsPerSentence / 20) + complexityRatio;
  }

  private mergePatternData(existing: any, newData: any): any {
    // Merge pattern data intelligently
    const merged = { ...existing };

    Object.keys(newData).forEach(key => {
      if (typeof newData[key] === 'number' && typeof existing[key] === 'number') {
        // Average numeric values
        merged[key] = (existing[key] + newData[key]) / 2;
      } else if (Array.isArray(newData[key]) && Array.isArray(existing[key])) {
        // Merge arrays and remove duplicates
        merged[key] = [...new Set([...existing[key], ...newData[key]])];
      } else {
        // Replace with new value
        merged[key] = newData[key];
      }
    });

    return merged;
  }

  private analyzeEditContent(content: any): any {
    return {
      editType: content.editType || 'content_modification',
      lengthChange: content.lengthChange || 0,
      addedBullets: content.addedBullets || false,
      addedNumbers: content.addedNumbers || false,
      toneChange: content.toneChange || null,
    };
  }

  private analyzeFeedbackContent(content: any): any {
    return {
      feedbackType: content.feedbackType || 'neutral',
      aspect: content.aspect || 'general',
      suggestion: content.suggestion || '',
      sentiment: content.sentiment || 'neutral',
    };
  }

  private analyzeInputContent(content: any): any {
    return {
      inputLength: content.inputLength || 0,
      complexity: content.complexity || 0,
      tone: content.tone || 'neutral',
      industry: content.industry || null,
    };
  }

  private analyzeChatContent(content: any): any {
    return {
      contentPreferences: content.contentPreferences || null,
      stylePreferences: content.stylePreferences || null,
      requestType: content.requestType || 'general',
      satisfaction: content.satisfaction || null,
    };
  }
}
